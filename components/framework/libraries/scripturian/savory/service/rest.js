//
// This file is part of the Savory Framework for Prudence
//
// Copyright 2011 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the LGPL version 3.0:
// http://www.gnu.org/copyleft/lesser.html
//
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.executeOnce('/prudence/resources/')
document.executeOnce('/prudence/logging/')
document.executeOnce('/sincerity/classes/')
document.executeOnce('/sincerity/xml/')
document.executeOnce('/sincerity/json/')
document.executeOnce('/sincerity/templates/')
document.executeOnce('/sincerity/iterators/')
document.executeOnce('/sincerity/jvm/')
document.executeOnce('/mongo-db/')

var Savory = Savory || {}

/**
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.REST = Savory.REST || function() {
	/** @exports Public as Savory.REST */
    var Public = {}

	/**
	 * The library's logger.
	 *
	 * @field
	 * @returns {Prudence.Logging.Logger}
	 */
	Public.logger = Prudence.Logging.getLogger('rest')

	Public.createMongoDbRoutes = function(params) {
    	params = params || {}
		var routes = {}

		params.prefix = params.prefix || ''
		params.prefix = String(params.prefix)
		if (params.prefix.endsWith('/')) {
			params.prefix = params.prefix.substring(0, params.prefix.length - 1)
		}
		params.dispatch = params.dispatch || 'javascript'

		if (!Sincerity.Objects.exists(params.db)) {
			params.db = MongoDB.defaultDb
		}
		
		if (Sincerity.Objects.isString(params.db)) {
			params.db = MongoDB.getDB(MongoDB.defaultConnection, params.db)
		}

		if (!Sincerity.Objects.exists(params.collections)) {
			params.collections = Sincerity.JVM.fromCollection(params.db.collectionNames)
		}

		for (var c in params.collections) {
			var collection = params.collections[c]

			var name
			if (Sincerity.Objects.isString(collection)) {
				name = collection = String(collection)
			}
			else {
				name = collection.collection.name
			}
			
			routes[params.prefix + '/' + name + '/{id}/'] = {type: 'implicit', id: name}
			routes[params.prefix + '/' + name + '/'] = {type: 'implicit', id: name + '.plural'}
		}
		
		return routes
    }

	/**
	 * Creates a dict of {@link Savory.REST.MongoDbResource} instances for all collections.
	 * Note that two instances are created per collection: one singular and one plural.
	 * 
	 * @param params
	 * @param {String|com.mongodb.DB} [params.db=MongoDB.defaultDb] The MongoDB database to use
	 * @param {String[]} [params.collections] The collections for which we will create instances,
	 *                    otherwise queries the database for a list of all collections
	 * @returns {Object} A dict of resources
	 */
	Public.createMongoDbResources = function(params) {
    	params = params || {}
		var resources = {}

		if (!Sincerity.Objects.exists(params.db)) {
			params.db = MongoDB.defaultDb
		}
		
		if (Sincerity.Objects.isString(params.db)) {
			params.db = MongoDB.getDB(MongoDB.defaultConnection, params.db)
		}

		if (!Sincerity.Objects.exists(params.collections)) {
			params.collections = Sincerity.JVM.fromCollection(params.db.collectionNames)
		}

		for (var c in params.collections) {
			var collection = params.collections[c]

			var name
			if (Sincerity.Objects.isString(collection)) {
				name = collection = String(collection)
			}
			else {
				name = collection.collection.name
			}
			
			resources[name] = new Public.MongoDbResource({name: name, collection: collection})
			resources[name + '.plural'] = new Public.MongoDbResource({name: name, collection: collection, plural: true})
		}
		
		return resources
    }
	
	/**
	 * A few useful filters.
	 * 
	 * @namespace
	 */
	Public.Filters = {
		primitivize: function(doc) {
			if (Sincerity.Objects.isObject(doc)) {
				if (Sincerity.Objects.isDate(doc)) {
					return doc.getTime()
				}
				
				for (var k in doc) {
					doc[k] = Public.Filters.primitivize(doc[k])
				}
				return doc
			}
			else {
				return String(doc)
			}
		},
		
		stringify: function(doc) {
			if (Sincerity.Objects.isObject(doc)) {
				if (Sincerity.Objects.isDate(doc)) {
					return String(doc.getTime())
				}
				
				for (var k in doc) {
					doc[k] = Public.Filters.stringify(doc[k])
				}
				return doc
			}
			else {
				return String(doc)
			}
		}
	}

	/**
	 * A RESTful resource.
	 * 
	 * @class
	 * @name Savory.REST.Resource
	 */
	Public.Resource = Sincerity.Classes.define(function() {
		/** @exports Public as Savory.REST.Resource */
	    var Public = {}
	    
	    /** @ignore */
	    Public._configure = ['allowPost', 'allowPut', 'allowDelete']
	    
	    /** @ignore */
	    Public._construct = function(config) {
        	this.allowPost = Sincerity.Objects.ensure(this.allowPost, true)
			this.allowPut = Sincerity.Objects.ensure(this.allowPut, true)
			this.allowDelete = Sincerity.Objects.ensure(this.allowDelete, true)
	    }

	    Public.handleInit = function(conversation) {
	    	if (Sincerity.Objects.exists(this.mediaTypes)) {
	    		for (var m in this.mediaTypes) {
	    			var mediaType = this.mediaTypes[m]
	    			if (Sincerity.Objects.isString(mediaType)) {
	    				conversation.addMediaTypeByName(mediaType)
	    			}
	    			else {
	    				conversation.addMediaType(mediaType)
	    			}
	    		}
	    	}
	    	else {
	    		// TODO: default to something?
	    	}
	    }
	    
	    Public.handleGet = function(conversation) {
			return Prudence.Resources.Status.ServerError.NotImplemented
	    }
	    
	    Public.handleGetInfo = function(conversation) {
			return Prudence.Resources.Status.ServerError.NotImplemented
	    }
	    
		Public.handlePost = function(conversation) {
			return Prudence.Resources.Status.ServerError.NotImplemented
		}
		
		Public.handlePut = function(conversation) {
			return Prudence.Resources.Status.ServerError.NotImplemented
		}
		
		Public.handleDelete = function(conversation) {
			return Prudence.Resources.Status.ServerError.NotImplemented
		}
		
		return Public
	}())
	
	/**
	 * A RESTful resource for a MongoDB document or collection.
	 * Supports representation in JSON, XML, plain JavaScript (for
	 * internal requests) and human-friendly HTML representation
	 * that can be opened in a web browser.
	 * <p>
	 * The instance can be constructed in 'plural mode', which means
	 * that a GET will return an array of documents, a DELETE
	 * would drop the entire collection, and PUT and POST support
	 * arrays of documents in addition to also supporting a single
	 * document (as in non-plural mode).
	 * 
	 * @class
	 * @name Savory.REST.MongoDbResource
	 * @augments Savory.REST.Resource
	 * 
	 * @param {Object|String} config
	 * @param {String} [config.name]
	 * @param {Boolean} [config.plural=false] If true the RESTful resource will work in plural mode
	 * @param {MongoDB.Collection|String} [config.collection=config.name] The MongoDB collection or
	 *         its name
	 * @param {String|String[]} [config.fields] The document fields to retrieve
	 *         (see {@link MongoDB#find})
	 * @param [config.values] TODO
	 * @param [config.extract] TODO
	 * @param [config.filters] TODO
	 */
	Public.MongoDbResource = Sincerity.Classes.define(function(Module) {
		/** @exports Public as Savory.REST.MongoDbResource */
	    var Public = {}

	    /** @ignore */
	    Public._inherit = Module.Resource

	    /** @ignore */
	    Public._configure = ['name', 'plural', 'collection', 'fields', 'values', 'extract', 'filters', 'allowPost', 'allowPut', 'allowDelete']

	    /** @ignore */
	    Public._construct = function(config) {
	    	if (Sincerity.Objects.isString(config)) {
				this.name = String(config)
			}
			
			this.collection = this.collection || this.name
			this.collection = Sincerity.Objects.isString(this.collection) ? new MongoDB.Collection(this.collection) : this.collection

			// Convert fields to MongoDB's inclusion notation
			var fields = {}
			if (Sincerity.Objects.exists(this.fields)) {
				this.fields = Sincerity.Objects.array(this.fields)
				for (var f in this.fields) {
					fields[this.fields[f]] = 1
				}
			}
			this.fields = fields
			
			if (Sincerity.Objects.exists(this.extract)) {
				this.extract = Sincerity.Objects.array(this.extract)
			}
			
			Savory.REST.MongoDbResource.prototype.superclass.call(this, this)
	    }
	    
	    Public.mediaTypes = [
			'application/json',
			'application/xml',
			'application/java',
			'text/plain',
			'text/html'
		]

	    Public.handleGet = function(conversation) {
			var query = getQuery(conversation)

			// TODO: reconsider this, do we need this support built in here?
			/*
			if (query.mode == 'extjs') {
				// should only work on plural?
				delete query.mode
				var options = {
					resource: {
						uri: conversation.locals.get('savory.service.rest.uri'),
						query: query,
						internal: true
					}
				}
				if (this.extJs) {
					if (this.extJs.fields) {
						options.fields = this.extJs.fields
					}
					if (this.extJs.columns) {
						options.columns = this.extJs.columns
					}
				} 
				var source = new Savory.Sencha.ResourceWrapper(options)
				return source.handleGet(conversation)
			}
			*/
			
			if (query.format) {
				// Force a format
				switch (query.format) {
					case 'xml':
						conversation.mediaTypeName = 'application/xml'
						break
					case 'html':
						conversation.mediaTypeName = 'text/html'
						break
					case 'json':
						conversation.mediaTypeName = 'application/json'
						break
				}
			}

			var iterator, total
			if (this.plural) {
				var q = this.query ? castQuery(conversation, Sincerity.Objects.clone(this.query), this.values) : {}
				iterator = this.collection.find(q, this.fields)
				total = iterator.count()
				
				if (!total) {
					iterator.close()
					return Prudence.Resources.Status.ClientError.NotFound
				}

				if (query.limit === 0) {
					iterator.close()
					iterator = null
				}
				else {
					if (query.start) {
						iterator.skip(query.start)
					}
					if (query.limit) {
						iterator.limit(query.limit)
					}
				}
			}
			else {
				var q = castQuery(conversation, this.query ? Sincerity.Objects.clone(this.query) : {_id: {$oid: '{id}'}}, this.values)
				var doc = this.collection.findOne(q, this.fields)
				if (doc) {
					iterator = new Sincerity.Iterators.Array([doc])
				}
				else {
					return Prudence.Resources.Status.ClientError.NotFound
				}
			}
			
			return representIterator.call(this, conversation, query, iterator, total)
		}
		
	    /*Public.handleGetInfo = function(conversation) {
			// TODO:
		}*/
		
	    Public.handlePost = function(conversation) {
			// TODO: must it be JSON?
			
			var updates = Prudence.Resources.getEntity(conversation, 'extendedJson')
			if (!updates) {
				return Prudence.Resources.Status.ClientError.BadRequest
			}

			var query = getQuery(conversation)
			
			if (Sincerity.Objects.isArray(updates)) {
				if (!this.plural) {
					// Only plural resources can accept arrays
					return Prudence.Resources.Status.ClientError.BadRequest
				}
			}
			else {
				updates = Sincerity.Objects.array(updates)
			}
			
			var docs = []
			for (var u in updates) {
				var update = updates[u]
				if (!Sincerity.Objects.exists(conversation.locals.get('id')) && Sincerity.Objects.exists(update._id)) {
					conversation.locals.put('id', String(update._id))
				}
				delete update._id
				var q = castQuery(conversation, this.query ? Sincerity.Objects.clone(this.query) : {_id: {$oid: '{id}'}}, this.values)
				var doc = this.collection.findAndModify(q, {$set: update}, Sincerity.Objects.isEmpty(this.fields) ? {returnNew: true} : {returnNew: true, fields: this.fields})
				if (Sincerity.Objects.exists(doc)) {
					docs.push(doc)
				}
			}

			return representIterator.call(this, conversation, query, new Sincerity.Iterators.Array(docs))
		}
		
	    Public.handlePut = function(conversation) {
			var docs = Prudence.Resources.getEntity(conversation, 'extendedJson')
			if (!docs) {
				return Prudence.Resources.Status.ClientError.BadRequest
			}

			var query = getQuery(conversation)
			
			if (!this.plural && Sincerity.Objects.isArray(docs)) {
				// Only plural resources can accept arrays
				return Prudence.Resources.Status.ClientError.BadRequest
			}
			
			var duplicates = false
			var newDocs = []
			if (this.plural) {
				docs = Sincerity.Objects.array(docs)
				for (var d in docs) {
					var doc = docs[d]
					try {
						var result = this.collection.insert(doc, 1)
						if (result && result.ok) {
							newDocs.push(doc)
						}
					}
					catch (x) {
						if (x.code == MongoDB.Error.DuplicateKey) {
							duplicates = true
						}
					}
				}
			}
			else {
				var doc = docs
				delete doc._id
				Sincerity.Objects.merge(doc, castQuery(conversation, this.query ? Sincerity.Objects.clone(this.query) : {_id: {$oid: '{id}'}}, this.values))
				var result = this.collection.save(doc, 1)
				if (result && (result.n == 1)) {
					newDocs.push(doc)
				}
			}

			conversation.statusCode = duplicates ? Prudence.Resources.Status.ClientError.Conflict : Prudence.Resources.Status.Success.Created
			return representIterator.call(this, conversation, query, new Sincerity.Iterators.Array(newDocs))
		}
		
	    Public.handleDelete = function(conversation) {
			var q
			if (this.plural) {
				q = {}
			}
			else {
				q = castQuery(conversation, this.query ? Sincerity.Objects.clone(this.query) : {_id: {$oid: '{id}'}}, this.values)
			}
			
			var result = this.collection.remove(q, 1)
			if (result) {
				if (result.ok == 0) {
					return Prudence.Resources.ServerError.Internal
				}
				if (result.n == 0) {
					return Prudence.Resources.Status.ClientError.NotFound
				}
			}

			return Prudence.Resources.Status.Success.NoContent
		}
		
		//
		// Private
		//
		
		function getQuery(conversation) {
			var query = Prudence.Resources.getQuery(conversation, {
				human: 'bool',
				format: 'string',
				filter: 'string[]',
				mode: 'string', // ??
				start: 'int',
				limit: 'int'
			})
			query.limit = query.limit || minLimit
			query.filter = getFilters.call(this, query.filter)
			return query
		}

		function getFilters(names) {
			var filters = []
			for (var n in names) {
				var name = names[n].toLowerCase()
				var filter = this.filters ? this.filters[name] : null
				if (!filter) {
					filter = Public.Filters[name]
				}
				if (filter) {
					filters.push(filter)
				}
			}
			return filters
		}
		
		function representIterator(conversation, query, iterator, total) {
			if (iterator) {
				iterator = new Sincerity.Iterators.Transformer(iterator, function(doc) {
					return extract(doc, this)
				}, this.extract)
				for (var f in query.filter) {
					iterator = new Sincerity.Iterators.Transformer(iterator, query.filter[f])
				}
			}
				
			if (this.plural) {
				var docs = iterator ? Sincerity.Iterators.toArray(iterator) : []
				return represent.call(this, conversation, query, total ? {total: total, documents: docs} : {documents: docs}, '/savory/service/rest/plural/')
			}
			else {
				if (!iterator.hasNext()) {
					iterator.close()
					return Prudence.Resources.Status.ClientError.NotFound // this shouldn't happen, really
				}
				var doc = iterator.next()
				iterator.close()
				return represent.call(this, conversation, query, doc, '/savory/service/rest/singular/')
			}
		}

		function represent(conversation, query, value, htmlUri) {
			switch (String(conversation.mediaTypeName)) {
				case 'application/java':
					return value

				case 'application/xml':
					var xml = Sincerity.XML.to({documents: value})
					if (query.human && xml) {
						xml = Sincerity.XML.humanize(xml)
					}
					return xml || ''
				
				case 'text/html':
					document.passThroughDocuments.add(htmlUri)
					var html = Prudence.Resources.generateHtml(htmlUri, {
						resource: this,
						value: value,
						query: conversation.query,
						pathToBase: conversation.pathToBase
					})
					return html || '<html><body>Could not represent as HTML</body></html>'
			}
			
			return Sincerity.JSON.to(value, query.human || false)
		}

		function castQuery(conversation, obj, values) {
			if (Sincerity.Objects.isObject(obj, true)) {
				for (var k in obj) {
					var value = obj[k]
					if (Sincerity.Objects.isString(value)) {
						obj[k] = String(value).cast(conversation.locals)
						if (values) {
							obj[k] = String(value).cast(values)
						}
					}
					else {
						castQuery(conversation, value, values)
					}
				}
			}
			return obj
		}

		function extract(doc, commands) {
			if (!doc || !commands || !commands.length) {
				return doc
			}
			
			commands = Sincerity.Objects.clone(commands)
			var e = commands.shift()
			return extract(doc[e], commands)
		}

		return Public
	}(Public))

	//
	// Initialization
	//

	var minLimit = application.globals.get('savory.service.rest.minLimit') || 100

    return Public
}()
