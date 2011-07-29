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

var Savory = Savory || {}

/**
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Validation = Savory.Validation || function() {
	/** @exports Public as Savory.Validation */
    var Public = {}

	Public.string = {
		fn: function(value, field, conversation) {
			return true
		},
		serverValidation: false,
		clientValidation: false
	}

    Public.number = {
		mask: /[\d\-\.]/,
		fn: function(value, field, conversation) {
			if (typeof value == 'number') {
				return true
			}
			return !isNaN(value - 0) ? true : this.textPack.get('savory.foundation.validation.number.not')
		},
		textKeys: ['savory.foundation.validation.number.not']
	}

    Public.integer = {
		mask: /[\d\-]/,
		fn: function(value, field, conversation) {
			return value % 1 == 0 ? true : this.textPack.get('savory.foundation.validation.integer.not')
		},
		textKeys: ['savory.foundation.validation.integer.not']
	}
    
    Public.email = {
		// See: http://fightingforalostcause.net/misc/2006/compare-email-regex.php
    	fn: function(value, field, conversation) {
    		var emailRegExp = /^([\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+\.)*[\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+@((((([a-z0-9]{1}[a-z0-9\-]{0,62}[a-z0-9]{1})|[a-z])\.)+[a-z]{2,6})|(\d{1,3}\.){3}\d{1,3}(\:\d{1,5})?)$/i
			return emailRegExp.test(value) ? true : this.textPack.get('savory.foundation.validation.email.not')
    	},
		textKeys: ['savory.foundation.validation.email.not']
    }
    
    Public.reCaptcha = {
    	fn: function(value, field, conversation) {
	    	return this.reCaptcha.validate(conversation) ? true : this.textPack.get('savory.foundation.validation.reCaptcha.not')
    	},
		textKeys: ['savory.foundation.validation.reCaptcha.not'],
    	clientValidation: false
    }
	
	return Public
}()
