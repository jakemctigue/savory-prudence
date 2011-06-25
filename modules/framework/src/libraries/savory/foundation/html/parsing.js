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

//
// HTML parsing.
//
// Requires: jsoup.jar
//
// Version 1.0
//

document.executeOnce('/savory/foundation/classes/')
document.executeOnce('/savory/foundation/html/')
document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/prudence/resources/')

var Savory = Savory || {}

/**
 * HTML parsing.
 *  
 * @name Savory.HTML.Parsing
 * @namespace
 * @requires jsoup.jar
 * @see Visit <a href="http://jsoup.org/">jsoup</a>
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.HTML = Savory.Objects.merge(Savory.HTML, function() {
	/** @exports Public as Savory.HTML */
    var Public = {}

	/**
	 * Parses HTML into a queryable, DOM-like structure.
	 * 
	 * @param {String} source The HTML source
	 * @returns {Savory.HTML.Element}
	 */
	Public.parse = function(source) {
		return new Public.Element(org.jsoup.Jsoup.parse(source))
	}
	
	/**
	 * Strips all HTML, leaving only plain text.
	 * 
	 * @param {String} source The HTML source
	 * @return {String} The source without HTML tags
	 */
	Public.strip = function(source) {
		return String(org.jsoup.Jsoup.clean(source, org.jsoup.safety.Whitelist.none()))
	}
	
	/**
	 * Shortcut to request HTML and parse it.
	 * 
	 * @see Savory.Resources#request
	 * @see Savory.HTML#parse
	 */
	Public.request = function(params) {
		if (!params.mediaType) {
			params = Savory.Objects.clone(params)
			params.mediaType = 'text/html'
		}
		var html = Savory.Resources.request(params)
		return html ? Public.parse(html) : null
	}
	
	/**
	 * A queryable HTML element.
	 * 
	 * @class
	 * @see Savory.HTML#parse
	 */
	Public.Element = Savory.Classes.define(function(Module) {
		/** @exports Public as Savory.HTML.Element */
	    var Public = {}
	    
	    /** @ignore */
	    Public._construct = function(element) {
	    	this.element = element
	    }
	    
	    Public.selectFirst = function(query) {
	    	var element = this.element.select(query).first()
	    	return Savory.Objects.exists(element) ? new Module.Element(element) : null
	    }

	    /**
		 * Returns text for the first element matching the query.
		 * 
		 * @param query
		 * @returns {String}
		 */
		Public.getText = function(query) {
			return String(this.element.select(query).first().text())
		}
		
		// TODO: more jsoup API!
	    
	    return Public
	}(Public))
    
    return Public
}())