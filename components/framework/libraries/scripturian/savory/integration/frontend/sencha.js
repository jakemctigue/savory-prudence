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

document.executeOnce('/savory/service/rpc/')
document.executeOnce('/prudence/resources/')

var Savory = Savory || {}

/**
 * Integration with Sencha's Ext JS client framework. Extensible
 * server-side implementations for Ext.data.Store and Ext.tree.TreeLoader,
 * with MongoDB integration.
 * <p>
 * See front-end companion utilities:
 *   /web/static/script/ext/savory/sencha.js
 * 
 * @namespace
 * @see Visit <a href="http://www.sencha.com/products/extjs/">Ext JS</a>
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Sencha = Savory.Sencha || function() {
	/** @exports Public as Savory.Sencha */
    var Public = {}

	/**
	 * An implementation of Ext Direct.
	 *
	 * @class
	 * @name Savory.Sencha.DirectResource
	 * @augments Savory.RPC.Resource
	 * 
	 * @param config
	 * @param {Object[]} [config.namespaces] A dict of namespaces
	 * @param {Object[]} [config.objects] A dict of objects
	 */
	Public.DirectResource = Sincerity.Classes.define(function(Module) {
		/** @exports Public as Savory.Sencha.DirectResource */
	    var Public = {}

	    /** @ignore */
	    Public._inherit = Savory.RPC.Resource

	    /** @ignore */
	    Public._configure = ['name', 'namespaces', 'objects']

	    /** @ignore */
	    Public._construct = function(config) {
			Savory.Sencha.DirectResource.prototype.superclass.call(this, this)
	    }

	    Public.mediaTypes = [
 			'application/json',
 			'application/x-www-form-urlencoded',
 			'text/plain'
 		]
	    
	    Public.handleGet = function(conversation) {
	    	var query = Prudence.Resources.getQuery(conversation, {
	    		namespace: 'string',
	    		human: 'bool'
	    	})

	    	var exports = {actions: {}}
	    	if (this.name) {
	    		exports.namespace = this.name
	    	}
	    	
	    	for (var n in this.namespaces) {
	    		var methods = this.namespaces[n]
	    		var action = exports.actions[n] = []
	    		for (var m in methods) {
	    			var method = methods[m]
	    			var directMethod = {
	    				name: m,
	    				len: method.arity
	    			}
	    			Sincerity.Objects.merge(directMethod, method)
	    			action.push(directMethod)
	    		}
	    	}
	    	
	    	return Sincerity.JSON.to(exports, query.human || false)
	    }
	    
	    Public.handlePost = function(conversation) {
	    	var query = Prudence.Resources.getQuery(conversation, {
	    		namespace: 'string',
	    		human: 'bool'
	    	})
	    	query.human = query.human || false

	    	if (query.namespace && (query.namespace != this.name)) {
	    		return Prudence.Resources.Status.ClientError.NotFound
	    	}
	    	
	    	var isWebForm = false
	    	var calls
	    	if (Sincerity.Objects.exists(conversation.entity) && (conversation.entity.mediaType == 'application/x-www-form-urlencoded')) {
	    		isWebForm = true
	    		
	    		// Unpack web form into the regular structure
	    		var web = Prudence.Resources.getEntity(conversation, 'web')
	    		calls = {}
	    		calls.type = web.extType
	    		delete web.extType
	    		calls.tid = web.extTID
	    		delete web.extTID
	    		calls.action = web.extAction
	    		delete web.extAction
	    		calls.method = web.extMethod
	    		delete web.extMethod
	    		calls.upload = (web.extUpload == 'true')
	    		delete web.extUpload
	    		calls.data = []
	    		for (var w in web) {
	    			calls.data.push(web[w])
	    		}
	    	}
	    	else {
	    		calls = Prudence.Resources.getEntity(conversation, 'json')
	    	}

	    	//application.logger.info(Sincerity.JSON.to(calls))
	    	
	    	calls = Sincerity.Objects.array(calls)
	    	for (var c in calls) {
	    		var call = calls[c]
	    		if ((call.type != 'rpc') || !call.tid || !call.action || !call.method) {
	    			return Prudence.Resources.Status.ClientError.BadRequest
	    		}
	    	}

	    	var results = []
	    	
	    	for (var c in calls) {
	    		var call = calls[c]

	    		var result
	    		var namespace = this.namespaces[call.action]
	    		if (namespace) {
	    			var method = namespace[call.method]
	    			if (method) {
						if (call.data && (call.data.length > method.arity)) {
							result = {
								type: 'exception',
								tid: call.tid,
								action: call.action,
								method: call.method,
								message: 'Too many arguments for method: {action}.{method}'.cast(call)
							}
						}
						else {
							var fn = method.fn
							if (fn) {
								try {
    								var context = method.scope ? method.scope : {
    									namespace: n,
    									definition: method,
    									resource: this,
    									conversation: conversation,
    									call: call
    								}
									result = fn.apply(context, call.data)
									result = {
										type: 'rpc',
										tid: call.tid,
										action: call.action,
										method: call.method,
										result: result
									}
								}
								catch (x) {
									var details = Sincerity.Rhino.getExceptionDetails(x)
									result = {
										type: 'exception',
										tid: call.tid,
										action: call.action,
										method: call.method,
										message: details.message,
										where: details.stackTrace
									}
								}
							}
							else {
								result = {
									type: 'exception',
									tid: call.tid,
									action: call.action,
									method: call.method,
									message: 'No function for: {action}.{method}'.cast(call)
								}
							}
						}
    				}
	    		}
	    		
	    		if (!result) {
	    			result = {
	    				type: 'exception',
	    				tid: call.tid,
	    				action: call.action,
	    				method: call.method,
	    				message: 'Unsupported action: {action}'.cast(call)
	    			}
	    		}
	    		
	    		results.push(result)
	    	}
	    	
	    	return Sincerity.JSON.to(results, query.human)
	    }

		return Public
	}(Public))

    return Public
}()