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

document.executeOnce('/savory/service/rest/')

// Makes sure that lazy routes are reset at the same time as this document is reset
Savory.REST.getRoutes().reset()

// Makes sure to create lazy resources in this document
/** @ignore */
function create(constructor) {
	return eval(constructor)()
}

/** @ignore */
function handleInit(conversation) {
	var resource = Savory.REST.getResource(conversation, create)
	if (resource && resource.handleInit) {
		resource.handleInit(conversation)
	}
}

/** @ignore */
function handleGet(conversation) {
	var resource = Savory.REST.getResource(conversation, create)
	if (!resource) {
		return Prudence.Resources.Status.ClientError.NotFound
	}
	if (!resource.handleGet) {
		return Prudence.Resources.Status.ClientError.MethodNotAllowed
	}
	return resource.handleGet(conversation)
}

/** @ignore */
function handleGetInfo(conversation) {
	var resource = Savory.REST.getResource(conversation, create)
	if (!resource) {
		return Prudence.Resources.Status.ClientError.NotFound
	}
	return resource.handleGetInfo(conversation)
}

/** @ignore */
function handlePost(conversation) {
	var resource = Savory.REST.getResource(conversation, create)
	if (!resource) {
		return Prudence.Resources.Status.ClientError.NotFound
	}
	if (!resource.handlePost || !resource.allowPost) {
		return Prudence.Resources.Status.ClientError.MethodNotAllowed
	}
	return resource.handlePost(conversation)
}

/** @ignore */
function handlePut(conversation) {
	var resource = Savory.REST.getResource(conversation, create)
	if (!resource) {
		return Prudence.Resources.Status.ClientError.NotFound
	}
	if (!resource.handlePut || !resource.allowPut) {
		return Prudence.Resources.Status.ClientError.MethodNotAllowed
	}
	return resource.handlePut(conversation)
}

/** @ignore */
function handleDelete(conversation) {
	var resource = Savory.REST.getResource(conversation, create)
	if (!resource) {
		return Prudence.Resources.Status.ClientError.NotFound
	}
	if (!resource.handleDelete || !resource.allowDelete) {
		return Prudence.Resources.Status.ClientError.MethodNotAllowed
	}
	return resource.handleDelete(conversation)
}
