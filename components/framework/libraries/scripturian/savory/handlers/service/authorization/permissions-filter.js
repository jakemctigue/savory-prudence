//
// This file is part of the Savory Framework
//
// Copyright 2011-2012 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the LGPL version 3.0:
// http://www.gnu.org/copyleft/lesser.html
//
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.executeOnce('/savory/service/authentication/')
document.executeOnce('/savory/service/authorization/')
document.executeOnce('/prudence/resources/')

function handleBefore(conversation) {
	if (Prudence.Resources.hasRelativePrefix(conversation, application.globals.get('savory.service.authorization.excludeFromFilter'))) {
		return 'continue'
	}

	if (!conversation.locals.get('savory.service.authorization.permissions')) {
		var session = Savory.Authentication.getCurrentSession(conversation)
		if (session) {
			var user = session.getUser()
			if (user) {
				var permissions = Savory.Authorization.getPermissions(user)
				if (permissions) {
					conversation.locals.put('savory.service.authorization.permissions', permissions)
				}
			}
		}
	}
	
	return 'continue'
}
