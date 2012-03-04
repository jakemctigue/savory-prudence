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
document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/cryptography/')
document.executeOnce('/savory/foundation/html/')
document.executeOnce('/savory/foundation/prudence/resources/')

var Savory = Savory || {}

/**
 * Integration with Gravatar.
 * 
 * @class
 * @param {String} email The user's email address (note that Gravatar treats emails with case-insensitivity)
 * @param [conversation] The Prudence conversation
 * @see Visit <a href="http://en.gravatar.com/site/implement/">Gravatar developer resources</a>
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Gravatar = Savory.Gravatar || Savory.Classes.define(function() {
	/** @exports Public as Savory.Gravatar */
    var Public = {}
    
    /** @ignore */
    Public._construct = function(email, conversation) {
    	this.email = email
    	this.conversation = conversation
    	this.hash = null
    }

    /**
	 * The hash for the user's email.
	 * 
	 * @returns {String} A hex-encoded MD5 hash
	 */
    Public.getHash = function() {
		if (!this.hash) {
			this.hash = this.email ? Savory.Cryptography.md5(email.trim().toLowerCase()) : ''
		}
		return this.hash
	}
	
	/**
	 * Returns the URI to the user's profile.
	 * 
	 * @returns {String}
	 */
    Public.getProfileUri = function() {
		return profileUri + this.getHash()
	}
	
	/**
	 * Returns the the content of the user's profile.
	 * 
	 * @returns {Object}
	 */
    Public.getProfile = function() {
		return Savory.Resources.request({
			uri: this.getProfileUri() + '.json',
			mediaType: 'application/json'
		})
	}
	
	/**
	 * Returns the URI to the avatar's image. 
	 * 
	 * @param {Number} [size] Size in pixels of each side of the square (Gravatar defaults to 80px)
	 * @returns {String} A URI for the user's avatar, or Gravatar's generic avatar if not found
	 */
    Public.getAvatarUri = function(size) {
		var uri = avatarUri + this.getHash()
		return Savory.Objects.exists(size) ? Savory.Resources.buildUri(uri, {s: size}) : uri
	}
	
	/**
	 * Returns an HTML img element for the avatar's image.
	 * 
	 * @param {Number} [size] Size in pixels of each side of the square (Gravatar defaults to 80px)
	 * @param {Object} [params] Optional params to merge
	 * @returns {String} The img element
	 * @see Savory.HTML#img
	 */
    Public.img = function(size, params) {
		var uri = this.getAvatarUri(size)
		size = (size || 80) + 'px'
		params = params ? Savory.Objects.clone(params) : {}
		params = Savory.Objects.merge({src: uri, width: size, height: size}, params)
		return Savory.HTML.img(params)
	}
	
	//
	// Initialization
	//
    
    var profileUri = 'http://www.gravatar.com/'
    var avatarUri = 'http://www.gravatar.com/avatar/'
    
    return Public
}())
