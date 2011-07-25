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

document.executeOnce('/savory/integration/backend/open-id/')
document.executeOnce('/savory/foundation/classes/')
document.executeOnce('/savory/foundation/prudence/resources/')

Savory = Savory || {Authentication: {Provider: {}}}

/**
 * @class
 * @name Savory.Authentication.OpenIdProvider
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Authentication.OpenIdProvider = Savory.Authentication.Provider.OpenIdProvider || Savory.Classes.define(function() {
	/** @exports Public as Savory.Authentication.OpenIdProvider */
    var Public = {}

    /** @ignore */
    Public._inherit = Savory.Authentication.Provider

    /** @ignore */
    Public._configure = ['slug', 'xrdsUri', 'uri', 'username']

    /** @ignore */
    Public._construct = function(config) {
    	this.icon = this.icon || 'media/savory/service/authentication/' + this.slug

		// Launchpad icon is the original from the Launchpad site.
		// Other icons are from Aquaticus.Social:
		// http://jwloh.deviantart.com/art/Aquaticus-Social-91014249
    	
    	Savory.Authentication.OpenIdProvider.prototype.superclass.call(this, this)
    }

    Public.getSlug = function() {
		return this.slug
	}

    Public.getUri = function(conversation) {
		return Savory.Resources.buildUri(conversation.pathToBase + '/authentication/provider/open-id/' + this.slug + '/', {from: conversation.query.get('from')})
	}
	
    Public.login = function(openIdSession, conversation) {
		var id = openIdSession.id
		if (id) {
			return Savory.Authentication.loginFromProvider(this.slug, {id: id, displayName: this.name + ' Guest'}, conversation)
		}

		return null
	}
	
    Public.handle = function(conversation) {
		var openIdSession = Savory.OpenID.getSession(conversation)
		if (openIdSession) {
			// If we got here, it means this a callback from an OpenID provider
			var session = this.login(openIdSession, conversation)
			if (session) {
				conversation.response.redirectSeeOther(conversation.query.get('from') || Savory.Authentication.getUri())
				return null
			}
		}
		
		if (conversation.query.get('provider')) {
			conversation.statusCode = Savory.Resources.Status.ClientError.BadRequest
			return 'Invalid OpenID session'
		}
		
		// This means we want redirection to an OpenID provider
		
		var username = conversation.form.get('username')
		var xrdsUri = this.xrdsUri
		if (!xrdsUri) {
			var uri = this.uri
			if (this.username) {
				if (!username) {
					document.include('/savory/service/authentication/form/login/open-id/')
					return null
				}
				
				uri = uri.cast({username: Savory.Resources.encodeUrlComponent(username)})
			}
			
			xrdsUri = Savory.OpenID.discoverXrdsUri(uri)
		}
		
		if (xrdsUri) {
			if (this.username) {
				if (!username) {
					document.include('/savory/service/authentication/form/login/open-id/')
					return null
				}
				
				xrdsUri = xrdsUri.cast({username: Savory.Resources.encodeUrlComponent(username)})
			}
			
			provider = new Savory.OpenID.Provider(this.slug, xrdsUri)
			var authenticationUri = provider.getAuthenticationUri(conversation.query.get('from'))
			if (authenticationUri) {
				conversation.response.redirectSeeOther(authenticationUri)
				return null
			}
			else {
				document.include('/savory/service/authentication/form/login/open-id/')
				return null
			}
		}
	}

	return Public
}())
