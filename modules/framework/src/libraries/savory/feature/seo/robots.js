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

document.executeOnce('/savory/feature/seo/')
document.executeOnce('/savory/foundation/json/')
document.executeOnce('/savory/foundation/iterators/')
document.executeOnce('/savory/foundation/prudence/resources/')

/** @ignore */
function handleInit(conversation) {
    conversation.addMediaTypeByName('application/json')
    conversation.addMediaTypeByName('application/java')
}

/** @ignore */
function handleGet(conversation) {
	var domain = Savory.SEO.getCurrentDomain(conversation)
	if (domain) {
		var robots = {
			exclusions: Savory.Iterators.toArray(domain.getExclusions()),
			inclusions: Savory.Iterators.toArray(domain.getInclusions())
		}
		return conversation.mediaType == 'application/java' ? robots : Savory.JSON.to(robots)
	}
	else {
		return Savory.Resources.Status.ClientError.NotFound
	}
}
