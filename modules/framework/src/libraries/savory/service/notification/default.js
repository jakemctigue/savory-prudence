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

//
// See:
//   /tasks/savory/service/notification/send-immediate.js
//   /tasks/savory/service/notification/send-daily.js
//   /tasks/savory/service/notification/send-weekly.js
//
// Subscription:
//  service: email, sms, im, etc.
//  mode: immediate, daily, weekly
//  address (used internally by service) OR reference (oid of user to look up)
//

//
// TODOs:
//  1. store notification templates?
//  2. service: mongodb-based inbox
//  3. hierarchical subscribe (channel startsWith)
//  

document.executeOnce('/savory/service/authentication/')
document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/classes/')
document.executeOnce('/savory/foundation/prudence/lazy/')
document.executeOnce('/savory/foundation/prudence/logging/')
document.executeOnce('/mongo-db/')

var Savory = Savory || {}

/**
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Notification = Savory.Notification || function() {
	/** @exports Public as Savory.Notification */
    var Public = {}

	/**
	 * The library's logger.
	 *
	 * @field
	 * @returns {Savory.Logging.Logger}
	 */
	Public.logger = Savory.Logging.getLogger('notification')

	/**
	 */
	Public.getServices = function() {
		return Savory.Lazy.getGlobalMap('savory.service.notification.services', Public.logger, function(constructor) {
			return eval(constructor)()
		})
	}
	
	Public.queueForAddress = function(service, address, notice, origin) {
		notice = {direct: {service: service, address: address}, notice: notice, timestamp: new Date()}
		if (origin) {
			notice.origin = origin
		}
		noticesCollection.insert(notice)
	}

	Public.queueForReference = function(service, reference, notice, origin) {
		notice = {direct: {service: service, reference: reference}, notice: notice, timestamp: new Date()}
		if (origin) {
			notice.origin = origin
		}
		noticesCollection.insert(notice)
	}
	
	Public.queueForChannel = function(channel, notice, origin) {
		notice = {channel: channel, notice: notice, timestamp: new Date()}
		if (origin) {
			notice.origin = origin
		}
		noticesCollection.insert(notice)
	}
	
	Public.subscribe = function(channel, subscription) {
		channelsCollection.upsert({name: channel}, {$addToSet: {subscriptions: subscription}})
	}
	
	Public.unsubscribe = function(channel, subscription) {
		// TODO
		//channelsCollection.insert({name: channel}, {$addToSet: {subscriptions: subscription}})
	}
	
	Public.getChannel = function(name) {
		return channelsCollection.findOne({name: name})
	}
	
	Public.getSubscriptionsForAddress = function(service, address) {
		var subscriptions = []
		for (var cursor = channelsCollection.find({name: channel, subscriptions: {$elemMatch: {service: service, address: address}}}); cursor.hasNext(); ) {
			var channel = cursor.next()
			for (var s in channel.subscriptions) {
				var subscription = channel.subscriptions[s]
				if ((service == subscription.service) && (address == subscription.address)) {
					subscriptions.push({channel: channel.name, subscription: subscription})
					break
				}
			}
		}
		return subscriptions
	}
	
	Public.getSubscriptionsForReference = function(reference) {
		var subscriptions = []
		for (var cursor = channelsCollection.find({name: channel, 'subscriptions.reference': reference}); cursor.hasNext(); ) {
			var channel = cursor.next()
			for (var s in channel.subscriptions) {
				var subscription = channel.subscriptions[s]
				if (reference.equals(subscription.reference)) {
					subscriptions.push({channel: channel.name, subscription: subscription})
					break
				}
			}
		}
		return subscriptions
	}
	
	Public.send = function(subscription, notice, origin) {
		var service = Public.getServices()[subscription.service]
		if (service) {
			var address
			if (Savory.Objects.exists(subscription.address)) {
				address = subscription.address
			}
			else if (Savory.Objects.exists(subscription.reference)) {
				var reference = getReference(subscription.reference)
				if (reference) {
					address = service.getAddress(reference.value, reference.type)
				}
			}
			
			if (address) {
				try {
					service.send(origin, address, notice)
				}
				catch (x) {
					Public.logger.exception(x)
				}
			}
			else {
				Public.logger.warning('No address found in subscription')
			}
		}
		else {
			Public.logger.warning('Unsupported subscription service: ' + subscription.service)
		}
	}
	
	Public.sendDigest = function(subscription, entries, mode, origin) {
		var service = Public.getServices()[subscription.service]
		if (service) {
			try {
				service.sendDigest(origin, subscription.address, entries, mode)
			}
			catch (x) {
				Public.logger.exception(x)
			}
			
			// TODO: reference
		}
		else {
			Public.logger.warning('Unsupported subscription service: ' + subscription.service)
		}
	}

	Public.sendQueuedNotices = function() {
		Public.logger.fine('Checking for immediate notices to send')
		
		var query = {sentImmediate: {$exists: false}}
		var update = {$set: {sentImmediate: new Date()}}
		
		var count = 0
		var notice = noticesCollection.findAndModify(query, update)
		while (notice) {
			if (notice.direct) {
				Public.send(notice.direct, notice.notice, notice.origin)
			}
			else if (notice.channel) {
				var channel = Public.getChannel(notice.channel)
				if (channel) {
					for (var s in channel.subscriptions) {
						var subscription = channel.subscriptions[s]
						if ((subscription.mode == 'immediate') || !subscription.mode) {
							Public.send(subscription, notice.notice, notice.origin)
							count++
						}
					}
				}
			}

			update.$set.sentImmediate = new Date()
			notice = noticesCollection.findAndModify(query, update)
		}

		if (count > 0) {
			Public.logger.info('Sent {0} immediate notices', count)
		}
	}
	
	Public.sendQueuedDigests = function(mode) {
		Public.logger.fine('Checking for {0} digests to send', mode)
		
		var sentProperty = Savory.Objects.camelCase('sent', mode)
		var query = {channel: {$exists: true}}
		query[sentProperty]= {$exists: false}
		
		var update = {$set: {}}
		update.$set[sentProperty] = new Date()

		var notice = noticesCollection.findAndModify(query, update)
		while (notice) {
			if (notice.channel) {
				var channel = Public.getChannel(notice.channel)
				if (channel) {
					for (var s in channel.subscriptions) {
						var subscription = channel.subscriptions[s]
						if (subscription.mode == mode) {
							digestsCollection.upsert({subscription: subscription}, {$push: {entries: {channel: channel.name, notice: notice.notice, origin: notice.origin, timestamp: notice.timestamp}}})
						}
					}
				}
			}

			update.$set[sentProperty] = new Date()
			notice = noticesCollection.findAndModify(query, update)
		}
		
		query = {'subscription.mode': mode}

		var count = 0
		var digest = digestsCollection.findAndRemove(query)
		while (digest) {
			Public.sendDigest(digest.subscription, digest.entries, mode, digest.origin)
			count++
			
			digest = digestsCollection.findAndRemove(query)
		}

		if (count > 0) {
			Public.logger.info('Sent {0} {1} digests', count, mode)
		}
	}
	
	/**
	 * @class
	 * @name Savory.Notification.Service
	 */
	Public.Service = Savory.Classes.define(function() {
		/** @exports Public as Savory.Notification.Service */
		var Public = {}
		
		Public._configure = ['name', 'from', 'site']

	    Public.getName = function() {
			return this.name
		}

	    Public.send = function(from, to, notice) {
		}
		
	    Public.sendDigest = function(from, to, entries, mode) {
		}
		
	    Public.getAddress = function(reference, type) {
	    	return null
	    }
		
		return Public
	}())
	
	//
	// Private
	//
	
	function getReference(reference) {
		var type = 'user'
		var id = reference
		
		if (Savory.Objects.isDict(reference, true)) {
			type = reference.type
			id = reference.id
		}
		
		var value
		switch (String(type)) {
			case 'user':
				value = Savory.Authentication.getUserById(id)
				break
			
			default:
				Public.logger.warning('Unsupported reference type: ' + type)
				return null
		}
		
		if (Savory.Objects.exists(value)) {
			return {type: type, value: value}
		}
		else {
			Public.logger.warning('Reference of type {0} not found', type)
			return null
		}
	}
	
	//
	// Initialization
	//

	var channelsCollection = new MongoDB.Collection('channels')
	channelsCollection.ensureIndex({name: 1}, {unique: true})
	var noticesCollection = new MongoDB.Collection('notices')
	noticesCollection.ensureIndex({channel: 1})
	var digestsCollection = new MongoDB.Collection('digests')
	digestsCollection.ensureIndex({'subscription.mode': 1})
	
	return Public
}()
