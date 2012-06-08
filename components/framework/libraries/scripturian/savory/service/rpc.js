//
// This file is part of the Savory Framework for Prudence
//
// Copyright 2011 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the LGPL version 3.0:
// http://www.gnu.org/copyleft/lesser.html
//
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.executeOnce('/savory/service/rest/')
document.executeOnce('/sincerity/classes/')
document.executeOnce('/sincerity/objects/')
document.executeOnce('/sincerity/json/')
document.executeOnce('/sincerity/xml/')
document.executeOnce('/sincerity/cryptography/')

/**
 * Export plain-old JavaScript methods to be called via XML-RPC, JSON-RPC and other
 * Remote Procedure Call standards. Also provides a client for very calling XML-RPC and
 * JSON-RPC.
 * <p>
 * This library adheres to the specs as much as elegantly possible, but some things
 * would just be awkward in JavaScript. So, for introspection ('system.methodSignature')
 * we simply list all arguments as type 'struct', including the return value.  
 * We also do not support calls with named params for functions. 
 * <p>
 * Note that batch mode for JSON-RPC 2.0 <i>is</i> supported!
 * 
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 * 
 * @see Visit the <a href="http://www.xmlrpc.com/spec">XML-RPC</a> spec;
 * @see Visit the <a href="http://groups.google.com/group/json-rpc/web/json-rpc-2-0">JSON-RPC</a> spec
 */
