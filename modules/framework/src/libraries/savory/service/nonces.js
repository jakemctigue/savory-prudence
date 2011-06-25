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

document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/prudence/logging/')
document.executeOnce('/mongo-db/')

var Savory = Savory || {}

/**
 * Unique, expirable nonce (number-used-once) implementation. Uses a
 * MongoDB collection to store nonce entries.
 * <p>
 * See: /tasks/savory/foundation/nonces/maintenance/
 * 
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.2
 */
Savory.Nonces = Savory.Nonces || function() {
	/** @exports Public as Savory.Nonces */
    var Public = {}

	/**
	 * The library's logger.
	 *
	 * @field
	 * @returns {Savory.Logging.Logger}
	 */
	Public.logger = Savory.Logging.getLogger('nonces')
	
	/**
	 * Creates a nonce.
	 * 
	 * @param {Number} [duration=application.globals.get('savory.foundation.nonces.defaultDuration')] Duration in milliseconds after which the nonce will expire
	 *        (use 0 to create a nonce that immediately expires)
	 * @param {Date} [now=new Date()] Used to calculate the expiration
	 * @return {String} The nonce
	 */
	Public.create = function(duration, now) {
		var nonce = MongoDB.newId()
		
		duration = Savory.Objects.ensure(duration, defaultDuration)
		if (duration > 0) {
			var expiration = now ? new Date(now.getTime()) : new Date()
			expiration.setMilliseconds(expiration.getMilliseconds() + duration)
			noncesCollection.insert({_id: nonce, expiration: expiration})
		}
		
		nonce = String(nonce)
		
		if (duration > 0) {
			Public.logger.info('Created: ' + nonce)
		}
		
		return nonce
	}
	
	/**
	 * True if the nonce is valid, and if so invalidates it,
	 * so that it is "used only once" (this is done atomically).
	 * 
	 * @param {String} nonce The nonce to check
	 * @param {Date} [now=new Date()] Used to calculate the expiration
	 * @returns {Boolean}
	 */
	Public.check = function(nonce, now) {
		var entry = nonce ? noncesCollection.findAndRemove({_id: MongoDB.id(nonce)}, 1) : null

		if (entry) {
			now = now || new Date()
			if (entry.expiration >= now) {
				Public.logger.info('Used: ' + nonce)
				return true
			}
		}

		Public.logger.info('Failed check: ' + nonce)
		return false
	}
	
	/**
	 * Removes expired nonces, to save storage space.
	 * 
	 * @param {Date} [now=new Date()] Used to calculate the expiration
	 */
	Public.maintenance = function(now) {
		now = now || new Date()
		var result = noncesCollection.remove({expiration: {$gte: now}}, 1)
		
		if (result && result.n) {
			Public.logger.info('Removed {0} stale {1}', result.n, result.n > 1 ? 'nonces' : 'nonce')
		}
	}
	
	//
	// Initialization
	//
	
	var noncesCollection = new MongoDB.Collection('nonces')

	var defaultDuration = application.globals.get('savory.foundation.nonces.defaultDuration') || (15 * 60 * 1000)
	
	return Public	
}()