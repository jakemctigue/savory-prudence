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

document.executeOnce('/savory/integration/backend/facebook/')
document.executeOnce('/savory/foundation/classes/')

Savory = Savory || {Authentication: {Provider: {}}}

/**
 * @class
 * @name Savory.Authentication.Provider.Facebook
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Authentication.Provider.Facebook = Savory.Authentication.Provider.Facebook || Savory.Classes.define(function() {
	/** @exports Public as Savory.Authentication.Provider.Facebook */
    var Public = {}
    
    /** @ignore */
    Public._construct = function(config) {
    	Savory.Objects.merge(this, config, ['name', 'icon'])
    	
    	this.name = this.name || 'Facebook'
    	this.icon = this.icon || 'media/savory/service/authentication/facebook.png'

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
		return Savory.Resources.buildUri(conversation.pathToBase + '/authentication/provider/facebook/', {from: conversation.query.get('from')})				
	}

    Public.login = function(facebookSession, conversation) {
		var user = facebookSession.getMe()
		if (user) {
			var id = user.id
			return Savory.Authentication.loginFromProvider('facebook', {id: id, displayName: user.name, firstName: user.first_name, lastName: user.last_name, link: user.link}, conversation)
		}
		
		return null
	}
	
    Public.handle = function(conversation) {
		var facebook = new Savory.Facebook.Application()
		
		var facebookSession = facebook.getSession(conversation)
		if (facebookSession) {
			var session = this.login(facebookSession, conversation)
			if (session) {
				//Authentication.logger.info(conversation.query.get('from'))
				conversation.response.redirectSeeOther(conversation.query.get('from') || Savory.Authentication.getUri())
				return null
			}
			
			conversation.statusCode = Savory.Resources.Status.ClientError.BadRequest
			return 'Invalid Facebook session'
		}
		else {
			var code = conversation.query.get('code')
			if (code) {
				// If we got here, then we did get a session, but it was bad
				conversation.statusCode = Savory.Resources.Status.ClientError.BadRequest
				return 'Invalid Facebook code: ' + code
			}
			
			var error = conversation.query.get('error')
			if (error) {
				conversation.statusCode = Savory.Resources.Status.ClientError.BadRequest
				return 'Facebook error: ' + conversation.query.get('error_reason')
			}
			
			//Authentication.logger.info(conversation.query.get('from'))
			conversation.response.redirectSeeOther(facebook.getAuthenticationUri(conversation.query.get('from')))
			return null
		}
	}
	
	return Public
}())
