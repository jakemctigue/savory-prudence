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

document.executeOnce('/savory/foundation/templates/')
document.executeOnce('/savory/foundation/json/')
document.executeOnce('/savory/foundation/jvm/')
document.executeOnce('/savory/foundation/html/')
document.executeOnce('/savory/foundation/prudence/resources/')
document.executeOnce('/mongo-db/')

var Savory = Savory || {}

/**
 * Integration with the jQuery DataTables plugin.
 * 
 * @namespace
 * @see Visit <a href="http://www.datatables.net/">DataTables</a>
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.DataTables = Savory.DataTables || function() {
	/** @exports Public as Savory.DataTables */
    var Public = {}
    
    return Public
}()