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
document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/templates/')
document.executeOnce('/savory/foundation/jvm/')
document.executeOnce('/savory/foundation/files/')
document.executeOnce('/savory/foundation/json/')
document.executeOnce('/savory/foundation/prudence/logging/')
document.executeOnce('/mongo-db/')

var Savory = Savory || {}

/**
 * Allows text localization by loading text packs from
 * either MongoDB or JSON files. Text packs are cached in memory, inheritable
 * and overridable. Integrated with Savory templates for easy casting of
 * localized text.
 * <p>
 * Inherently supports right-to-left languages by storing and inheriting
 * directional flags per individual text entry.
 * <p>
 * See: /handlers/savory/service/internationalization/textpack-filter/
 * 
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.1
 */
Savory.Internationalization = Savory.Internationalization || function() {
	/** @exports Public as Savory.Internationalization */
    var Public = {}

	/**
	 * The library's logger.
	 *
	 * @field
	 * @returns {Savory.Logging.Logger}
	 */
	Public.logger = Savory.Logging.getLogger('internationalization')
	
	/**
	 * Installs the library's filters.
	 * <p>
	 * Can only be called from Prudence configuration scripts!
	 */
	Public.routing = function() {
		dynamicWeb = router.filterBase(dynamicWebBaseURL, '/savory/service/internationalization/textpack-filter/', applicationInstance.context, dynamicWeb).next
	}
    
    Public.getCurrentPack = function(conversation) {
    	var pack = conversation.locals.get('savory.service.internationalization.text')
    	if (!Savory.Objects.exists(pack)) {
    		pack = Public.getPack()
    		conversation.locals.put('savory.service.internationalization.text', pack)
    		//application.logger.info(pack.get)
    		//application.logger.info(Savory.JSON.to(conversation.locals.get('savory.service.internationalization.text'),true))
    		//application.logger.info(conversation.locals.get('savory.service.internationalization.text').get('hi'))
    	}
    	return pack
    }
	
	/**
	 * Gets a text pack from either the MongoDB 'textpacks' collection or a JSON file.
	 * Support text pack inheritence and caching text packs in memory.
	 * 
	 * @param [locale=Savory.JVM.getSystemLocale()] The locale
	 * @returns {Savory.Internationalization.Pack}
	 */
	Public.getPack = function(locale) {
		if (Savory.Objects.isString(locale)) {
			locale = {language: String(locale)}
		}
		
		locale = locale || defaultLocale || Savory.JVM.getSystemLocale()
		
		var cacheKey, pack
		
		if (cache) {
			cacheKey = getCacheKey(locale)
			pack = cache.get(cacheKey)
		}
		
		if (pack) {
			var duration = new Date() - pack.timestamp
			if (duration > cacheDuration) {
				pack = null
				cache.remove(cacheKey)
			}
		}
		
		if (!pack) {
			var textPack = load(locale)
			
			// Fallbacks
			if (!textPack) {
				delete locale.variant
				textPack = load(locale)
				if (!textPack) {
					delete locale.country
					textPack = load(locale)
				}
			}
			
			if (textPack) {
				var text = {}, directions = {}
				
				var direction = (textPack.direction == 'rtl')

				// Inherit all text and directions
				if (textPack.inherit) {
					var inherit = Savory.Objects.array(textPack.inherit)
					for (var i in inherit) {
						var inheritPack = Public.getPack(inherit[i])
						if (inheritPack) {
							Savory.Objects.merge(text, inheritPack.text)
							Savory.Objects.merge(directions, inheritPack.directions)
						}
					}
				}
				
				// Our text and directions
				var ourText = Savory.Objects.flatten(textPack.text)
				var ourDirections = {}
				for (var t in ourText) {
					ourDirections[t] = direction
				}
				
				// Merge ours over the inherited
				Savory.Objects.merge(text, ourText)
				Savory.Objects.merge(directions, ourDirections)
				
				pack = new Public.Pack(text, directions, direction)
				
				/*if (cache) {
					var existing = cache.putIfAbsent(cacheKey, pack)
					if (existing) {
						pack = existing
					}
				}*/
			}
		}

		return pack
	}
	
	/**
	 * @class
	 * @see Savory.Internationalization#getPack
	 */
	Public.Pack = Savory.Classes.define(function() {
		/** @exports Public as Savory.Internationalization.Pack */
	    var Public = {}
	    
	    /** @ignore */
	    Public._construct = function(text, directions, defaultDirection) {
			this.text = text
			this.directions = directions
			this.defaultDirection = defaultDirection
			this.timestamp = new Date()
	    }
		
		/**
		 * Gets a value from the text pack, optionally casting it
		 * as a template if more arguments are provided (see {@link Savory.Templates#cast}).
		 * If the key does not exist in the pack, returns the key.
		 * 
		 * @param {String} key The key
		 * @returns {String} The key value, the cast key value or the key
		 */
	    Public.get = function(key/*, arguments */) {
			var value = this.text[key] || key
			if (value && (arguments.length > 1)) {
				var args = Savory.Objects.slice(arguments, 1)
				value = value.cast.apply(value, args)
			}
			return value
		}

		/**
		 * As {@link #get}, but returns null if the key is not found.
		 * 
		 * @param {String} key The key
		 * @returns {String} The key value, the cast key value or null
		 */
	    Public.getOrNull = function(key/*, arguments */) {
			var value = this.text[key] || null
			if (value && (arguments.length > 1)) {
				var args = Savory.Objects.slice(arguments, 1)
				value = value.cast.apply(value, args)
			}
			return value
		}
		
		/**
		 * Returns direction for a key, or the default direction
		 * for the text pack.
		 * 
		 * @param {String} [key] The key (if not provided, returns the
		 *        default direction for the text pack)
		 * @returns {String} Either 'ltr' or 'rtl'
		 */
	    Public.getDirection = function(key) {
			var direction
			if (Savory.Objects.exists(key)) {
				direction = this.directions[key]
				if (!Savory.Objects.exists(direction)) {
					// This should never happen if the key exists in the text pack
					direction = this.defaultDirection
				}
			}
			else {
				direction = this.defaultDirection
			}

			return direction ? 'rtl' : 'ltr'
		}
		
		return Public
	}())
	
	//
	// Private
	//
	
	function getCacheKey(locale) {
		var cacheKey = ''
		
		if (locale.language) {
			cacheKey = locale.language
		}
		if (locale.country) {
			cacheKey += (cacheKey.length ? '_' : '') + locale.country
		}
		if (locale.variant) {
			cacheKey += (cacheKey.length ? '_' : '') + locale.variant
		}
		
		return cacheKey
	}
	
	function load(locale) {
		var textPack
		
		if (basePath) {
			// Try from file first
			try {
				textPack = Savory.JSON.from(Savory.Files.loadText(basePath + getCacheKey(locale) + '.json'))
			}
			catch (x if x.javaException instanceof java.io.FileNotFoundException) {
			}
			
			/*textPack = Savory.Resources.request({
				file: basePath + getCacheKey(locale) + '.json',
				result: 'json'
			})*/
		}
		
		if (!textPack) {
			textPack = textPacksCollection.findOne({locale: locale})
		}
		
		return textPack
	}
	
	//
	// Initialization
	//
	
	var textPacksCollection = new MongoDB.Collection('textpacks')
	textPacksCollection.ensureIndex({locale: 1}, {unique: true})

	var defaultLocale = application.globals.get('savory.service.internationalization.locale')
	if (Savory.Objects.isString(defaultLocale)) {
		defaultLocale = {language: String(defaultLocale)}
	}
	var basePath = application.globals.get('savory.service.internationalization.path')
	
	var cache
	var cacheDuration = application.globals.get('savory.service.internationalization.cacheDuration')
	if (cacheDuration > 0) {
		cache = application.globals.get('savory.service.internationalization.cache')
		if (!cache) {
			cache = application.getGlobal('savory.service.internationalization.cache', Savory.JVM.newMap(true))
		}
	}
	
	return Public
}()