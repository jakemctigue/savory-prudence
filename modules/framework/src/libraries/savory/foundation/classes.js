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
 * Class utilities.
 * 
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Classes = Savory.Classes || function() {
	/** @exports Public as Savory.Classes */
    var Public = {}
    
    Public.inherit = function(Parent, Child) {
    	// A no-op constructor
    	var Intermediate = function() {}
    	
    	// ...with the same prototype as Parent
    	Intermediate.prototype = Parent.prototype
    	
    	// Inherit!
    	Child.prototype = new Intermediate()

    	// Make sure instanceof will work (it compares constructors)
    	Child.prototype.constructor = Child

    	// Access to parent
    	Child.prototype.superclass = Parent
    }
    
    /**
     * @param definition
     * @param [definition._construct]
     * @param [definition._inherit]
     */
    Public.define = function(definition) {
    	var TheClass
    	
    	if (definition._construct) {
    		if (typeof definition._construct != 'function') {
    			throw 'Constructor must be a function'
    		}
    		TheClass = definition._construct
    	}
    	else {
    		// Default no-op constructor
    		TheClass = function() {}
    	}
    	
    	if (definition._inherit) {
    		Public.inherit(definition._inherit, TheClass)
    	}
    	else {
        	// Make sure instanceof will work (it compares constructors)
    		
    		// TODO: do we need to hook this up to the external class var somehow?!?!?!
        	TheClass.prototype.constructor = TheClass
    	}

    	// Access to original definition
    	TheClass.prototype.definition = definition

    	// Public members go in the prototype (overriding inherited members of the same name)
    	for (var c in definition) {
    		if (c[0] != '_') {
    			TheClass.prototype[c] = definition[c]
    		}
    	}
    	
    	return TheClass
    }
	
    return Public
}()