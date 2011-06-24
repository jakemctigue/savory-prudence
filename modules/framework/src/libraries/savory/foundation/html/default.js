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

document.executeOnce('/savory/service/internationalization/')
document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/xml/')
document.executeOnce('/savory/foundation/prudence/resources/')

var Savory = Savory || {}

/**
 * Utilities for secure generation of HTML. Integrates with the Savory
 * Internationalization library.
 * 
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.1
 */
Savory.HTML = Savory.HTML || function() {
	/** @exports Public as Savory.HTML */
    var Public = {}

	/**
	 * As {@link Savory.XML#build}, but set to use HTML and the {@link Savory.Internationalization.Pack}
	 * associated with the Prudence conversation.
	 * 
	 * @param params
	 * @param [params._query] If present together with params.href or params.src
	 *        is applied via {@link Savory.Resources#buildUri}
	 * @param {Boolean} [params._dir=true] If true, sets params.dir according to params._textPack and params._key
	 * @returns The element
	 * @see Savory.XML#build
	 */
	Public.build = function(params) {
		params = params ? Savory.Objects.clone(params) : {}
		params._dir = Savory.Objects.exists(params._dir) ? params._dir : true
		params._html = true
		try {
			params._textPack = params._textPack || Savory.Internationalization.getCurrentPack(conversation)
		}
		catch (x) {
			// No conversation?
		}
		if (params._query && params.href) {
			params.href = Savory.Resources.buildUri(params.href, params._query)
		}
		if (params._query && params.src) {
			params.src = Savory.Resources.buildUri(params.src, params._query)
		}
		if (params._dir && params._textPack && params._key) {
			params.dir = params._textPack.getDirection(params._key) 
		}
		return Savory.XML.build(params)
	}
	
	/**
	 * Builds an HTML div element.
	 * 
	 * @param params
	 * @returns The element
	 * @see #build
	 */
    Public.div = function(params) {
		params = params ? Savory.Objects.clone(params) : {}
		params._tag = 'div'
		return Public.build(params)
	}

	/**
	 * Builds an HTML p element.
	 * 
	 * @param params
	 * @returns The element
	 * @see #build
	 */
    Public.p = function(params) {
		params = params ? Savory.Objects.clone(params) : {}
		params._tag = 'p'
		return Public.build(params)
	}
	
	/**
	 * Builds an HTML span element.
	 * 
	 * @param params
	 * @returns The element
	 * @see #build
	 */
    Public.span = function(params) {
		params = params ? Savory.Objects.clone(params) : {}
		params._tag = 'span'
		return Public.build(params)
	}
	
	/**
	 * Builds an HTML a element.
	 * 
	 * @param params
	 * @returns The element
	 * @see #build
	 */
    Public.a = function(params) {
		params = params ? Savory.Objects.clone(params) : {}
		params._tag = 'a'
		return Public.build(params)
	}
	
	/**
	 * Builds an HTML img element.
	 * 
	 * @param params
	 * @returns The element
	 * @see #build
	 */
    Public.img = function(params) {
		params = params ? Savory.Objects.clone(params) : {}
		params._tag = 'img'
		return Public.build(params)
	}

	/**
	 * Builds an HTML label element.
	 * 
	 * @param params
	 * @returns The element
	 * @see #build
	 */
    Public.label = function(params) {
		params = params ? Savory.Objects.clone(params) : {}
		params._tag = 'label'
		return Public.build(params)
	}
	
	/**
	 * Builds an HTML input element.
	 * 
	 * @param params
	 * @param [params.name] If present, params.value will be populated from conversation.form
	 * @param [labelParams] If present, the input element is prefixed with a label element, where
	 *        the params.for attribute is associated with our params.id (which will be generated
	 *        automatically from params.name if present) (see {@link #label})
	 * @returns The element
	 * @see #build
	 */
    Public.input = function(params, labelParams) {
		params = params ? Savory.Objects.clone(params) : {}
		var html = ''

		if (labelParams) {
			labelParams = Savory.Objects.clone(labelParams)
			params.id = params.id || (params.name ? 'form-' + params.name : null)
			if (params.id) {
				labelParams['for'] = params.id
			}
			html = Public.label(labelParams) + ' '
		}
		
		params._value = true
		params._tag = 'input'
		if (params.name && !params.value) {
			params.value = conversation.form.get(params.name)
		}
		
		return html + Public.build(params)
	}

	/**
	 * Builds an HTML textarea element.
	 * 
	 * @param params
	 * @param [params.name] If present, params._content will be populated from conversation.form
	 * @param [labelParams] If present, the textarea element is prefixed with a label element, where
	 *        the params.for attribute is associated with our params.id (which will be generated
	 *        automatically from params.name if present) (see {@link #label})
	 * @returns The element
	 * @see #build
	 */
    Public.textarea = function(params, labelParams) {
		params = params ? Savory.Objects.clone(params) : {}
		var html = ''

		if (labelParams) {
			labelParams = Savory.Objects.clone(labelParams)
			params.id = params.id || (params.name ? 'form-' + params.name : null)
			if (params.id) {
				labelParams['for'] = params.id
			}
			html = Public.label(labelParams) + ' '
		}

		params._tag = 'textarea'
		if (params.name) {
			params._content = conversation.form.get(params.name)
		}

		return html + Public.build(params)
	}
	
	/**
	 * Builds an HTML input element with params.type='submit'.
	 * 
	 * @param params
	 * @returns The element
	 * @see #build
	 */
    Public.submit = function(params) {
		params = params ? Savory.Objects.clone(params) : {}
		params._value = true
		params._tag = 'input'
		params.type = 'submit'
		return Public.build(params)
	}
		
    return Public
}()
