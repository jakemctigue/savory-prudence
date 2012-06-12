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

document.executeOnce('/sincerity/classes/')
document.executeOnce('/sincerity/objects/')
document.executeOnce('/sincerity/xml/')
document.executeOnce('/mongo-db/')

var Savory = Savory || {}

/**
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Syndication = Savory.Syndication || function() {
	/** @exports Public as Savory.Syndication */
    var Public = {}

	Public.renderAtom = function(conversation) {
		if ('true' == conversation.query.get('text')) {
			conversation.mediaTypeName = 'text/plain'
		}
		else {
			conversation.mediaTypeName = 'application/atom+xml'
		}
		
		document.include('/savory/service/syndication/atom/')
	}
	
	Public.render = function(params) {
		params = params ? Sincerity.Objects.clone(params) : {}
		if (Sincerity.Objects.isString(params._object)) {
			params._content = params._object
		}
		else {
			for (var k in params._object) {
				params[k] = params._object[k]
			}
		}
		delete params._object
		return Sincerity.XML.build(params)
	}
	
	/**
	 * @class
	 * @name Savory.Syndication.Feed
	 */
	Public.Feed = Sincerity.Classes.define(function() {
		/** @exports Public as Savory.Syndication.Feed */
	    var Public = {}
	    
	    /** @ignore */
	    Public._construct = function(config) {
	    }
	    
	    Public.getInfo = function() {}

		Public.renderAtom = function(conversation) {
			conversation.mediaTypeName = 'text/plain'
			//document.include('/savory/service/syndication/atom/')

			var info = this.getInfo()
			
			var feed = {
				xmlns: 'http://www.w3.org/2005/Atom',
				_human: true,
				_tag: 'feed',
				_children: [{
					_tag: 'title',
					_content: info.title
				}, {
					_tag: 'subtitle',
					_merge: info.subtitle
				}, {
					_tag: 'link',
					rel: 'self',
					href: info.uri
				}, {
					_tag: 'link',
					href: info.webUri
				}, {
					_tag: 'author',
					_merge: info.author
				}]
			}
			
			return Sincerity.XML.build(feed)
		}
		
		return Public
	}())
	
	/**
	 * @class
	 * @name Savory.Syndication.MongoDbFeed
	 * @augments Savory.Syndication.Feed
	 */
	Public.MongoDbFeed = Sincerity.Classes.define(function(Module) {
		/** @exports Public as Savory.Syndication.MongoDbFeed */
	    var Public = {}

	    /** @ignore */
	    Public._inherit = Module.Feed

	    /** @ignore */
	    Public._construct = function(config) {
        	Sincerity.Objects.merge(this, config, ['name', 'collection'])

			this.collection = Sincerity.Objects.isString(this.collection) ? new MongoDB.Collection(this.collection) : this.collection
	    }

		Public.getInfo = function() {
			var feed = this.collection.findOne({name: this.name})
			return feed
		}
		
		return Public
	}(Public))
	
	return Public
}()
