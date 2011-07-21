//
// This file is part of the Savory Framework for Prudence
//
// Copyright 2011 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the LGPL version 3.0:
// http://www.opensource.org/licenses/lgpl-3.0.html
//
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.executeOnce('/savory/service/rest/')
document.executeOnce('/savory/service/serials/')
document.executeOnce('/savory/foundation/classes/')
document.executeOnce('/savory/foundation/cryptography/')
document.executeOnce('/savory/foundation/xml/')
document.executeOnce('/savory/foundation/jvm/')
document.executeOnce('/savory/foundation/json/')
document.executeOnce('/savory/foundation/prudence/resources/')
document.executeOnce('/savory/foundation/prudence/lazy/')
document.executeOnce('/savory/foundation/prudence/logging/')

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
	 * @returns {Savory.Logging.Logger}
	 */
	Public.logger = Savory.Logging.getLogger('rpc')

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
	 * Installs the library's pass-throughs.
	 * <p>
	 * Can only be called from Prudence configuration scripts!
	 */
	Public.settings = function(uri) {
		resourcesPassThrough.push('/savory/service/rpc/resource/')
	}

	/**
	 * Installs the library's captures according the 'savory.service.rpc.routes'
	 * predefined global.
	 * <p>
	 * Can only be called from Prudence configuration scripts!
	 */
	Public.routing = function(uri) {
		var routes = predefinedGlobals['savory.service.rpc.routes'] || {}
		
		var capture = new com.threecrickets.prudence.util.CapturingRedirector(router.context, 'riap://application/savory/service/rpc/resource/?{rq}', false)
		for (var uri in routes) {
			var route = routes[uri]
			if (typeof route == 'string') {
				route = {
					module: route,
					type: 'json'
				}
			}
			var injector = new com.threecrickets.prudence.util.Injector(router.context, capture)
			injector.values.put('module', route.module)
			injector.values.put('type', route.type)
			router.attach(uri, injector)
		}

		router.hide('/savory/service/rpc/resource/')
	}
	
	Public.getLazyModules = function() {
		return Savory.Lazy.getGlobalList('savory.service.rpc.modules', Public.logger, function(constructor) {
			return eval(constructor)()
		})
	}
	
	Public.resetLazyModules = function() {
		Savory.Lazy.getGlobalList('savory.service.rpc.modules', Public.logger).reset()
	}
	
	/**
	 * 
	 * @param params
	 * @param {String} [params.object] You do not need this if params.methods is a detailed array
	 * @param {Object|Array|String} [params.methods=params.object]
	 * @param {String} [params.namespace=params.object]
	 * @param {String} [params.module] Uses the global module if not provided
	 * @param {String|String[]} [params.dependencies]
	 * @param {Boolean} [params.reset=false] True to reset parent namespace
	 * @param {Savory.RPC.Store} [params.store=Savory.RPC.getStore()]
	 */
	Public.exportMethods = function(params) {
		var module = params.module || '.'
		var dependencies = Savory.Objects.array(params.dependencies)
		var namespace = params.namespace || params.object
		var methods = params.methods || params.object
		if (Savory.Objects.isString(methods)) {
			for (var d in dependencies) {
				document.executeOnce(dependencies[d])
			}
			methods = eval(methods)
		}
		if (Savory.Objects.isDict(methods, true)) {
			var theMethods = []
			for (var m in methods) {
				var method = methods[m]
				if (typeof method == 'function') {
					theMethods.push(					{
						name: m,
						arity: method.length,
						fn: method,
						object: params.object
					})
				}
			}
			methods = theMethods
		}
		
		var store = params.store || Public.getStore()
		if (!store) {
			return
		}
		if (params.reset) {
			store.reset(module)
		}
		store.addToModule(module, namespace, methods, dependencies)
	}
	
	/**
	 * @param {String} [module] Uses the global module if not provided
	 * @param {Savory.RPC.Store} [store=Savory.RPC.getStore()]
	 */
	Public.getExportedModule = function(module, store) {
		store = store || Public.getStore()
		var exportedModule = store ? Public.getStore().getModule(module || '.') : null
		if (exportedModule && (exportedModule.name == '.')) {
			delete exportedModule.name
		}
		return exportedModule
	}
	
	Public.getFunction = function(method) {
		var fn = method.fn
		if (!fn) {
			try {
				var object = method.object
				if (object) {
					if (Savory.Objects.isString(object)) {
						object = eval(object)
					}
					if (Savory.Objects.exists(object)) {
						fn = object[method.name]
						// Store for later
						// TODO: Only some stores can support this without concurrency issues, so disable for now
						/*if (fn && (typeof fn == 'function')) {
							method.object = object
							method.fn = fn
						}*/
					}
				}
				else {
					fn = eval(method.name)
				}
			}
			catch (x) {
			}
		}
		return fn
	}
	
	/**
	 * XML-RPC spec.
	 * 
	 * @param {Savory.XML.Node} value
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
			return Savory.Cryptography.toBytesFromBase64(text)
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
		else if (Savory.Objects.isString(value)) {
			return {
				value: {
					string: String(value)
				}
			}
		}
		else if (Savory.Objects.isObject(value)) {
			if (Savory.Objects.isDate(value)) {
				return {
					value: {
						'dateTime.iso8601': value.format(iso8601format1, 'UTC')
					}
				}
			}
			else if (Savory.Objects.isArray(value)) {
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
			else if (Savory.Objects.isDict(value, true)) {
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
	 * @returns {Savory.RPC.Store}
	 */
	Public.getStore = function() {
		return Savory.Lazy.getGlobalEntry('savory.service.rpc.store', Public.logger, function(constructor) {
			return eval(constructor)()
		})
	}

	/**
	 * @class
	 * @name Savory.RPC.Store
	 */
	Public.Store = Savory.Classes.define(function() {
		/** @exports Public as Savory.RPC.Store */
		var Public = {}

		Public.reset = function(module) {}
		Public.addToModule = function(module, namespace, methods, dependencies) {}
		Public.getModule = function(module, forClient) {}
		
		return Public
	}())
	
	/**
	 * @class
	 * @name Savory.RPC.InThreadStore
	 * @augments Savory.RPC.Store
	 */
	Public.InThreadStore = Savory.Classes.define(function(Module) {
		/** @exports Public as Savory.RPC.InThreadStore */
		var Public = {}

		/** @ignore */
		Public._inherit = Module.Store
		
		/** @ignore */
		Public._construct = function() {
			this.exportedModules = {}
		}
		
		Public.reset = function(module) {
			delete this.exportedModules[module]
		}

		Public.addToModule = function(module, namespace, methods, dependencies) {
			var exportedModule = this.exportedModules[module]
			if (!exportedModule) {
				exportedModule = {
					name: module,
					namespaces: {},
					dependencies: dependencies
				}
				exportedModule.namespaces[namespace] = methods
				this.exportedModules[module] = exportedModule
			}
			else {
				exportedModule.dependencies = Savory.Objects.concatUnique(exportedModule.dependencies, dependencies)
				var existingMethods = namespace.namespaces[namespace]
				if (existingMethods) {
					exportedModule.namespaces[namespace] = methods
				}
				else {
					exportedModule.namespaces[namespace] = Savory.Objects.concatUnique(existingMethods, methods, function(a, b) {
						return a.name == b.name
					})
				}
			}
		}
	
		Public.getModule = function(module) {
			return this.exportedModules[module]
		}
		
		return Public
	}(Public))
	
	/**
	 * This implementation expects its map to always to exist in memory,
	 * so it can work with application.globals and application.sharedGlobals, but
	 * <b>not</b> use this with application.distributedGlobals or other serialized maps.
	 * For a distributed store, see {@link Savory.RPC.DistributedStore}.
	 * 
	 * @class
	 * @name Savory.RPC.MapStore
	 * @augments Savory.RPC.Store
	 */
	Public.MapStore = Savory.Classes.define(function(Module) {
		/** @exports Public as Savory.RPC.MapStore */
		var Public = {}

		/** @ignore */
		Public._inherit = Module.Store

		/** @ignore */
		Public._construct = function(map, prefix) {
			this.map = map
			this.prefix = prefix ||'savory.service.rpc.mapStore.'
		}
		
		Public.reset = function(module) {
			module = this.prefix + module
			this.map.remove(module)
		}
		
		Public.addToModule = function(module, namespace, methods, dependencies) {
			module = this.prefix + module
			var theModule = this.map.get(module)
			if (!Savory.Objects.exists(theModule)) {
				theModule = {
					name: module,
					namespaces: Savory.JVM.newMap(true),
					dependencies: Savory.JVM.newSet(true)
				}
				var existing = this.map.putIfAbsent(module, theModule)
				if (Savory.Objects.exists(existing)) {
					theModule = existing
				}
			}
			for (var d in dependencies) {
				theModule.dependencies.add(dependencies[d])
			}
			var theNamespace = theModule.namespaces.get(namespace)
			if (!Savory.Objects.exists(theNamespace)) {
				theNamespace = Savory.JVM.newList(true)
				var existing = theModule.namespaces.putIfAbsent(namespace, theNamespace)
				if (Savory.Objects.exists(existing)) {
					theNamespace = existing
				}
			}
			for (var m in methods) {
				theNamespace.add(methods[m])
			}
		}
	
		Public.getModule = function(module) {
			var name = this.prefix + module
			var theModule = this.map.get(name)
			if (Savory.Objects.exists(theModule)) {
				var namespaces = {}
				for (var i = theModule.namespaces.entrySet().iterator(); i.hasNext(); ) {
					var entry = i.next()
					namespaces[entry.key] = Savory.Objects.clone(Savory.JVM.fromCollection(entry.value))
				}
				return {
					name: module,
					namespaces: namespaces,
					dependencies: Savory.JVM.fromCollection(theModule.dependencies)
				}
			}
			return null
		}
		
		return Public
	}(Public))

	/**
	 * @class
	 * @name Savory.RPC.DistributedStore
	 * @augments Savory.RPC.Store
	 */
	Public.DistributedStore = Savory.Classes.define(function(Module) {
		/** @exports Public as Savory.RPC.DistributedStore */
		var Public = {}
	
		/** @ignore */
		Public._inherit = Module.Store
		
	    /** @ignore */
	    Public._construct = function(name) {
	    	name = name || 'savory.service.rpc.distributedStore'
			this.dependencies = com.hazelcast.core.Hazelcast.getMultiMap(name + '.dependencies')
			this.namespaces = com.hazelcast.core.Hazelcast.getMultiMap(name + '.namespaces')
			this.methods = com.hazelcast.core.Hazelcast.getMultiMap(name + '.methods')

			//this.listeners = com.hazelcast.core.Hazelcast.getMap(name + '.listeners')
	    }

		Public.reset = function(module) {
			this.dependencies.remove(module)
			var namespaces = this.namespaces.get(module)
			if (Savory.Objects.exists(namespaces)) {
				namespaces = Savory.JVM.fromCollection(namespaces)
			}
			if (namespaces) {
				for (var n in namespaces) {
					this.methods.remove(module + '/' + namespaces[n])
				}
			}
			this.namespaces.remove(module)
		}
		
		Public.addToModule = function(module, namespace, methods, dependencies) {
			for (var d in dependencies) {
				this.dependencies.put(module, dependencies[d])
			}
			this.namespaces.put(module, namespace)
			var name = module + '/' + namespace
			for (var m in methods) {
				var method = Savory.Objects.clone(methods[m])
				delete method.fn
				this.methods.put(name, Savory.JSON.to(method))
			}
		}
	
		Public.getModule = function(module) {
			var namespaces = {}
			var namespaceNames = this.namespaces.get(module)
			if (Savory.Objects.exists(namespaceNames)) {
				namespaceNames = Savory.JVM.fromCollection(namespaceNames)
			}
			if (namespaceNames) {
				for (var n in namespaceNames) {
					var methods = this.methods.get(module + '/' + namespaceNames[n])
					if (Savory.Objects.exists(methods)) {
						methods = Savory.JVM.fromCollection(methods)
						var namespace = namespaces[namespaceNames[n]] = []
						for (var m in methods) {
							namespace.push(Savory.JSON.from(methods[m]))
						}
					}
				}
			}
			return {
				name: module,
				namespaces: namespaces,
				dependencies: Savory.JVM.fromCollection(this.dependencies.get(module))
			}
		}

		return Public
	}(Public))

	/**
	 * @class
	 * @name Savory.RPC.MongoDbStore
	 * @augments Savory.RPC.Store
	 */
	Public.MongoDbStore = Savory.Classes.define(function(Module) {
		/** @exports Public as Savory.RPC.MongoDbStore */
		var Public = {}

		/** @ignore */
		Public._inherit = Module.Store

		/** @ignore */
		Public._construct = function(collection) {
			this.collection = collection || 'rpc'
			this.collection = Savory.Objects.isString(this.collection) ? new MongoDB.Collection(this.collection) : this.collection
			this.collection.ensureIndex({name: 1}, {unique: true})
		}

		Public.reset = function(module) {
			this.collection.remove({name: module}, true)
		}
		
		Public.addToModule = function(module, namespace, methods, dependencies) {
			// Prune functions from namespaces before sending to MongoDB
			methods = Savory.Objects.clone(methods)
			for (var m in methods) {
				delete methods[m].fn
			}
	
			var update = {$pushAll: {}, $addToSet: {dependencies: {$each: dependencies}}}
			update.$pushAll['namespaces.' + namespace] = methods
			this.collection.upsert({name: module}, update)
		}
	
		Public.getModule = function(module) {
			var exportedModule = this.collection.findOne({name: module})
			if (exportedModule) {
				delete exportedModule._id
			}
			return exportedModule
		}
		
		return Public
	}(Public))
	
	/**
	 * For XML-RPC, you can force specific types via the special '_' dict key.
	 * 
	 * TODO: batch support
	 * 
	 * @class
	 * @name Savory.RPC.Client
	 * @param {Object|String} config
	 * @param {String} config.uri
	 * @param {String} [config.type='json']
	 * @param {String} [config.version='2.0']
	 */
	Public.Client = Savory.Classes.define(function(Module) {
		/** @exports Public as Savory.RPC.Client */
		var Public = {}
		
		/** @ignore */
		Public._construct = function(config) {
			if (Savory.Objects.isString(config)) {
				config = {uri: String(config)}
			}
			this.uri = config.uri
			this.type = config.type || 'json'
			this.version = config.version || '2.0'
		}
		
		Public.createFunction = function(method) {
			var client = this
			return function() {
				return client.call({
					method: method,
					arguments: Savory.Objects.slice(arguments)
				})
			}
		}
		
		Public.createNamespace = function(name, methods) {
			var namespace = {}
			for (var m in methods) {
				var method = methods[m]
				namespace[method] = this.createFunction(name + '.' + method)
			}
			return namespace
		}
		
		/**
		 * @param {Object|String} params
		 * @param {String} params.method
		 * @param {Array} [params.arguments]
		 * @throws {code:code, message:'message'}
		 */
		Public.call = function(params) {
			if (Savory.Objects.isString(params)) {
				params = {method: String(params)}
			}
			
			var id

			var payload
			if (this.type == 'xml') {
				payload = {
					methodCall: {
						methodName: params.method,
						params: {
							param: []
						}
					}
				}
				for (var a in params.arguments) {
					payload.methodCall.params.param.push(Module.toXmlValue(params.arguments[a]))
				}
				//Module.logger.info(Savory.XML.to(payload))
			}
			else {
				id = Savory.Serials.next('savory.service.rpc.client')
				payload = {
					method: params.method,
					params: params.arguments,
					id: id
				}
				switch (this.version) {
					case '2.0':
						payload.jsonrpc = this.version
						break
					case '1.1':
						payload.version = this.version
						break
				}
			}
			
			var result = Savory.Resources.request({
				uri: this.uri,
				method: 'post',
				mediaType: this.type == 'xml' ? 'application/xml' : 'application/json',
				payload: {
					type: this.type,
					value: payload
				}
			})
			
			if (this.type == 'xml') {
				if (result) {
					var methodResponses = result.getElements('methodResponse')
					if (methodResponses.length) {
						var methodResponse = methodResponses[0]
						var fault = methodResponse.getElements('fault')
						if (fault.length) {
							var values = fault[0].getElements('value')
							if (values.length) {
								var value = Module.fromXmlValue(values[0])
								throw {
									code: value.faultCode,
									message: value.faultString
								}
							}
							throw {
								message: 'Invalid XML-RPC fault response'
							}
						}
						else {
							var params = methodResponse.getElements('params')
							if (params.length) {
								var param = params[0].getElements('param')
								if (param.length) {
									var value = param[0].getElements('value')
									if (value.length) {
										return Module.fromXmlValue(value[0])
									}
								}
							}
							throw {
								message: 'Invalid XML-RPC response'
							}
						}
					}
				}
				
				return null
			}
			else {
				if (!result) {
					// Notification calls do not return anything
					return null
				}
				
				if (result.id != id) {
					throw {
						message: 'Server returned an unknown call ID'
					}
				}
				
				if (result.error) {
					if (result.error.code) {
						throw {
							code: result.error.code,
							message: result.error.message
						}
					}
					else {
						throw {
							code: result.error
						}
					}
				}
				
				return result.result
			}
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