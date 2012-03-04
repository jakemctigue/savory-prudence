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

document.executeOnce('/savory/foundation/classes/')
document.executeOnce('/savory/foundation/prudence/resources/')
document.executeOnce('/savory/foundation/prudence/logging/')

/**
 * Support for the Google's ClientLogin authentication standard.
 * 
 * @namespace
 * @see Visit <a href="http://code.google.com/apis/accounts/docs/AuthForInstalledApps.html">ClientLogin for Installed Applications</a>
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.GoogleClientLogin = Savory.GoogleClientLogin || function() {
	/** @exports Public as Savory.GoogleClientLogin */
	var Public = {}

	/**
	 * The library's logger.
	 *
	 * @field
	 * @returns {Savory.Logging.Logger}
	 */
	Public.logger = Savory.Logging.getLogger('google-client-login')

	/**
	 * Installs the HTTP_GOOGLE challenge scheme helper.
	 * <p>
	 * Can only be called from Prudence configuration scripts!
	 */
	Public.registerHelper = function() {
		// Make sure we have an GoogleLogin authenticator helper (Restlet does not have one by default)
		var engine = org.restlet.engine.Engine.instance
		var googleScheme = new org.restlet.data.ChallengeScheme('HTTP_GOOGLE', 'GoogleLogin', 'Google\'s ClientLogin authentication')
		var googleHelper = engine.findHelper(googleScheme, true, false)
		if (null === googleHelper) {
			googleHelper = new JavaAdapter(org.restlet.engine.security.SmtpPlainHelper, {
				// Rhino won't let us implement AuthenticatorHelper directly, because it doesn't have
				// an argumentless constructor. So, we'll jerry-rig SmtpPlainHelper, which is close
				// enough. We'll just make sure to disable its formatRawResponse implementation. 
				
				formatRawResponse: function(cw, challenge, request, httpHeaders) {
					application.logger.warning('HTTP_GOOGLE helper formatRawResponse should never be called!')
				}
			})
			googleHelper.challengeScheme = googleScheme
			engine.registeredAuthenticators.add(googleHelper)
		}
	}
	
	Public.getSession = function(username, password, service, source) {
		source = source || 'threeCrickets-savory-1.0'
		
		var auth = Savory.Resources.request({
			uri: 'https://www.google.com/accounts/ClientLogin',
			method: 'post',
			result: {
				type: 'properties',
				separator: '='
			},
			payload: {
				type: 'web',
				value: {
					accountType: 'HOSTED_OR_GOOGLE',
					Email: username,
					Passwd: password,
					source: source,
					service: service
				}
			}
		})
		
		return new Public.Session(auth.Auth)
	}
	
	/**
	 * Represents a GoogleClientLogin auth code.
	 * 
	 * @class
	 * @name Savory.GoogleClientLogin.Session
	 * @see Savory.GoogleClientLogin#getSession
	 */
	Public.Session = Savory.Classes.define(function() {
		/** @exports Public as Savory.GoogleClientLogin.Session */
	    var Public = {}
	    
	    /** @ignore */
	    Public._construct = function(auth) {
			this.auth = auth
	    }
	    
	    /**
		 * Performs a {@link Savory.Resources#request} with the proper authorization header.
		 * 
		 * @param params
		 */
	    Public.request = function(params) {
	    	params = Savory.Objects.clone(params)
			params.authorization = {
				type: 'http_google',
				rawValue: 'auth=' + this.auth
			}
			return Savory.Resources.request(params)
		}
	    
	    return Public
	}())
 
	return Public
}();