Savory.RPC = Savory.RPC || function() {
	/** @exports Public as Savory.RPC */
    var Public = {}
    
	/**
	 * The library's logger.
	 *
	 * @field
	 * @returns {Prudence.Logging.Logger}
	 */
	Public.logger = Prudence.Logging.getLogger('rpc')

	/**
	 * @namespace
	 * 
	 * @see Visit the <a href="http://xmlrpc-epi.sourceforge.net/specs/rfc.fault_codes.php">RFC</a>
	 */
	Public.Fault = {
    	/** @constant */
    	ParseError: -32700,
    	/** @constant */
    	UnsupportedEncoding: -32701,
    	/** @constant */
    	InvalidCharacter: -32702,
    	/** @constant */
    	InvalidRequest: -32600,
    	/** @constant */
    	MethodNotFound: -32601,
    	/** @constant */
    	InvalidParams: -32602,
    	/** @constant */
    	ServerError: -32603,
    	/** @constant */
    	ApplicationError: -32500,
    	/** @constant */
    	SystemError: -32400,
    	/** @constant */
    	GatewayError: -32300
    }

	/**
	 * XML-RPC spec.
	 * 
	 * @param {Sincerity.XML.Node} value
	 */
	Public.fromXmlValue = function(value) {
		var nil = value.getElements('nil')
		if (nil.length) {
			return null
		}
		
		var string = value.getElements('string')
		if (string.length) {
			return string[0].getText()
		}

		var bool = value.getElements('boolean')
		if (bool.length) {
			var text = bool[0].getText()
			return text == '1'
		}
		
		var doub = value.getElements('double')
		if (doub.length) {
			var text = doub[0].getText()
			return Number(text)
		}
		
		var i4 = value.getElements('i4')
		if (i4.length) {
			var text = i4[0].getText()
			return Number(text)
		}
		
		var integer = value.getElements('int')
		if (integer.length) {
			var text = integer[0].getText()
			return Number(text)
		}

		var base64 = value.getElements('base64')
		if (base64.length) {
			var text = base64[0].getText()
			return Sincerity.Cryptography.toBytesFromBase64(text)
		}
		
		var dateTime = value.getElements('dateTime.iso8601')
		if (dateTime.length) {
			var text = dateTime[0].getText()
			try {
				return text.parseDateTime(iso8601format1, 'UTC')
			}
			catch (x) {
				return text.parseDateTime(iso8601format2, 'UTC')
			}
		}
		
		var array = value.getElements('array')
		if (array.length) {
			var data = array[0].getElements('data')
			var r = []
			if (data.length) {
				var values = data[0].getElements('value')
				for (var v in values) {
					r.push(Public.fromXmlValue(values[v]))
				}
			}
			return r
		}

		var struct = value.getElements('struct')
		if (struct.length) {
			var members = struct[0].getElements('member')
			var r = {}
			for (var m in members) {
				var member = members[m]
				var name = member.getElements('name')
				if (name.length) {
					name = name[0].getText()
					if (name) {
						var v = member.getElements('value')
						if (v.length) {
							r[name] = Public.fromXmlValue(v[0])
						}
					}
				}
			}
			return r
		}

		return null
	}
	
	/**
	 * XML-RPC spec.
	 */
	Public.toXmlValue = function(value) {
		if (value === null) {
			return {
				value: {
					nil: ''
				}
			}
		}
		else if (typeof value == 'boolean') {
			return {
				value: {
					'boolean': value ? '1' : '0'
				}
			}
		}
		else if (typeof value == 'number') {
			return {
				value: {
					'double': value
				}
			}
		}
		else if (Sincerity.Objects.isString(value)) {
			return {
				value: {
					string: String(value)
				}
			}
		}
		else if (Sincerity.Objects.isObject(value)) {
			if (Sincerity.Objects.isDate(value)) {
				return {
					value: {
						'dateTime.iso8601': value.format(iso8601format1, 'UTC')
					}
				}
			}
			else if (Sincerity.Objects.isArray(value)) {
				var array = []
				for (var i in value) {
					array.push(Public.toXmlValue(value[i]))
				}
				return {
					value: {
						array: {
							data: array
						}
					}
				}
			}
			else if (Sincerity.Objects.isDict(value, true)) {
				if (value._) {
					return {
						value: value._
					}
				}
				
				var array = []
				for (var k in value) {
					array.push({
						name: k,
						value: Public.toXmlValue(value[k]).value
					})
				}
				return {
					value: {
						struct: {
							member: array
						}
					}
				}
			}
		}
		return ''
	}

	/**
	 * 
	 * @class
	 * @name Savory.RPC.Resource
	 * @augments Savory.REST.Resource
	 * 
	 * @param config
	 * @param {Object[]} config.namespaces
	 */
	Public.Resource = Sincerity.Classes.define(function(Module) {
		/** @exports Public as Savory.RPC.Resource */
	    var Public = {}

	    /** @ignore */
	    Public._inherit = Savory.REST.Resource

	    /** @ignore */
	    Public._configure = ['namespace', 'namespaces', 'object', 'objects']

	    /** @ignore */
	    Public._construct = function(config) {
	    	this.namespaces = this.namespaces || {}

	    	if (this.namespace) {
	    		this.namespaces = {'.': this.namespace}
	    	}

	    	for (var n in this.namespaces) {
	    		var namespace = this.namespaces[n]
	    		for (var m in namespace) {
	    			var method = namespace[m]
	    			if (typeof method == 'function') {
	    				namespace[m] = {
	    					fn: method,
	    					arity: method.length
	    				}
	    			}
	    			else {
	    				if (!Sincerity.Objects.exists(method.arity)) {
	    					method.arity = method.fn.length
	    				}
	    			}
	    		}
	    	}

	    	if (this.object) {
	    		this.objects = {'.': this.objects}
	    	}

	    	if (Sincerity.Objects.exists(this.objects)) {
		    	for (var o in this.objects) {
		    		var object = this.objects[o]
		    		this.namespaces[o] = {}
		    		for (var m in object) {
		    			var method = object[m]
		    			if (typeof method == 'function') {
		    				this.namespaces[o][m] = {
		    					fn: method,
		    					arity: method.length,
		    					scope: object
		    				}
		    			}
		    		}
		    	}
	    	}

			Savory.RPC.Resource.prototype.superclass.call(this, this)
	    }

	    Public.mediaTypes = [
			'application/json',
			'application/xml',
			'application/java',
			'text/plain',
			'text/html'
		]

	    Public.handlePost = function(conversation) {
	    	var entity = conversation.entity ? conversation.entity.text : null
	    	var calls = []
	    	var isBatch = false
	    	var faultCode = null
	    	var value = null
	    	
	    	var type = conversation.query.get('type') || conversation.locals.get('type')
	    	var mediaType = conversation.entity ? conversation.entity.mediaType : conversation.mediaTypeName
	    	var isXml = (mediaType == 'application/xml') || (mediaType == 'text/xml') || (type == 'xml')
	    	if (isXml) {
	    		// Try XML-RPC
	    		var doc
	    		try {
	    			doc = Sincerity.XML.from(entity)
	    		}
	    		catch (x) {
	    			faultCode = Module.Fault.ParseError
	    			value = 'Malformed XML'
	    		}
	    		if (doc) {
	    			// Convert to our call format (identical to JSON-RPC's!)
	    			var methodCalls = doc.getElements('methodCall')
	    			if (methodCalls.length) {
	    				var methodCall = methodCalls[0]
	    				var methodName = methodCall.getElements('methodName')
	    				if (methodName.length) {
	    					var call = {}
	    					call.method = methodName[0].getText()
	    					call.params = []
	    					var params = methodCall.getElements('params')
	    					if (params.length) {
	    						params = params[0].getElements('param')
	    						for (var p in params) {
	    							var param = params[p]
	    							var values = param.getElements('value')
	    							if (values.length) {
	    								var value = values[0]
	    								call.params.push(Module.fromXmlValue(value))
	    							}
	    						}
	    					}
	    					calls.push(call)
	    				}
	    			}
	    		}
	    	}
	    	else {
	    		// Try JSON-RPC
	    		try {
	    			calls = Sincerity.JSON.from(entity)
	    			isBatch = Sincerity.Objects.isArray(calls)
	    			if (!isBatch) {
	    				calls = [calls]
	    			}
	    		}
	    		catch (x) {
	    			faultCode = Module.Fault.ParseError
	    			value = 'Malformed JSON'
	    		}
	    	}
	    	
	    	// Process calls
	    	var results = []
	    	for (var c in calls) {
	    		var call = calls[c]

	    		if (!call.method) {
	    			faultCode = Module.Fault.InvalidRequest
	    			value = 'Method name not provided'
	    		}
	    		
	    		if (!call.params) {
	    			call.params = []
	    		}
	    		
	    		if (!faultCode) {
	    			if (call.method == 'system.getCapabilities') {
	    				if (call.params.length) {
	    					faultCode = Module.Fault.InvalidParams
	    					value = 'Too many params'
	    				}
	    				else {
	    					value = {
	    						faults_interop: {
	    							specUrl: 'http://xmlrpc-epi.sourceforge.net/specs/rfc.fault_codes.php',
	    							specVersion: {_: {'int': 20010516}}
	    						}
	    					}
	    				}
	    			}
	    			else if (call.method == 'system.listMethods') {
	    				if (call.params.length) {
	    					faultCode = Module.Fault.InvalidParams
	    					value = 'Too many params'
	    				}
	    				else {
	    					value = []
	    					for (var n in this.namespaces) {
	    						var methods = this.namespaces[n]
	    						for (var m in methods) {
	    							value.push(n == '.' ? m : n + '.' + m)
	    						}
	    					}
	    				}
	    			}
	    			else if (call.method == 'system.methodSignature') {
	    				if (call.params.length > 1) {
	    					faultCode = Module.Fault.InvalidParams
	    					value = 'Too many params'
	    				}
	    				else {
	    					var find = call.params.length ? findMethod.call(this, call.params[0]) : null
	    					if (find) {
	    						value = []
	    						// Return value
	    						value.push('struct')
	    						// Arguments
	    						for (var a = find.method.arity; a > 0; a--) {
	    							value.push('struct')
	    						}
	    					}
	    					else {
	    						faultCode = Module.Fault.ServerError
	    						if (call.params.length) {
	    							value = 'Method not found: ' + call.params[0]
	    						}
	    						else {
	    							value = 'No method specified'
	    						}
	    					}
	    				}
	    			}
	    			else if (call.method == 'system.methodHelp') {
	    				if (call.params.length > 1) {
	    					faultCode = Module.Fault.InvalidParams
	    					value = 'Too many params'
	    				}
	    				else {
	    					var find = call.params.length ? findMethod.call(this, call.params[0]) : null
	    					if (find) {
	    						value = find.method.help || call.params[0]
	    					}
	    					else {
	    						faultCode = Module.Fault.ServerError
	    						if (call.params.length) {
	    							value = 'Method not found: ' + call.params[0]
	    						}
	    						else {
	    							value = 'No method specified'
	    						}
	    					}
	    				}
	    			}
	    			else {
	    				var find = findMethod.call(this, call.method)
	    				if (find) {
	    					if (call.params.length > find.method.arity) {
	    						faultCode = Module.Fault.InvalidParams
	    						value = 'Too many params'
	    					}
	    					else {
	    						var fn = find.method.fn
	    						if (fn) {
	    							try {
	    								var context = find.method.scope ? find.method.scope : {
	    									namespace: find.namespace,
	    									definition: find.method,
	    									resource: this,
	    									conversation: conversation,
	    									call: call
	    								}
	    								value = fn.apply(context, call.params)
	    							}
	    							catch (x) {
	    								if (typeof x == 'number') {
	    									faultCode = x
	    									value = 'Error'
	    								}
	    								else if (typeof x.code == 'number') {
	    									faultCode = x.code
	    									value = x.message || 'Error'
	    								}
	    								else {
	    									var details = Sincerity.Rhino.getExceptionDetails(x)
	    									faultCode = Module.Fault.ServerError
	    									value = details.message
	    								}
	    							}
	    						}
	    						else {
	    							faultCode = Module.Fault.ServerError
	    							value = 'No function for method: ' + call.method
	    						}
	    					}
	    				}
	    				else {
	    					faultCode = Module.Fault.MethodNotFound
	    					value = 'Unknown method: ' + call.method
	    				}
	    			}
	    		}
	    		
	    		if (isXml) {
	    			var result
	    			if (faultCode) {
	    				result = {
	    					fault: Module.toXmlValue({
	    						faultCode: {_: {'int': faultCode}},
	    						faultString: value
	    					})
	    				}
	    			}
	    			else {
	    				result = {
	    					params: {
	    						param: Module.toXmlValue(value)
	    					}
	    				}
	    			}
	    			
	    			results.push(result)
	    		}
	    		// In JSON-RPC, if no ID is supplied, do not return a result (called a 'notification call')
	    		else if (faultCode || Sincerity.Objects.exists(call.id)) {
	    	    	var result = {
	    	    		id: call.id || null
	    	    	}
	    	
	    	    	// In 2.0, 'jsonrpc' is used, in 1.1 'version' is used
	    	    	var version = call.jsonrpc || call.version || '1.0'
	    	    	
	    	    	if (faultCode) {
	    	    		result.result = null
	    		    	switch (version) {
	    		    		case '2.0':
	    			    		result.error = {
	    		    				code: faultCode,
	    		    				message: value
	    			    		}
	    		    			break
	    		    		default:
	    		    			result.error = faultCode
	    		    			break
	    		    	}
	    	    	}
	    	    	else {
	    	    		result.result = value
	    	    		result.error = null
	    	    	}
	    	    	
	    	    	switch (version) {
	    	    		case '2.0':
	    	    			result.jsonrpc = '2.0'
	    	    			break
	    	    		case '1.1':
	    	    			result.version = '1.1'
	    	    			break
	    	    	}
	    	    	
	    	    	results.push(result)
	    		}
	    	}
	    	
	    	if (isXml) {
	    		if (results.length) {
	    			// XML-RPC does not have a batch mode
	    			var xml = Sincerity.XML.to({methodResponse: results[0]})
	    			if (conversation.query.get('human') == 'true') {
	    				xml = Sincerity.XML.humanize(xml)
	    			}
	    			return xml
	    		}
	    	}
	    	else {
	    		if (results.length) {
	    			if (isBatch) {
	    				return Sincerity.JSON.to(results, conversation.query.get('human') == 'true')
	    			}
	    			else {
	    				return Sincerity.JSON.to(results[0], conversation.query.get('human') == 'true')
	    			}
	    		}
	    	}
	    	return null
	    }

		//
		// Private
		//

		function findMethod(methodName) {
			var namespace, methods, name
			var split = methodName.split('.', 2)
			if (split.length == 2) {
				namespace = this.namespaces[split[0]]
				name = split[1]
			}
			else {
				namespace = this.namespaces['.']
				name = methodName
			}
		
			return (namespace && namespace[name]) ? {namespace: namespace, method: namespace[name]} : null
		}
	    
		return Public
	}(Public))
	
	//
	// Initialization
	//

	var iso8601format1 = "yyyyMMdd'T'HH:mm:ssz"
	var iso8601format2 = "yyyyMMdd'T'HH:mm:ss"

	return Public
}()