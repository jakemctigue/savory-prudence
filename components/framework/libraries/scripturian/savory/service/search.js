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

document.executeOnce('/sincerity/lucene/')
document.executeOnce('/sincerity/iterators/')
document.executeOnce('/prudence/logging/')
document.executeOnce('/mongo-db/')

var Savory = Savory || {}

/**
 * Search!
 * 
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Search = Savory.Search || function() {
	/** @exports Public as Savory.Search */
    var Public = {}

	/**
	 * The library's logger.
	 *
	 * @field
	 * @returns {Prudence.Logging.Logger}
	 */
	Public.logger = Prudence.Logging.getLogger('search')
    
    //
    // Private
    //
    
	//
	// Initialization
	//

	return Public	
}()
