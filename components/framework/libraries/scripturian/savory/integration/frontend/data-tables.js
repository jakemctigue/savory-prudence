//
// This file is part of the Savory Framework for Prudence
//
// Copyright 2011 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the LGPL version 3.0:
// http://www.gnu.org/copyleft/lesser.html
//
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.executeOnce('/sincerity/templates/')
document.executeOnce('/sincerity/json/')
document.executeOnce('/sincerity/jvm/')
document.executeOnce('/savory/foundation/html/')
document.executeOnce('/prudence/resources/')
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