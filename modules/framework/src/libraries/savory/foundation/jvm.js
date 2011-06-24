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
 * Utilities to work with JVM types and classes.
 * <p>
 * Note: This library modifies the String prototype.
 *  
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.1
 */
Savory.JVM = Savory.JVM || function() {
	/** @exports Public as Savory.JVM */
    var Public = {}

	/**
	 * Loads a JVM class by name.
	 * 
	 * @returns {java.lang.Class}
	 */
	Public.getClass = function(name) {
		try {
			return classLoader.loadClass(name)
		}
		catch (x) {
			return null
		}
	}
	
	/**
	 * True if the value is an instance of the JVM class (or its sub-classes). 
	 * 
	 * @param {String|java.lang.Class} The JVM class or its name
	 * @returns {Boolean}
	 */
	Public.instanceOf = function(value, theClass) {
		if (value.getClass) {
			theClass = Savory.Objects.isString(theClass) ? Public.getClass(theClass) : theClass
			return value.getClass() === theClass
		}
		return false
	}
	
	/**
	 * Creates an instance of a JVM class.
	 * 
	 * @param {String|java.lang.Class} The JVM class or its name
	 */
	Public.newInstance = function(theClass) {
		theClass = Savory.Objects.isString(theClass) ? Public.getClass(theClass) : theClass
		return theClass ? theClass.newInstance() : null
	}
	
	/**
	 * Creates a JVM array.
	 */
	Public.newArray = function(length, type) {
		type = type || 'object'
		if (Savory.Objects.isString(type)) {
			var theClass = primitiveTypes[String(type)]
			if (!theClass) {
				theClass = Public.getClass(type)
			}
			type = theClass
		}
		return java.lang.reflect.Array.newInstance(theClass, length)
	}
	
	/**
	 * Converts a JavaScript array into a new JVM array.
	 */
	Public.toArray = function(array, type) {
		var jvmArray = Public.newArray(array.length, type)
		for (var a in array) {
			jvmArray[a] = array[a]
		}
		return jvmArray
	}
	
	/**
	 * Converts a JVM array into a JavaScript array.
	 */
	Public.fromArray = function(array) {
		var jsArray = []
		for (var a in array) {
			jsArray.push(array[a])
		}
		return jsArray
	}
	
	/**
	 * Creates a JVM ArrayList (not thread-safe) or a CopyOnWriteArrayList (thread-safe).
	 * 
	 * @returns {java.util.List}
	 */
	Public.newList = function(threadSafe, initialCapacity) {
		if (initialCapacity) {
			return threadSafe ? new java.util.concurrent.CopyOnWriteArrayList() : new java.util.ArrayList(initialCapacity)
		}
		else {
			// CopyOnWriteArrayList does not support initial capacity
			return threadSafe ? new java.util.concurrent.CopyOnWriteArrayList() : new java.util.ArrayList()
		}
	}
	
	/**
	 * Creates a JVM HashSet (not thread-safe) or a CopyOnWriteArraySet (thread-safe).
	 * 
	 * @returns {java.util.Set}
	 */
	Public.newSet = function(threadSafe, initialCapacity) {
		if (initialCapacity) {
			return threadSafe ? new java.util.concurrent.CopyOnWriteArraySet() : new java.util.HashSet(initialCapacity)
		}
		else {
			// CopyOnWriteArraySet does not support initial capacity
			return threadSafe ? new java.util.concurrent.CopyOnWriteArraySet() : new java.util.HashSet()
		}
	}
	
	/**
	 * Converts a JavaScript array into a new JVM ArrayList (not thread-safe) or a CopyOnWriteArrayList (thread-safe).
	 * 
	 * @returns {java.util.List}
	 */
	Public.toList = function(array, threadSafe) {
		var list = Public.newList(threadSafe, array.length)
		for (var a in array) {
			list.add(array[a])
		}
		return list
	}
	
	/**
	 * Converts a JVM Collection into a new JavaScript array.
	 * 
	 * @returns {Array}
	 */
	Public.fromCollection = function(collection) {
		return Public.fromArray(collection.toArray())
	}
	
	/**
	 * Creates a JVM HashMap (not thread-safe) or a ConcurrentHashMap (thread-safe).
	 * 
	 * @returns {java.util.Map}
	 */
	Public.newMap = function(threadSafe, initialCapacity) {
		if (initialCapacity) {
			return threadSafe ? new java.util.concurrent.ConcurrentHashMap(initialCapacity) : new java.util.HashMap(initialCapacity)
		}
		else {
			return threadSafe ? new java.util.concurrent.ConcurrentHashMap() : new java.util.HashMap()
		}
	}

	/**
	 * Converts a JavaScript dict into a new JVM HashMap (not thread-safe) or a ConcurrentHashMap (thread-safe).
	 * 
	 * @returns {java.util.Map}
	 */
	Public.toMap = function(dict, threadSafe) {
		var map = Public.newMap(threadSafe)
		for (var k in dict) {
			map.put(k, dict[k])
		}
		return map
	}
	
	/**
	 * Converts a JVM Map into a new JavaScript dict.
	 * 
	 * @returns {Object}
	 */
	Public.fromMap = function(map) {
		var dict = {}
		for (var i = map.entrySet().iterator(); i.hasNext(); ) {
			var entry = i.next()
			dict[entry.key] = entry.value
		}
		return dict
	}
	
	/**
	 * Creates a JVM Lock.
	 * 
	 * @param {Boolean} [readWrite=false] True to create a read-write lock
	 * @returns {java.util.concurrent.locks.ReentrantLock|java.util.concurrent.locks.ReentrantReadWriteLock}
	 */
	Public.newLock = function(readWrite) {
		return readWrite ? new java.util.concurrent.locks.ReentrantReadWriteLock() : java.util.concurrent.locks.ReentrantLock()
	}
	
	/**
	 * Returns a JVM charset.
	 * 
	 * @param {String} [name] Leave empty to get default charset (most likely UTF-8)
	 * @returns {java.nio.charset.Charset}
	 */
	Public.getCharset = function(name) {
		return Savory.Objects.exists(name) ? java.nio.charset.Charset.forName(name) : java.nio.charset.Charset.defaultCharset()
	}

	/**
	 * Converts a JVM byte array into a JavaScript string.
	 * 
	 * @param {byte[]} The bytes
	 * @param {String|java.nio.charset.Charset} [charset=default encoding (most likely UTF-8)] The charset in which the bytes are encoded
	 * @returns {String}
	 * @see #getCharset
	 */
	Public.fromBytes = function(bytes, charset) {
		charset = Savory.Objects.isString(charset) ? Public.getCharset(charset) : null
		return null !== charset ? String(new java.lang.String(bytes, charset)) : String(new java.lang.String(bytes))
	}
	
	/**
	 * Converts a JVM byte array into an array of JavaScript strings, each representing a line.
	 * 
	 * @param {byte[]} The bytes
	 * @param {String|java.nio.charset.Charset} [charset=default encoding (most likely UTF-8)] The charset in which the bytes are encoded
	 * @returns {String[]}
	 * @see #getCharset
	 */
	Public.linesFromBytes = function(bytes, charset) {
		charset = Savory.Objects.isString(charset) ? Public.getCharset(charset) : null
				
		var input = new java.io.ByteArrayInputStream(bytes)
		input = Objects.exists(charset) ? new java.io.InputStreamReader(input, charset) : new java.io.InputStreamReader(input)
		input = new java.io.BufferedReader(input)
		
		var lines = []
		var line = input.readLine()
		while (line != null) {
			lines.push(String(line))
			line = input.readLine()
		}

		return lines
	}
	
	/**
	 * Converts a string into a JVM byte array.
	 * 
	 * @param {String|java.nio.charset.Charset} [charset=default encoding (most likely UTF-8)] The charset in which the bytes are to be encoded
	 * @see #getCharset
	 */
	Public.toBytes = function(string, charset) {
		charset = Savory.Objects.isString(charset) ? Public.getCharset(charset) : null
		return null !== charset ? new java.lang.String(string).getBytes(charset) : new java.lang.String(string).bytes
	}
	
	/**
	 * Converts a JavaScript dict into a JVM Properties sheet.
	 * 
	 * @return {java.util.Properties}
	 */
	Public.toProperties = function(dict) {
		var properties = java.lang.System.properties
		for (var d in dict) {
			properties.put(d, dict[d])
		}
		return properties
	}
	
	/**
	 * Converts JVM Locale into a JavaScript dict.
	 * 
	 * @param {java.util.Locale} locale The JVM locale
	 * @returns {Object} In the form {language: 'code' ,country: 'code', variant: 'code'}
	 */
	Public.fromLocale = function(locale) {
		var r = {}
		if (locale.language.length()) {
			r.language = String(locale.language).toLowerCase()
		}
		if (locale.country.length()) {
			r.country = String(locale.country).toLowerCase()
		}
		if (locale.variant.length()) {
			r.variant = String(locale.variant).toLowerCase()
		}
		return r
	}
	
	/**
	 * Converts a special JavaScript dict into a JVM Locale.
	 * 
	 * @param {Object|String} value A string is interpreted as {language: value}
	 * @param {String} value.language The language code
	 * @param {String} [value.country] The country code
	 * @param {String} [value.variant] The variant code
	 * @returns {java.util.Locale}
	 */
	Public.toLocale = function(value) {
		if (value) {
			if (Savory.Objects.isString(value)) {
				return new java.util.Locale(value)
			}
			if (value.variant && value.country && value.language) {
				return new java.util.Locale(value.language, value.country, value.variant)
			}
			if (value.country && value.language) {
				return new java.util.Locale(value.language, value.country)
			}
			if (value.language) {
				return new java.util.Locale(value.language)
			}
		}
		
		return null
	}
	
	/**
	 * Returns the system locale as a special JavaScript dict.
	 */
	Public.getSystemLocale = function() {
		return Public.fromLocale(java.util.Locale.getDefault())
	}
	
	/**
	 * Returns the JVM stack trace for a JVM exception.
	 * 
	 * @returns {String} The stack trace (multi-line, human-readable)
	 */
	Public.getStackTrace = function(exception) {
		var string = new java.io.StringWriter()
		var writer = new java.io.PrintWriter(string)
		exception.printStackTrace(writer)
		writer.close()
		return String(string)
	}
	
	/**
	 * Sweet dreams! Zzzzzzz. 
	 * 
	 * @param {Number} duration Duration in millseconds
	 */
	Public.sleep = function(duration) {
		java.lang.Thread.sleep(duration)
	}
	
	//
	// Initialization
	//
	
	var classLoader = java.lang.ClassLoader.systemClassLoader
	
	var primitiveTypes = {
		'object': Public.getClass('java.lang.Object'),
		'bool': java.lang.Boolean.TYPE,
		'byte': java.lang.Byte.TYPE,
		'char': java.lang.Character.TYPE,
		'int': java.lang.Integer.TYPE,
		'short': java.lang.Short.TYPE,
		'long': java.lang.Long.TYPE,
		'float': java.lang.Float.TYPE,
		'double': java.lang.Double.TYPE
	}
	
	return Public
}()

/**
 * Converts a string into a JVM byte array.
 * 
 * @methodOf String#
 * @param {String|java.nio.charset.Charset} [charset=default encoding (most likely UTF-8)] The charset in which the bytes are to be encoded
 * @see Savory.JVM#getCharset
 * @see Savory.JVM#toBytes
 */ 
String.prototype.toBytes = String.prototype.toBytes || function(charset) {
	return Savory.JVM.toBytes(this, charset)
}
