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

document.executeOnce('/savory/foundation/json/')
document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/files/')
document.executeOnce('/savory/foundation/prudence/resources/')
document.executeOnce('/savory/foundation/prudence/logging/')

/** @ignore */
function handleInit(conversation) {
    conversation.addMediaTypeByName('application/json')
}

/** @ignore */
function handleGetInfo(conversation) {
	var query = Savory.Resources.getQuery(conversation, {
		name: 'string'
	})
	
	query.name = 'logs/' + (query.name || 'prudence.log')

	var file = new java.io.File(query.name)
    var lastModified = file.lastModified()
    if (lastModified != 0) {
    	return lastModified
    }
    
    return null
}

/** @ignore */
function handleGet(conversation) {
	var query = Savory.Resources.getQuery(conversation, {
		name: 'string',
		lines: 'int',
		position: 'int',
		forward: 'boolean',
		pattern: 'string'
	})
	
	query.name = 'logs/' + (query.name || 'prudence.log')
	query.lines = query.lines || 20
	
	var temp
	if (query.pattern) {
		var pattern
		try {
			pattern = new RegExp(query.pattern)
		}
		catch (x) {
			// Bad pattern
			return Savory.Resources.Status.ClientError.BadRequest
		}
		
		if (pattern) {
			temp = Savory.Files.temporary('savory-console-', '.log')
			try {
				Savory.Files.grep(query.name, temp, pattern)
			}
			catch (x if x.javaException instanceof java.io.FileNotFoundException) {
				Savory.Logging.getLogger().exception(x)
				return Savory.Resources.Status.ClientError.NotFound
			}
			query.name = temp
		}
	}
	
	try {
		var file = new java.io.File(query.name)
	    var lastModified = file.lastModified()
	    if (lastModified != 0) {
			conversation.modificationTimestamp = lastModified
	    }
		try {
			return Savory.JSON.to(Savory.Files.tail(file, query.position, query.forward, query.lines))
		}
		catch (x if x.javaException instanceof java.io.FileNotFoundException) {
			Savory.Logging.getLogger().exception(x)
			return Savory.Resources.Status.ClientError.NotFound
		}
	}
	finally {
		if (temp) {
			Savory.Files.remove(temp)
		}
	}
}
