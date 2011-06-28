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
 * Simple but very useful extension of <a href="http://threecrickets.com/prudence/manual/generating-html/">Prudence's powerful HTML generation</a>.
 * <p>
 * "Blocks" can be defined anywhere in the page or fragment, but are only rendered where (and if) you want them to be rendered.
 * This lets you organize your page according to your logic, rather than HTML's. For example, JavaScript blocks can
 * appear in your source code right next to the HTML elements they belong to, but be rendered only after the HTML body element.
 * <p>
 * Blocks can also be used to create page templates: you can first define the parts of the page as blocks (things like "header", "footer", "main")
 * and then simply include the template which will render the parts in their right places.
 * <p>
 * Another common use case: a single file can become a "library" of many blocks that you can render as needed. Note that blocks can include
 * code segments, and that these code segments will not be executed unless the block is actually rendered. To add more flexibility, blocks can be
 * treated like JavaScript functions: you can accept arguments that are sent at the point of rendering.
 * <p>
 * Blocks do not have to be continuous. You can close a named block and open it again elsewhere. The library will concatenate
 * all parts together upon rendering.
 * <p>
 * Another useful feature is that blocks can be nested. If a block definition appears inside another block definition, it will become
 * instantiated when the outer block is rendered.
 * 
 * <h1>Scriptlets</a>
 * Though you can call the API directly, it's easiest to use blocks via the library's <a href="http://threecrickets.com/prudence/manual/handlers/#toc-Subsection-51">scriptlet plugin</a>:
 * <pre>
 * <%{{ 'blockname' %> This is the block content! <%}}%>
 * </pre>
 * To render the block:
 * <%&& 'blockname' %>
 * You can use any JavaScript expression for the blockname.
 * <p>
 * To create a block that receives arguments:
 * <%{{ 'say-hello' -> name, salutation %> Hello, <%= salutation + ' ' + name %>!  <%}}%>
 * To render it:
 * <&& 'say-hello', 'Tal', 'Mr.' %>
 * Again, any JavaScript expression can be used here.
 * 
 * <h1>Installation</h1>
 * To install the scriptlet plugin, you will need to call {@link Savory.Blocks#routing} in your application's
 * from your routing.js.
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
