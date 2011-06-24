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

document.executeOnce('/savory/feature/wiki/')

function handleBefore(conversation) {
	if (Savory.Resources.hasRelativePrefix(conversation, application.globals.get('savory.feature.wiki.excludeFromFilter'))) {
		return 'continue'
	}
	
	//Pages.logger.info('Possible page: ' + conversation.reference)
	
	if (conversation.locals.get('savory.feature.wiki.filtered')) {
		//Pages.logger.info("We've already been through the filter")
		return 'continue'
	}

	conversation.locals.put('savory.feature.wiki.filtered', true)
	
	Savory.Wiki.extractPageName(conversation)

	var page = Savory.Wiki.getPage(conversation)
	if (page) {
		//Pages.logger.info('Found page: ' + page.getName())
		return '/savory/feature/wiki/page/'
	}
	
	return 'continue'
}
