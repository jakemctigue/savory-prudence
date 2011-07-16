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
document.executeOnce('/savory/foundation/iterators/')
document.executeOnce('/savory/foundation/objects/')

Savory = Savory || {SEO: {Provider: {}}}

/**
 * A location provider for the SEO feature. All URLs are explicitly configured as arrays.
 * This is not a very scalable solution, and is provided mostly for smaller sitemaps and
 * for testing. It's also good example code on which to design your own location provider
 * classes.
 * <p>
 * Note that every where we mention URLs here they are always relative URLs. During generation
 * of robots.txt and sitemap.xml, they are appended to the root URL of the relevant domain.
 * 
 * @class
 * @name Savory.SEO.Provider.Explicit
 * 
 * @param config
 * @param {String} config.name The URL set name
 * @param {String[]} config.domains The root URLs of the domains for which we provide locations
 * @param {Array} config.locations The locations, where each location can be a simple URL, or
 *        a full dict in the form {uri: '',  lastModified: date, frequency: '', priority: number between 0.0 and 1.0}
 * @param {String[]} config.exclusions The URLs to exclude for robots.txt
 * @param {String[]} config.inclusions The URLs to include for robots.txt
 * @param {String} [config.defaultFrequency='weekly'] Default frequency to use for locations which do not explicitly provide it
 * @param {Number} [config.defaultPriority=0.5] Default priority to use for locations which do not explicitly provide it
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.SEO.Provider.Explicit = Savory.SEO.Provider.Explicit || Savory.Classes.define(function() {
	/** @exports Public as Savory.SEO.Provider.Explicit */
	var Public = {}
	
	/** @ignore */
	Public._construct = function(config) {
		Savory.Objects.merge(this, config, ['name', 'domains', 'locations', 'exclusions', 'inclusions', 'defaultFrequency', 'defaultPriority'])
	    this.defaultFrequency = this.defaultFrequency || 'weekly'
	    this.defaultPriority = this.defaultPriority || 0.5
	}
	
	/**
	 * The URL set name.
	 * 
	 * @returns {String}
	 */
	Public.getName = function() {
		return this.name
	}

	/**
	 * The root URLs of the domains for which we provide locations.
	 * 
	 * @returns {String[]}
	 */
	Public.getDomains = function() {
		return this.domains
	}
	
	/**
	 * The locations in the form of:
	 * {uri: '...',  lastModified: date, frequency: '', priority: number between 0.0 and 1.0}
	 * 
	 * @returns {Savory.Iterators.Iterator}
	 */
	Public.getLocations = function() {
		return new Savory.Iterators.Transformer(new Savory.Iterators.Array(this.locations), massage, this)
	}
	
	/**
	 * The URLs to exclude for robots.txt.
	 * 
	 * @returns {Savory.Iterators.Iterator}
	 */
	Public.getExclusions = function() {
		return new Savory.Iterators.Array(this.inclusions)
	}

	/**
	 * The URLs to include for robots.txt.
	 * 
	 * @returns {Savory.Iterators.Iterator}
	 */
	Public.getInclusions = function() {
		return new Savory.Iterators.Array(this.inclusions)
	}
	
	//
	// Private
	//

	function massage(location) {
		if (Savory.Objects.isString(location)) {
			return {
				uri: String(location),
				lastModified: new Date(),
				frequency: defaultFrequency,
				priority: defaultPriority
			}
		}
		
		else return location
    }
	
	return Public
}())
