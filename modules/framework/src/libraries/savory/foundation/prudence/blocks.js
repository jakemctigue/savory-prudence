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

var Savory = Savory || {}

/**
 * Block utilities.
 * 
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Blocks = Savory.Blocks || function() {
	/** @exports Public as Savory.Blocks */
    var Public = {}

	/**
	 * Installs the library's scriptlet plugins.
	 * <p>
	 * Can only be called from Prudence configuration scripts!
	 */
	Public.routing = function() {
		scriptletPlugins.put('{{', '/savory/foundation/blocks/scriptlet-plugin/')
		scriptletPlugins.put('}}', '/savory/foundation/blocks/scriptlet-plugin/')
		scriptletPlugins.put('&&', '/savory/foundation/blocks/scriptlet-plugin/')
	}
		
	/**
	 * Sets the value of a block (or any conversation.local).
	 * 
	 * @param {String} name The name of the block
	 * @param {String|Function} The value, or a closure that generates output, that
	 *        in turn will be captured into the value (see {@link #start})
	 */
	Public.set = function(name, value) {
		if (typeof value == 'function') {
			value = captureClosure(value)
		}

		conversation.locals.put(name, value)
	}

	/**
	 * Appends to the value of a block (or any conversation.local).
	 * <p>
	 * This can be more elegantly used via the custom scriptlet '{{'.
	 * 
	 * @param {String} name The name of the block
	 * @param {String|Function} The value, or a closure that generates output, that
	 *        in turn will be captured into the value (see {@link #start})
	 */
	Public.append = function(name, value) {
		if (typeof value == 'function') {
			value = captureClosure(value)
		}

		var existing = conversation.locals.get(name)
		if (Savory.Objects.exists(existing)) {
			if (Savory.Objects.isArray(existing)) {
				existing.push(value)
				return
			}
			else {
				value = [existing, value]
			}
		}

		conversation.locals.put(name, value)
	}

	/**
	 * Gets the value of a block (or any conversation.local).
	 * <p>
	 * If the block value has closures, makes sure to call them with
	 * the arguments.
	 * 
	 * @param {String} name The name of the block
	 * @returns {String}
	 */
	Public.get = function(name/*, arguments */) {
		var args = arguments.length > 1 ? Savory.Objects.slice(arguments, 1) : null

		var value = conversation.locals.get(name)
		if (Savory.Objects.isArray(value)) {
			var text = ''
			for (var v in value) {
				var entry = value[v]
				if (typeof entry == 'function') {
					if (args) {
						entry = entry.apply(this, args)
					}
					else {
						entry = entry.apply(this)
						
						// Once-and-only-once for argument-less block result
						value[v] = entry
					}
				}
				if (Savory.Objects.exists(entry)) {
					text += String(entry)
				}
			}
			value = text
		}
		else if (typeof value == 'function') {
			if (args) {
				value = value.apply(this, args)
			}
			else {
				value = value.apply(this)

				// Once-and-only-once for argument-less block result
				conversation.locals.put(name, value)
			}
		}
		
		return Savory.Objects.exists(value) ? String(value) : ''
	}
	
	/**
	 * Prints a block (or any conversation.local).
	 * <p>
	 * If the block is a closure, makes sure to call it with
	 * the arguments.
	 * <p>
	 * This can be more elegantly used via the custom scriptlet '&&'.
	 * 
	 * @param {String} name The name of the block
	 * @returns {String}
	 */
	Public.include = function(name/*, arguments */) {
		var text = Public.get.apply(this, arguments)
		print(text)
		return text
	}

	/**
	 * Starts capturing output.
	 * <p>
	 * Note that capturing can be nested.
	 * 
	 * @see #end
	 */
	Public.start = function() {
		executable.context.writer.flush()
		var stringWriter = new java.io.StringWriter()
		writerStack.push({
			writer: executable.context.writer,
			stringWriter: stringWriter
		})
		executable.context.writer = stringWriter
	}
	
	/**
	 * Ends output capturing.
	 * <p>
	 * Note that capturing can be nested.
	 * 
	 * @returns {String} The captured text
	 * @see #start
	 */
	Public.end = function() {
		var entry = writerStack.pop() 
		if (entry) {
			var text = String(entry.stringWriter)
			executable.context.writer = entry.writer
			return text
		}
		
		return ''
	}

	//
	// Private
	//
	
    function captureClosure(fn) {
		return function() {
			Savory.Blocks.start()
			fn.apply(this, arguments)
			return Savory.Blocks.end()
		}
    }
    
    //
    // Initialization
    //

	var writerStack = []

	return Public
}()
