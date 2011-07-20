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

    /** @namespace */
	Public.Validation = {
		string: {
			fn: function(value, field) {
				return true
			}
		},
	
		number: {
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
		}, 
	
		integer: {
			mask: /[\d\-]/,
			fn: function(value, field) {
				return value % 1 == 0 ? true : 'not'
			},
			errors: {
				not: 'Must be an integer'
			}
		}
	}
    
    Public.getValidation = function(type) {
    	return Public.Validation[type]
    }
    
    Public.getErrorMessage = function(name, code) {
    	return Public.ErrorMessages[name] ? Public.ErrorMessages[name][code] : 'Error'
    }
	
	/**
	 * @class
	 * @name Savory.Forms.Form
	 * 
	 * @param config
	 * @param config.fields
	 * @param {Boolean} [config.serverValidation=true]
	 * @param {Boolean} [config.clientValidation=true]
	 */
    Public.Form = Savory.Classes.define(function(Module) {
    	/** @exports Public as Savory.Forms.Form */
    	var Public = {}
    	
        /** @ignore */
    	Public._construct = function(config) {
    		this.serverValidation = Savory.Objects.ensure(config.serverValidation, true)
    		this.clientValidation = Savory.Objects.ensure(config.clientValidation, true)
    		this.fields = {}
    		for (var name in config.fields) {
    			var field = config.fields[name]
    			
    			field = Savory.Objects.isString(field) ? {type: String(field)} : Savory.Objects.clone(field)
    			field.label = field.label || name
    			
    			this.fields[name] = field
    		}
    	}
    	
    	Public.getSenchaFields = function(clientValidation) {
    		var sencha = []
    		clientValidation = Savory.Objects.ensure(clientValidation, this.clientValidation)
    		
    		for (var name in this.fields) {
    			var field = this.fields[name]
    			var senchaField = {name: name, fieldLabel: field.label}
    			
    			if (clientValidation) {
        			if (field.required) {
        				senchaField.allowBlank = false
        			}

    				var validator = field.validator
					var validation = Module.getValidation(field.type || 'string')
    				if (!validator) {
						if (validation && validation.fn) {
							validator = validation.fn
						}
    				}
    				
    				if (validator) {
						if (typeof validator != 'function') {
							validator = eval(validator)
						}
						senchaField.validator = validator
    				}
    				
    				var mask = field.mask
    				if (!field.mask && validation && validation.mask) {
    					mask = validation.mask
    				}
        			if (mask) {
        				senchaField.maskRe = mask
        			}
    			}

    			sencha.push(senchaField)
    		}
    		
    		return sencha
    	}
    	
    	Public.validate = function(values) {
    		var results = {success: true}

    		// Check that all required fields are provided
    		if (this.serverValidation) {
	    		for (var name in this.fields) {
	    			var field = this.fields[name]
	    			if (field.required) {
	    				var value = values[name]
	    				if (!Savory.Objects.exists(value) || (value == '')) {
	    					results.success = false
	    					if (results.errors === undefined) {
	    						results.errors = {}
	    					}
	    					results.errors[name] = error
	    				}
	    			}
	    		}
    		}
    		
    		// Check remaining values
    		for (var name in values) {
    			if (!results.success && Savory.Objects.exists(results.errors[name])) {
    				// We've already validated this value
    				continue
    			}

    			var value = values[name]
    			var field = this.fields[name]
    			
    			// Only include defined fields
    			if (Savory.Objects.exists(field) && Savory.Objects.exists(value)) {
    				var error = null
    				
    				if (this.serverValidation) {
        				var validator = field.validator
						var validation = Module.getValidation(field.type || 'string')
        				if (!validator) {
    						if (validation && validation.fn) {
    							validator = validation.fn
    						}
        				}
        				
        				if (validator) {
	    					var validity = validator.call(this, value, field)
	    					if (validity !== true) {
	    						if (validation && validation.errors) {
	    							error = validation.errors[validity]
	    						}
	    						error = error ? error.cast({name: name}) : 'Wrong'
	    					}
	    				}
    				}
    				
    				if (error) {
    					results.success = false
    					if (results.errors === undefined) {
    						results.errors = {}
    					}
    					results.errors[name] = error
    				}
    				else if(Savory.Objects.exists(value)) {
    					if (results.values === undefined) {
    						results.values = {}
    					}
    					results.values[name] = String(value)
    				}
    			}
    		}
    		
    		return results
    	}
    	
    	Public.handle = function(conversation) {
    		if (conversation.request.method == 'POST') {
	    		var values = Savory.JVM.fromMap(conversation.form)
	    		var results = this.validate(values)
	    		this.process(results)
	    		conversation.mediaTypeName = 'application/json'
	    		print(Savory.JSON.to(results))
	    		return true
    		}
    		return false
    	}
    	
    	Public.process = function(results) {
    	}
    	
    	return Public
    }(Public))

	/**
	 * @class
	 */
	Public.Form2 = Savory.Classes.define(function() {
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
