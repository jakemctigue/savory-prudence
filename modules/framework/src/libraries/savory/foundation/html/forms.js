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
 * TODO: Handling of HTML (and AJAX?) forms
 * Will use validation lib
 * 
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Forms = Savory.Forms || function() {
	/** @exports Public as Savory.Forms */
    var Public = {}

	/**
	 * @class
	 */
	Public.Form = Savory.Classes.define(function() {
    	/** @exports Public as Savory.Forms.Form */
        var Public = {}
        
        /** @ignore */
        Public._construct = function(conversation, doc) {
    		this.method = String(conversation.request.method)
    		this.action = method == 'POST' ? String(conversation.form.get('action')) : null
    		this.fields = null
        }

        Public.getFields = function() {
			return this.fields
		}
		
        Public.setFields = function(fields) {
        	this.fields = Savory.Objects.array(fields)
			// field.label || field.labelKey
			// field.validator = 'email', 'int', etc.
		}
		
        Public.validate = function() {
			
		}
		
        Public.render = function() {
			document.include(doc)
		}
		
        Public.handle = function() {
			switch (this.method) {
				case 'GET':
					this.render()
					break
					
				case 'POST':
					this.render()
					break
			}
		}
		
		return Public
	}())
	
	return Public
}()
