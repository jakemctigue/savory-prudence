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
		fn: function(value, field) {
			return true
		}
	}

    Public.number = {
		mask: /[\d\-\.]/,
		fn: function(value, field) {
			if (typeof value == 'number') {
				return true
			}
			return !isNaN(value - 0) ? true : 'not'
		},
		errors: {
			not: 'Must be a number'
		}
	}

    Public.integer = {
		mask: /[\d\-]/,
		fn: function(value, field) {
			return value % 1 == 0 ? true : 'not'
		},
		errors: {
			not: 'Must be an integer'
		}
	}
	
	return Public
}()
