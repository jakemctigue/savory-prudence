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

document.executeOnce('/savory/service/authentication/')
document.executeOnce('/savory/service/authorization/')
document.executeOnce('/savory/foundation/prudence/resources/')

function handleBefore(conversation) {
	if (Savory.Resources.hasRelativePrefix(conversation, application.globals.get('savory.service.authorization.excludeFromFilter'))) {
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
