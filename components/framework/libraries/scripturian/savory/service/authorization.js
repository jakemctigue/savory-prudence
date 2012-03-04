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
//   /handlers/module/authorization/permissions-filter/
//

document.executeOnce('/savory/service/authentication/')
document.executeOnce('/savory/foundation/classes/')
document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/prudence/logging/')
document.executeOnce('/savory/foundation/jvm/')
document.executeOnce('/mongo-db/')

var Savory = Savory || {}

/**
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Authorization = Savory.Authorization || function() {
	/** @exports Public as Savory.Authorization */
    var Public = {}

	/**
	 * The library's logger.
	 *
	 * @field
	 * @returns {Savory.Logging.Logger}
	 */
	Public.logger = Savory.Logging.getLogger('authorization')
	
	/**
	 * Installs the library's filters.
	 * <p>
	 * Can only be called from Prudence configuration scripts!
	 */
	Public.routing = function() {
		dynamicWeb = router.filter(dynamicWebBaseURL, '/savory/service/authorization/permissions-filter/', applicationInstance.context, dynamicWeb).next
	}
	
	/**
	 * @returns {Savory.Authorization.Group}
	 */
	Public.getGroupById = function(id) {
		var now = new Date()
		
		var group = validateGroup(cacheById.get(String(id)), now)
		if (!group) {
			group = groupsCollection.findOne({
				_id: id
			})
			cacheGroup(group, now)
		}
		
		return group ? new Public.Group(group) : null
	}
	
	/**
	 * @returns {Savory.Authorization.Group}
	 */
	Public.getGroupByName = function(name) {
		var now = new Date()
		
		var group = validateGroup(cacheByName.get(name), now)
		if (!group) {
			group = groupsCollection.findOne({
				name: name
			})
			cacheGroup(group, now)
		}
		
		return group ? new Public.Group(group) : null
	}
	
	Public.getEntity = function(entityIdentifier) {
		if (Savory.Objects.isString(entityIdentifier)) {
			return Public.getGroupByName(entityIdentifier)
		}
		
		switch (String(entityIdentifier.type)) {
			case 'user':
				if (entityIdentifier.id) {
					return Authentication.getUserById(entityIdentifier.id)
				}
				else {
					return Authentication.getUserByName(entityIdentifier.name)
				}
				
			case 'group':
				if (entityIdentifier.id) {
					return Public.getGroupById(entityIdentifier.id)
				}
				else {
					return Public.getGroupByName(entityIdentifier.name)
				}
		}
		
		return null
	}
	
	/**
	 * @returns {Savory.Authorization.Permissions}
	 */
	Public.getPermissions = function(entity, excludeAll) {
		var permissions = new Public.Permissions()
		
		// Inherit permissions for all
		if (!excludeAll) {
			var all = Public.getGroupByName('all')
			if (all) {
				permissions.inherit(Public.getPermissions(all, true))
			}
		}
		
		if (entity && entity.getAuthorization) {
			var authorization = entity.getAuthorization()
			if (authorization) {
				// Inherit from entities
				if (authorization.entities) {
					var entities = Savory.Objects.array(authorization.entities)
					for (var e in entities) {
						var entityIdentifier = entities[e]
						var entity = Public.getEntity(entityIdentifier)
						if (entity) {
							permissions.inherit(Public.getPermissions(entity))
						}
					}
				}
				
				// Inherit our permissions
				if (authorization.permissions) {
					permissions.inherit(new Public.Permissions(authorization.permissions))
				}
			}
		}
		
		return permissions
	}
	
	/**
	 * @class
	 * @name Savory.Authorization.Group
	 * @see #getGroupByName
	 * @see #getGroupById
	 */
	Public.Group = Savory.Classes.define(function() {
		/** @exports Public as Savory.Authorization.Group */
	    var Public = {}
	    
	    /** @ignore */
	    Public._construct = function(group) {
	    	this.group = group
	    }

	    Public.getId = function() {
			return this.group._id
		}
		
		Public.getName = function() {
			return this.group.name
		}
		
		Public.getAuthorization = function() {
			return this.group.authorization
		}
		
		return Public
	}())
	
	/**
	 * @class
	 * @name Savory.Authorization.Permissions
	 * @see #getPermissions
	 */
	Public.Permissions = Savory.Classes.define(function() {
		/** @exports Public as Savory.Authorization.Permissions */
	    var Public = {}
	    
	    /** @ignore */
	    Public._construct = function(permissions) {
			this.permissions = permissions ? Savory.Objects.flatten(permissions) : {}
	    }

	    Public.getAll = function() {
			return this.permissions
		}
		
	    Public.get = function(key, cascade) {
			var permission = this.permissions[key]
			if (((permission === undefined) || (permission === null)) && cascade) {
				return getParent.call(this, key.split('.'))
			}
			return permission === undefined ? null : permission
		}
		
	    Public.inherit = function(from) {
			var all = from.getAll()
			for (var a in all) {
				this.permissions[a] = all[a]
			}
		}
		
		//
		// Private
		//
		
		function getParent(keys) {
			var length = keys.length
			if (length > 1) {
				keys = keys.slice(0, length - 1)
				var permission = this.permissions[keys.join('.')]
				if ((permission === undefined) || (permission === null)) {
					return getParent.call(this, keys)
				}
				return permission
			}
			return null
		}
		
		return Public
	}())

	//
    // Private
    //
	
	function cacheGroup(group, now) {
		if (group) {
			group.timestamp = now
			cacheById.put(String(group._id), group)
			cacheByName.put(group.name, group)
			//Public.logger.info('Cached group: ' + group.name)
		}
	}
	
	function validateGroup(group, now) {
		if (group && group.timestamp) {
			if (now - group.timestamp > cacheDuration) {
				cacheById.remove(String(group._id))
				cacheByName.remove(group.name)
				//Public.logger.info('Cached group expired: ' + group.name)
				return null
			}
		}
		
		return group
	}
	
	//
	// Initialization
	//
	
	var groupsCollection = new MongoDB.Collection('groups')
	groupsCollection.ensureIndex({name: 1}, {unique: true})
	
	var cacheDuration = application.globals.get('savory.service.authorization.cacheDuration') || 10000
	var cacheById = application.getGlobal('savory.service.authorization.cacheById', Savory.JVM.newMap(true))
	var cacheByName = application.getGlobal('savory.service.authorization.cacheByName', Savory.JVM.newMap(true))
	
	return Public
}()

