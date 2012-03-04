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

document.executeOnce('/savory/foundation/lucene/')
document.executeOnce('/savory/foundation/iterators/')
document.executeOnce('/savory/foundation/prudence/logging/')
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
	 * @returns {Savory.Logging.Logger}
	 */
	Public.logger = Savory.Logging.getLogger('search')
    
    //
    // Private
    //
    
	//
	// Initialization
	//

	return Public	
}()
