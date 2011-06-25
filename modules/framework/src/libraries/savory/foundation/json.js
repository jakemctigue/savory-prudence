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

var Savory = Savory || {}

/**
 * JSON encoding and decoding. Uses the high-performance JSON
 * library included in the MongoDB driver if available, otherwise
 * falls back to a 100%-JavaScript version. In either case, supports
 * decoding of MongoDB's extended JSON format:
 * <ul>
 * <li>{$date: timestamp} <-> Date</li>
 * <li>{$regex: 'pattern', $options: 'options'} <-> RegExp</li>
 * <li>{$oid: 'objectid'} <-> ObjectId</li>
 * <li>{$binary: 'base64', $type: 'hex'} <-> byte array</li>
 * <li>{$ref: 'collection', $id: 'objectid'} <-> DBRef</li>
 * <li>{$long: 'integer'} <-> java.lang.Long (this is our addition to MongoDB extended JSON)</li>
 * </ul>
 * 
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.JSON = com.mongodb.rhino.JSON
if (Object.prototype.toString.call(Savory.JSON) != '[object JavaClass]') {
	// Fallback to JavaScript JSON library if the MongoDB Rhino driver isn't found
	
	document.executeOnce('/savory/foundation/internal/json2/')
	
	Savory.JSON = {}
	
	/**
	 * Recursively converts MongoDB's extended JSON notation to
	 * ObjectId, DBRef, Date, RegExp, java.lang.Long and byte array objects as necessary.
	 * 
	 * @param {Object|Array} json The data
	 * @returns {Object|Array}
	 */
	Savory.JSON.fromExtendedJSON = function(json) {
		if (Savory.Objects.isArray(json)) {
			for (var j = 0, length = json.length; j < length; j++) {
				json[j] = Savory.JSON.fromExtendedJSON(json[j])
			}
		}
		else if (Savory.Objects.isObject(json)) {
			if (json.$long !== undefined) {
				// Note: Rhino will not let us use java.lang.Long instances! It will
				// immediately convert them to JavaScript Number instances.
				
				// It would probably be best to plug into a BigDecimal library
				return Number(json.$long)
			}
			
			if (json.$date !== undefined) {
				// See note for $long
				var timestamp = json.$date.$long !== undefined ? json.$date.$long : json.$date;
				return new Date(Number(timestamp))
			}
			
			if (json.$oid !== undefined) {
				return json.$oid
			}
			
			if (json.$regex !== undefined) {
				return new RegExp(json.$regex, json.$options)
			}
			
			for (var k in json) {
				json[k] = Savory.JSON.fromExtendedJSON(json[k])
			}
		}
	}
	
	/**
	 * Recursively converts a JavaScript value to MongoDB's extended JSON notation.
	 * 
	 * @param value The extended-JSON-compatible value
	 * @param {Boolean} [human=false] True to generate human-readable, multi-line, indented JSON
	 * @returns {String} The JSON representation of value
	 */
	Savory.JSON.to = function(value, human) {
		return JSON.stringify(value)
		
		// TODO: extended JSON?
	}
	
	/**
	 * Converts a JSON representation into a hierarchy of JavaScript objects, arrays and strings.
	 * 
	 * @param {String} json The JSON string
	 * @param {Boolean} [extendedJson=false] True to interpret MongoDB's extended JSON notation,
	 *        creating ObjectId, DBRef, Date, RegExp, java.lang.Long and byte array objects where noted
	 * @returns {Object|Array}
	 */
	Savory.JSON.from = function(json, extendedJson) {
		json = JSON.parse(json)
		if (extendedJson) {
			Savory.JSON.fromExtendedJSON(json)
		}
		return json
	}
}