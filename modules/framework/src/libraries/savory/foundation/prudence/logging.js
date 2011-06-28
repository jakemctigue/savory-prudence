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

document.executeOnce('/savory/foundation/classes/')
document.executeOnce('/savory/foundation/templates/')
document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/rhino/')
document.executeOnce('/savory/foundation/localization/')

var Savory = Savory || {}

/**
 * A flexible, JavaScript-friendly wrapper over JVM loggers.
 * Integrates with Savory templates for easy use of string templates in
 * log messages.
 * <p>
 * An important note about performance: If you need to do some complex processing in order to create
 * the log message, it's better to provide a closure that returns the log message instead of creating
 * the log message immediately. All logging methods make sure to check that the logger's level support
 * the message's level before calling the closure, so that unsupported messages will not be processed,
 * resulting in practically no waste. So, you should never use performance degradation as an excuse
 * to avoid logging!
 * <p>
 * Note: This library modifies the {@link String} prototype.
 *
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Logging = Savory.Logging || function() {
	/** @exports Public as Savory.Logging */
    var Public = {}

	/**
	 * Gets a logger.
	 * 
	 * @param {String} [name] The application sub-logger name; if not provided returns the application's root logger
	 * @returns {Savory.Logging.Logger}
	 */
	Public.getLogger = function(name) {
		return name ? new Public.Logger(application.getSubLogger(name)) : Public.logger
	}
	
	/**
	 * A JavaScript-friendly logger. Provides the same basic API as the JVM logger, plus a few goodies.
	 * 
	 * @class
	 * @see Savory.Logging#getLogger
	 */
	Public.Logger = Savory.Classes.define(function() {
		/** @exports Public as Savory.Logging.Logger */
	    var Public = {}
	    
	    /** @ignore */
	    Public._construct = function(logger) {
	    	this.logger = logger
	    }

	    /**
		 * Sends a log message.
		 * <p>
		 * Note that any arguments after 'message' will be sent as arguments to {@link Savory.Templates#cast}
		 * on the message.
		 * 
		 * @param {String|Number} [level='info'] Logging level can be
		 *        'severe', 'warning', 'config', 'info', 'fine', 'finer' or 'finest'.
		 * @param {String|Function} message
		 *        Can be a function, which will only be called if the level is loggable
		 *        (useful to avoid performance hits for costly generation of log messages
		 *        when they aren't going to be logged)
		 * @returns {Savory.Logging.Logger} This logger
		 */
	    Public.log = function(level, message/*, arguments */) {
			if (Savory.Objects.isString(level)) {
				level = levels[level.toLowerCase()]
			}
			
			level = level || java.util.logging.Level.INFO
			
			if (this.logger.isLoggable(level)) {
				if (typeof message == 'function') {
					message = message()
				}
				
				if (arguments.length > 2) {
					var args = Savory.Objects.slice(arguments, 2)
					message = message.cast.apply(message, args)
				}
				
				this.logger.log(level, message)
			}
			
			return this
		}
		
		/**
		 * Shortcut for calling {@link #log} with level 'info'.
		 * 
		 * @returns {Savory.Logging.Logger} This logger
		 */
	    Public.info = function(message/*, arguments */) {
			var args = [java.util.logging.Level.INFO, message]
			if (arguments.length > 1) {
				args = args.concat(Savory.Objects.slice(arguments, 1))
			}
			return this.log.apply(this, args)
		}

		/**
		 * Shortcut for calling {@link #log} with level 'config'.
		 * 
		 * @returns {Savory.Logging.Logger} This logger
		 */
	    Public.config = function(message/*, arguments */) {
			var args = [java.util.logging.Level.CONFIG, message]
			if (arguments.length > 1) {
				args = args.concat(Savory.Objects.slice(arguments, 1))
			}
			return this.log.apply(this, args)
		}

		/**
		 * Shortcut for calling {@link #log} with level 'fine'.
		 * 
		 * @returns {Savory.Logging.Logger} This logger
		 */
	    Public.fine = function(message/*, arguments */) {
			var args = [java.util.logging.Level.FINE, message]
			if (arguments.length > 1) {
				args = args.concat(Savory.Objects.slice(arguments, 1))
			}
			return this.log.apply(this, args)
		}

		/**
		 * Shortcut for calling {@link #log} with level 'finer'.
		 * 
		 * @returns {Savory.Logging.Logger} This logger
		 */
	    Public.finer = function(message/*, arguments */) {
			var args = [java.util.logging.Level.FINER, message]
			if (arguments.length > 1) {
				args = args.concat(Savory.Objects.slice(arguments, 1))
			}
			return this.log.apply(this, args)
		}

		/**
		 * Shortcut for calling {@link #log} with level 'finest'.
		 * 
		 * @returns {Savory.Logging.Logger} This logger
		 */
	    Public.finest = function(message/*, arguments */) {
			var args = [java.util.logging.Level.FINEST, message]
			if (arguments.length > 1) {
				args = args.concat(Savory.Objects.slice(arguments, 1))
			}
			this.log.apply(this, args)
		}

		/**
		 * Shortcut for calling {@link #log} with level 'warning'.
		 * 
		 * @returns {Savory.Logging.Logger} This logger
		 */
	    Public.warning = function(message/*, arguments */) {
			var args = [java.util.logging.Level.WARNING, message]
			if (arguments.length > 1) {
				args = args.concat(Savory.Objects.slice(arguments, 1))
			}
			return this.log.apply(this, args)
		}

		/**
		 * Shortcut for calling {@link #log} with level 'severe'.
		 * 
		 * @returns {Savory.Logging.Logger} This logger
		 */
	    Public.severe = function(message/*, arguments */) {
			var args = [java.util.logging.Level.SEVERE, message]
			if (arguments.length > 1) {
				args = args.concat(Savory.Objects.slice(arguments, 1))
			}
			return this.log.apply(this, args)
		}
		
		/**
		 * Logs an exception with the current stack trace, supporting both
		 * JavaScript and JVM exceptions.
		 * 
		 * @param execpetion The exception
		 * @param [level='warning'] The log level
		 * @param [skip=0] How many stack trace elements to skip
		 * @returns {Savory.Logging.Logger} This logger
		 */
	    Public.exception = function(exception, level, skip) {
			level = level || java.util.logging.Level.WARNING
			skip = skip || 0
			// We'll remove at least the first line (it's this very location)
			skip += 1
			return this.log(level, function() {
				var details = Savory.Rhino.getExceptionDetails(exception, skip)
				return details.message + '\n' + details.stackTrace
			})
		}
		
		/**
		 * Dumps an object using single-line, condensed JSON.
		 * 
		 * @param obj The object
		 * @param {String} [description] An optional description of the object
		 * @param [level='info'] The log level 
		 * @returns {Savory.Logging.Logger} This logger
		 */
	    Public.dumpShort = function(obj, description, level) {
			level = level || java.util.logging.Level.INFO
			if (this.logger.isLoggable(level)) {
				var dump = Savory.Objects.isObject(obj) ? Savory.JSON.to(obj) : String(obj)
				if (description) {
					return this.log(level, description.capitalize() + ' dump: ' + dump)
				}
				else {
					return this.log(level, 'Dump: ' + dump)
				}
			}
			return this
		}
		
		/**
		 * Dumps an object using multi-line, human-readable JSON.
		 * 
		 * @param obj The object
		 * @param {String} [description] An optional description of the object
		 * @param [level='info'] The log level 
		 * @returns {Savory.Logging.Logger} This logger
		 */
	    Public.dumpLong = function(obj, description, level) {
			level = level || java.util.logging.Level.INFO
			if (this.logger.isLoggable(level)) {
				var dump = Savory.Objects.isObject(obj) ? Savory.JSON.to(obj, true) : String(obj)
				if (description) {
					return this.log(level, description.capitalize() + ' dump:\n' + dump)
				}
				else {
					return this.log(level, 'Dump:\n' + dump)
				}
			}
			return this
		}
		
		/**
		 * Times a task, logging the start and end of the task with
		 * a human-readable duration.
		 * 
		 * @param {String} description A description of the task
		 * @param {Function} fn The task function; a return value of false signifies
		 *        that the task failed, which will be logged accordingly
		 * @param [scope] The scope ('this') for the task function
		 * @param [level='info'] The log level 
		 * @returns {Savory.Logging.Logger} This logger
		 */
	    Public.time = function(description, fn, scope, level) {
			level = level || java.util.logging.Level.INFO
			if (!this.logger.isLoggable(level)) {
				fn.call(scope)
				return this
			}

			var start = java.lang.System.currentTimeMillis()
			this.log(level, 'Starting {0}...', description)
			
			var r
			try {
				r = fn.call(scope)
			}
			catch (x) {
				this.exception(x)
				r = false
			}
			
			if (r === false) {
				return this.log(level, 'Failed {0} in {1}', description, Savory.Localization.formatDuration(java.lang.System.currentTimeMillis() - start))
			}
			else {
				return this.log(level, 'Finished {0} in {1}', description, Savory.Localization.formatDuration(java.lang.System.currentTimeMillis() - start))
			}
		}
		
		/**
		 * @returns {Logging.Logger} This logger
		 * @function
		 * @see Logging.Logger#dumpShort
		 */
	    Public.dump = Public.dumpShort
		
		return Public
	}())
	
	//
	// Initialization
	//
	
	var levels = {
		'finest': java.util.logging.Level.FINEST,
		'finer': java.util.logging.Level.FINER,
		'fine': java.util.logging.Level.FINE,
		'info': java.util.logging.Level.INFO,
		'config': java.util.logging.Level.CONFIG,
		'warning': java.util.logging.Level.WARNING,
		'severe': java.util.logging.Level.SEVERE,

		// Aliases
		'warn': java.util.logging.Level.WARNING,
		'error': java.util.logging.Level.SEVERE
	}
	
	Public.logger = new Public.Logger(application.logger)
	
	return Public
}()

/**
 * Sends the string as a log message to the application's root logger.
 * <p>
 * Note that any arguments after 'level' will be sent as arguments to {@link Savory.Templates#cast}
 * on the message.
 * 
 * @methodOf String#
 * @param {String|Number} [level='info']
 * @returns {Logging.Logger} The logger
 * @see Savory.Logging.Logger#log
 */ 
String.prototype.log = String.prototype.log || function(level/*, arguments */) {
	if (arguments.length > 1) {
		var args = [level, this].concat(Savory.Objects.slice(arguments, 1))
		var logger = Savory.Logging.getLogger()
		return logger.log.apply(logger, args)
	}
	else {
		return Savory.Logging.getLogger().log(level, this)
	}
}
