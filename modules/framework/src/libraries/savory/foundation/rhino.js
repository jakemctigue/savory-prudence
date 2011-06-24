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

document.executeOnce('/savory/foundation/jvm/')
document.executeOnce('/savory/foundation/json/')

var Savory = Savory || {}

/**
 * Useful shortcuts to Rhino-specific services and utilities.
 * 
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Rhino = Savory.Rhino || function() {
	/** @exports Public as Savory.Rhino */
    var Public = {}

	/**
	 * The Rhino stack trace for an exception.
	 * 
	 * @param {Number} [skip=0] How many stack trace entries to skip
	 * @returns {String}
	 */
	Public.getStackTrace = function(exception, skip) {
		if (!exception.rhinoException) {
			return ''
		}
		skip = skip || 0
		var stackTrace = exception.rhinoException.scriptStackTrace
		return stackTrace.split('\n').slice(skip).join('\n')
	}

	/**
	 * The current Rhino stack trace.
	 * 
	 * @param {Number} [skip=0] How many stack trace entries to skip
	 * @returns {String}
	 */
	Public.getCurrentStackTrace = function(skip) {
		// We'll remove at least the first line (it's this very location)
		skip = skip || 0
		skip = skip + 1
		var stackTrace = new org.mozilla.javascript.JavaScriptException(null, null, 0).scriptStackTrace
		return stackTrace.split('\n').slice(skip).join('\n')
	}
	
	/**
	 * An exception stack trace. Supports both Rhino and JVM exceptions.
	 * 
	 * @param {Exception} exception The exception
	 * @param {Number} [skip=0] How many stack trace entries to skip
	 * @returns An object with .message and .stackTrace properties, both strings
	 */
	Public.getExceptionDetails = function(exception, skip) {
		if (Savory.Objects.exists(exception.javaException)) {
			return {
				message: String(exception.javaException),
				stackTrace: Savory.JVM.getStackTrace(exception.javaException)
			}
		}
		else if (Savory.Objects.exists(exception.rhinoException)) {
			return {
				message: String(exception.rhinoException),
				stackTrace: Public.getStackTrace(exception, skip)
			}
		}
		else {
			return {
				message: Savory.Objects.isObject(exception) ? Savory.JSON.to(exception) : String(exception),
				stackTrace: Public.getStackTrace(exception, skip)
			}
		}
	}
	
	/**
	 * Creates a synchronized version of a function.
	 * 
	 * @param {Function} fn The function
	 * @returns {Function} The synchronized function
	 */
	Public.synchronize = function(fn) {
		return new org.mozilla.javascript.Synchronizer(fn)
	}
	
	return Public
}()
