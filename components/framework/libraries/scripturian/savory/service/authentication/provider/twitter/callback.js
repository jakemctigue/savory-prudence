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

document.executeOnce('/savory/service/authentication/')

/** @ignore */
function handleInit(conversation) {
	conversation.addMediaTypeByName('text/html')
}

/** @ignore */
function handleGet(conversation) {
	return Savory.Authentication.getProviders().Twitter.handle(conversation)	
}
