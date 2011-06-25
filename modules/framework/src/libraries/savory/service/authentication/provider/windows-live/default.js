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

document.executeOnce('/savory/integration/backend/windows-live/')
document.executeOnce('/savory/foundation/classes/')
document.executeOnce('/savory/foundation/prudence/resources/')

Savory = Savory || {Authentication: {Provider: {}}}

/**
 * @class
 * @name Savory.Authentication.Provider.WindowsLive
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Authentication.Provider.WindowsLive = Savory.Authentication.Provider.WindowsLive || Savory.Classes.define(function() {
	/** @exports Public as Savory.Authentication.Provider.WindowsLive */
    var Public = {}

    /** @ignore */
    Public._construct = function(config) {
    	Savory.Objects.merge(this, config, ['name', 'icon'])
    	
    	this.name = this.name || 'Windows Live'
    	this.icon = this.icon || 'media/savory/service/authentication/windows-live.png'

		// Icon is from Aquaticus.Social:
		// http://jwloh.deviantart.com/art/Aquaticus-Social-91014249
    }

    Public.getName = function() {
		return this.name
	}
	
    Public.getIcon = function(conversation) {
		return conversation.pathToBase + '/' + this.icon
	}
	
    Public.getUri = function(conversation) {
		return Savory.Resources.buildUri(conversation.pathToBase + '/authentication/provider/windows-live/', {from: conversation.query.get('from')})
	}
	
    Public.login = function(windowsLiveSession, conversation) {
		var id = windowsLiveSession.id
		if (id) {
			return Savory.Authentication.loginFromProvider('windowsLive', {id: id, displayName: 'Windows Live Guest'}, conversation)
		}
		
		return null
	}

    Public.handle = function(conversation) {
		switch (String(conversation.request.method)) {
			case 'POST':
				var windowsLiveSession = Savory.WindowsLive.getSession(conversation)
				if (windowsLiveSession) {
					var session = this.login(windowsLiveSession, conversation)
					if (session) {
						conversation.response.redirectSeeOther(windowsLiveSession.from || Savory.Authentication.getUri())
						return null
					}
					
					conversation.statusCode = Savory.Resources.Status.ClientError.BadRequest
					return 'Invalid Windows Live session'
				}
				
				conversation.statusCode = Savory.Resources.Status.ClientError.BadRequest
				return 'Could not get Windows Live session'
				
			case 'GET':
				conversation.response.redirectSeeOther(Savory.WindowsLive.getAuthenticationUri(conversation.query.get('from') || Savory.Authentication.buildUri()))
				return null
		}
	}

	return Public
}())