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

document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/json/')
document.executeOnce('/savory/foundation/prudence/logging/')

var Savory = Savory || {}

/**
 * Flexible, JavaScript-friendly wrapper over Prudence's task API. Can be used to start asynchronous tasks, whether
 * in-process or distributed (via a Hazelcast cluster). JavaScript closures can be sent as-is to execute
 * anywhere!
 * <p>
 * Note: This library modifies the {@link Function} prototype.
 * 
 * @namespace
 * @see Visit the <a href="http://www.hazelcast.com/">Hazelcast site</a>
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Tasks = Savory.Tasks || function() {
	/** @exports Public as Savory.Tasks */
    var Public = {}

	/**
	 * The library's logger.
	 *
	 * @field
	 * @returns {Savory.Logging.Logger}
	 */
	Public.logger = Savory.Logging.getLogger('tasks')

	/**
	 * Starts a task in another thread, or even another JVM.
	 * <p>
	 * A JavaScript-friendly wrapper over Prudence's application.task and application.distributedTask.
	 * <p>
	 * The argument can be a full params, or two shortcuts: a string (which becomes params.name), or a
	 * function (which becomes params.fn).
	 * 
	 * @param params All params will be merged into the context, as key 'savory.task'
	 * @param {String} [params.name] The /tasks/ document to execute
	 * @param {String} [params.entryPoint=null] An optional entry point in the document (null or undefined to execute
	 *        the entire document)
	 * @param {Function|String} [params.fn] The function to call (if not present, params.name will default
	 *        to '/savory/call-task-fn/'); will be called with the context as the argument
	 * @param [params.context] The context to send to the task (will be made available there as document.context,
	 *        must be serializable for distributed tasks)
	 * @param {Boolean} [params.json=true] True to serialize params.context into JSON; note that distributed
	 *        tasks must have a serializable params.context, so it's good practice to always serialize, unless
	 *        you really need to optimize performance for in-process tasks
	 * @param {Boolean} [params.pure=false] True to keep params.context pure, without special additions from this
	 *        library; implies params.json=false
	 * @param {Number} [params.block=0] If greater than zero, will block for a maximum of duration in milliseconds
	 *        waiting for task to finish execution
	 * @param {Number} [params.delay=0] The delay in milliseconds before starting the task (ignored for distributed tasks)
	 * @param {Number} [params.repeatEvery=0] How often in milliseconds to repeat the task (see params.fixedRepeat),
	 *        zero means the task is executed only once (ignored for distributed tasks)
	 * @param {Boolean} [params.fixedRepeat=false] True if repetition should be fixed according to params.repeatEvery,
	 *        otherwise the delay until the next repetition would begin only when the task finishes an
	 *        execution
	 * @param {Boolean} [params.distributed=false] True to distribute the task
	 * @param {String} [params.application] Application's full name (defaults to name of current application)
	 * @param {Boolean} [params.multi=false] True to distribute task to all members of the cluster
	 * @param [params.where] Where to distribute the task (leave empty to let Hazelcast decide)
	 * @returns {java.util.concurrent.Future}
	 */
	Public.task = function(params) {
		if (Savory.Objects.isString(params)) {
			params = {name: params}
		}
		else if (typeof params == 'function') {
			params = {fn: String(params)}
		}
		else {
			params = Savory.Objects.clone(params)
		}

		if (params.fn) {
			if (typeof params.fn == 'function') {
				params.fn = String(params.fn)
			}
			params.name = params.name || '/savory/call-task-fn/'
			params.entryPoint = params.entryPoint || 'call'
		}
		
		var extraContext = {
			'savory.task': Savory.Objects.clone(params)
		}
		
		if (!params.pure) {
			params.context = params.context || {}
			Savory.Objects.merge(params.context, extraContext)
		}

		params.json = params.json === undefined ? (params.pure ? false : true) : params.json
		if (params.json) {
			params.context = params.context ? Savory.JSON.to(params.context) : null
		}

		var future
		params.application = params.application || null 
		if (params.distributed) {
			params.where = params.where || null
			params.multi = params.multi || false
			future = application.distributedTask(params.application, params.name, params.entryPoint || null, params.context, params.where, params.multi)
		}
		else {
			params.delay = params.delay || 0
			params.repeatEvery = params.repeatEvery || 0
			params.fixedRepeat = params.fixedRepeat || false
			future = application.task(params.application, params.name, params.entryPoint || null, params.context, params.delay, params.repeatEvery, params.fixedRepeat)
		}
		if (params.block) {
			future.get(params.block, java.util.concurrent.TimeUnit.MILLISECONDS)
		}
		
		return future
	}

	/**
	 * Shortcut to get the document.context and possibly deserialize it.
	 * 
	 * @param {Boolean} [json=true] True to deserialize params.context from JSON
	 * @returns The context
	 */
	Public.getContext = function(json) {
		json = json === undefined ? true : json
		return json ? Savory.JSON.from(document.context) : document.context
	}
	
	/**
	 * Evaluates the code as a task, which means that it can execute asynchronously or distributed in the cluster.
	 * 
	 * @param {Function|String} code JavaScript closure or code for a closure
	 * @param [params]
	 * @see #task
	 */
	Public.eval = function(code, params) {
		params = Savory.Objects.merge({
			name: '/savory/eval/',
			context: String(code),
			pure: true
		}, params)
		Public.task(params)
	}
	
	return Public
}()

/**
 * Executes the function as a task, which means that it can execute asynchronously or distributed in the cluster.
 * 
 * @methodOf Function#
 * @returns {java.util.concurrent.Future}
 * @see Savory.Tasks#task
 */
Function.prototype.task = Function.prototype.task || function(params) {
	params = Savory.Objects.clone(params) || {}
	params.fn = this
	Savory.Tasks.task(params)
}
