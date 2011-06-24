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

document.executeOnce('/savory/service/rpc/')
document.executeOnce('/savory/foundation/rhino/')
document.executeOnce('/savory/foundation/json/')
document.executeOnce('/savory/foundation/prudence/resources/')

// Makes sure that lazy modules are reset at the same time as this document is reset
Savory.RPC.resetLazyModules()

/** @ignore */
function handleInit(conversation) {
    conversation.addMediaTypeByName('application/json')
    conversation.addMediaTypeByName('text/plain')
}

/** @ignore */
function handleGet(conversation) {
	var query = Savory.Resources.getQuery(conversation, {
		namespace: 'string',
		human: 'bool'
	})

	Savory.RPC.getLazyModules()
	var module = Savory.RPC.getExportedModule(query.namespace, true)
	if (!module) {
		return Savory.Resources.Status.ClientError.NotFound
	}
	
	// Convert to Ext Direct representation
	var exports = {actions: {}}
	if (module.name) {
		exports.namespace = module.name
	}
	for (var namespace in module.namespaces) {
		var methods = module.namespaces[namespace]
		var action = exports.actions[namespace] = []
		for (var m in methods) {
			var method = methods[m]
			action.push({
				name: method.name,
				len: method.arity
			})
		}
	}
	
	return Savory.JSON.to(exports, query.human || false)
}

/** @ignore */
function handlePost(conversation) {
	var query = Savory.Resources.getQuery(conversation, {
		namespace: 'string',
		human: 'bool'
	})
	var calls = Savory.Resources.getEntity(conversation, 'json')

	//application.logger.info(Savory.JSON.to(calls))
	
	calls = Savory.Objects.array(calls)
	for (var c in calls) {
		var call = calls[c]
		if ((call.type != 'rpc') || !call.tid || !call.action || !call.method) {
			return Savory.Resources.Status.ClientError.BadRequest
		}
	}

	var results = []

	var module = Savory.RPC.getExportedModule(query.namespace)
	if (!module) {
		return Savory.Resources.Status.ClientError.NotFound
	}
	
	if (module.dependencies) {
		for (var d in module.dependencies) {
			document.executeOnce(module.dependencies[d])
		}
	}

	for (var c in calls) {
		var call = calls[c]

		var result
		for (var namespace in module.namespaces) {
			if (call.action == namespace) {
				var methods = module.namespaces[namespace]
				for (var m in methods) {
					var method = methods[m]
					if (call.method == method.name) {
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
							var fn = Savory.RPC.getFunction(method)
							if (fn) {
								//application.logger.info(fn)
								try {
									result = fn.apply(null, call.data)
									result = {
										type: 'rpc',
										tid: call.tid,
										action: call.action,
										method: call.method,
										result: result
									}
								}
								catch (x) {
									var details = Savory.Rhino.getExceptionDetails(x)
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
						
						break
					}
				}
	
				if (!result) {
					result = {
						type: 'exception',
						tid: call.tid,
						action: call.action,
						method: call.method,
						message: 'Unsupported method: {action}.{method}'.cast(call)
					}
				}
				
				break
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
	
	return Savory.JSON.to(results, query.human || false)
}
