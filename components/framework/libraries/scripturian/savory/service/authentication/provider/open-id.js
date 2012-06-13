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

document.executeOnce('/savory/integration/backend/open-id/')
document.executeOnce('/sincerity/classes/')
document.executeOnce('/sincerity/templates/')
document.executeOnce('/prudence/resources/')

Savory = Savory || {Authentication: {}}

/**
 * @class
 * @name Savory.Authentication.OpenIdProvider
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Authentication.OpenIdProvider = Savory.Authentication.Provider.OpenIdProvider || Sincerity.Classes.define(function() {
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
    	
    	arguments.callee.overridden.call(this, this)
    }

    Public.getSlug = function() {
		return this.slug
	}

    Public.getUri = function(conversation) {
		return Prudence.Resources.buildUri(conversation.pathToBase + '/authentication/provider/open-id/' + this.slug + '/', {from: conversation.query.get('from')})
	}
	
    Public.login = function(openIdSession, conversation) {
		var id = openIdSession.id
		if (id) {
			return Savory.Authentication.loginFromProvider(this.slug, {id: id, displayName: this.name + ' Guest'}, conversation)
		}

		return null
	}
	
    Public.handle = function(conversation, username) {
		var openIdSession = Savory.OpenID.getSession(conversation)
		if (openIdSession) {
			// If we got here, it means this a callback from an OpenID provider
			var session = this.login(openIdSession, conversation)
			if (session) {
				conversation.response.redirectSeeOther(conversation.query.get('from') || Savory.Authentication.getUri())
				return 'loggedIn'
			}
		}
		
		if (conversation.query.get('provider')) {
			// If we got here, it means this a callback from an OpenID provider, but with an invalid session
			conversation.statusCode = Prudence.Resources.Status.ClientError.BadRequest
			return 'invalidSession'
		}
		
		// If we passed the above, it means we want redirection to an OpenID provider
		
		var xrdsUri = this.xrdsUri
		if (!xrdsUri) {
			var uri = this.uri
			if (this.username) {
				if (!username) {
					// OpenID provider requires a username, but we don't have one yet
					return 'usernameForm'
				}
				
				uri = uri.cast({username: Prudence.Resources.encodeUrlComponent(username)})
			}
			
			xrdsUri = Savory.OpenID.discoverXrdsUri(uri)
		}
		
		if (xrdsUri) {
			if (this.username) {
				if (!username) {
					// OpenID provider requires a username, but we don't have one yet
					return 'usernameForm'
				}
				
				xrdsUri = xrdsUri.cast({username: Prudence.Resources.encodeUrlComponent(username)})
			}
			
			provider = new Savory.OpenID.Provider(this.slug, xrdsUri)
			var authenticationUri = provider.getAuthenticationUri(conversation.query.get('from'))
			if (authenticationUri) {
				conversation.response.redirectSeeOther(authenticationUri)
				// It's the provider's turn now!
				return 'provider'
			}
			else {
				// Provider did not provide :(
				return 'providerError'
			}
		}
	}

	return Public
}())

/**
 * @class
 * @name Savory.Authentication.OpenIdProviderForm
 * @augments Prudence.Resources.Form
 */
Savory.Authentication.OpenIdProviderForm = Savory.Authentication.OpenIdProviderForm || Sincerity.Classes.define(function() {
	/** @exports Public as Savory.Authentication.OpenIdProviderForm */
    var Public = {}

    /** @ignore */
    Public._inherit = Prudence.Resources.Form

    /** @ignore */
    Public._configure = ['provider', 'conversation']

    /** @ignore */
	Public._construct = function(config) {
    	if (!Sincerity.Objects.exists(this.fields)) {
			this.fields = {
				username: {
					required: true
				}
			}
			
    		if (Sincerity.Objects.exists(this.conversation)) {
    			var textPack = Savory.Internationalization.getCurrentPack(this.conversation)
    			this.fields.username.label = textPack.get('savory.service.authentication.form.openId.label.username', {siteName: this.provider.getName()})
				delete this.conversation // this really shouldn't be kept beyond construction
    		}
    	}
		
		this.includeDocumentName = this.includeDocumentName || '/savory/service/authentication/form/open-id/'
		
		arguments.callee.overridden.call(this, this)
    }

	Public.process = function(results, conversation) {
		if (results.success) {
			this.provider.handle(conversation, results.values.username)
		}
	}

	return Public
}())
