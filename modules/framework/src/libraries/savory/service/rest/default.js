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
document.executeOnce('/savory/foundation/xml/')
document.executeOnce('/savory/foundation/json/')
document.executeOnce('/savory/foundation/templates/')
document.executeOnce('/savory/foundation/iterators/')
document.executeOnce('/savory/foundation/jvm/')
document.executeOnce('/savory/foundation/prudence/lazy/')
document.executeOnce('/savory/foundation/prudence/resources/')
document.executeOnce('/savory/foundation/prudence/logging/')
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
	 * @returns {Savory.Logging.Logger}
	 */
	Public.logger = Savory.Logging.getLogger('rest')

	/**
	 * Installs the library's pass-throughs.
	 * <p>
	 * Can only be called from Prudence configuration scripts!
	 */
	Public.settings = function() {
		resourcesPassThrough.push('/savory/service/rest/resource/')
		dynamicWebPassThrough.push('/savory/service/rest/singular/')
		dynamicWebPassThrough.push('/savory/service/rest/plural/')
	}
	
	/**
	 * Installs the library's captures according the 'savory.service.rest.routes'
	 * predefined global.
	 * <p>
	 * Can only be called from Prudence configuration scripts!
	 */
	Public.routing = function() {
		var routes = predefinedGlobals['savory.service.rest.routes'] || {}
		
		var capture = new com.threecrickets.prudence.util.CapturingRedirector(router.context, 'riap://application/savory/service/rest/resource/?{rq}', false)
		for (var uri in routes) {
			var injector = new com.threecrickets.prudence.util.Injector(router.context, capture)
			injector.values.put('savory.service.rest.uri', uri)
			router.attach(uri, injector)
		}

		router.hide('/savory/service/rest/resource/')
	}
	
	Public.lazyConfigsForMongoDbCollection = function(baseUri, name, plural) {
		/*if (!Savory.Objects.exists(name)) {
			if (plural.endsWith('es')) {
				name = plural.substring(0, plural.length - 2)
			}
			else if (plural.endsWith('s')) {
				name = plural.substring(0, plural.length - 1)
			}
			else {
				name = plural
			}
		}*/
		name = name || plural
		plural = plural || name
		var configs = {}
		configs[baseUri + name + '/{id}/'] = {
			dependencies: '/savory/service/rest/',
			name: 'Savory.REST.MongoDbResource',
			config: {
				name: name,
				collection: plural
			}
		}
		configs[baseUri + plural + '/'] = {
			dependencies: '/savory/service/rest/',
			name: 'Savory.REST.MongoDbResource',
			config: {
				name: name,
				collection: plural,
				plural: plural
			}
		}
		return configs
	}
	
	Public.lazyConfigsForMongoDbCollections = function(baseUri, collections) {
		baseUri = baseUri || 'data'
		var configs = {}
		if (!collections || !collections.length) {
			if (MongoDB.defaultDb) {
				collections = Savory.JVM.fromCollection(MongoDB.defaultDb.collectionNames)
			}
			else {
				collections = []
			}
		}
		for (var c in collections) {
			var collection = collections[c]
			if (Savory.Objects.isString(collection)) {
				collection = String(collection)
				collection = {plural: collection}
			}
			Savory.Objects.merge(configs, Public.lazyConfigsForMongoDbCollection(baseUri, collection.name, collection.plural))
		}
		return configs
	}

	/**
	 * @returns {Savory.Lazy.Map}
	 */
	Public.getRoutes = function() {
		return Savory.Lazy.getGlobalMap('savory.service.rest.routes', Public.logger)
	}
	
	/**
	 * @param conversation The Prudence conversation
	 * @param {Function} [createFn] An optional function that receives a stringified
	 *        version of the resource constructor and returns a created instance; at
	 *        its simplest, it should be: function(constructor) { return eval(constructor)() }
	 *        (see {@link Savory.Lazy.Map#get}) 
	 */
	Public.getResource = function(conversation, createFn) {
		var uri = conversation.locals.get('savory.service.rest.uri')
		return Public.getRoutes().get(uri, createFn || function(constructor) {
			return eval(constructor)()
		})
	}
	
	/**
	 * A few useful filters.
	 * 
	 * @namespace
	 */
	Public.Filters = {
		primitivize: function(doc) {
			if (Savory.Objects.isObject(doc)) {
				if (Savory.Objects.isDate(doc)) {
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
			if (Savory.Objects.isObject(doc)) {
				if (Savory.Objects.isDate(doc)) {
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
	Public.Resource = Savory.Classes.define(function() {
		/** @exports Public as Savory.REST.Resource */
	    var Public = {}

	    Public.handleInit = function(conversation) {
	    	if (this.mediaTypes) {
	    		for (var m in this.mediaTypes) {
	    			var mediaType = this.mediaTypes[m]
	    			if (Savory.Objects.isString(mediaType)) {
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
			return Savory.Resources.Status.ServerError.NotImplemented
	    }
	    
	    Public.handleGetInfo = function(conversation) {
			return Savory.Resources.Status.ServerError.NotImplemented
	    }
	    
		Public.handlePost = function(conversation) {
			return Savory.Resources.Status.ServerError.NotImplemented
		}
		
		Public.handlePut = function(conversation) {
			return Savory.Resources.Status.ServerError.NotImplemented
		}
		
		Public.handleDelete = function(conversation) {
			return Savory.Resources.Status.ServerError.NotImplemented
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
	 * @param {String} config.name
	 * @param {Boolean|String} [config.plural=false] If true, becomes config.name+'s',
	 *        otherwise can be an explicit plural form; in any case, if this param is
	 *        not false, the RESTful resource will work in plural mode
	 * @param {MongoDB.Collection|String} [config.collection=config.plural||config.name+'s'] The MongoDB collection or
	 *        its name
	 * @param {String|String[]} [config.fields] The document fields to retrieve
	 *        (see {@link MongoDB#find})
	 */
	Public.MongoDbResource = Savory.Classes.define(function(Module) {
		/** @exports Public as Savory.REST.MongoDbResource */
	    var Public = {}

	    /** @ignore */
	    Public._inherit = Module.Resource

	    /** @ignore */
	    Public._construct = function(config) {
	    	if (Savory.Objects.isString(config)) {
				this.name = String(config)
			}
	    	else {
	        	Savory.Objects.merge(this, config, ['name', 'plural', 'collection', 'fields', 'values', 'extract', 'filters', 'handlePost', 'handlePut', 'handleDelete'])
	    	}
			
			if (this.plural) {
				if (!Savory.Objects.isString(this.plural)) {
					this.plural = this.name + 's'
				}
			}
			this.collection = this.collection || this.plural || this.name + 's'
			this.collection = Savory.Objects.isString(this.collection) ? new MongoDB.Collection(this.collection) : this.collection

			// Convert fields this.config to MongoDB's inclusion notation
			this.fields = Savory.Objects.array(this.fields)
			var fields = {}
			for (var f in this.fields) {
				fields[this.fields[f]] = 1
			}
			this.fields = fields
			
			if (this.extract) {
				this.extract = Savory.Objects.array(this.extract)
			}
			
			this.handlePost = Savory.Objects.ensure(this.handlePost, true)
			this.handlePut = Savory.Objects.ensure(this.handlePut, true)
			this.handleDelete = Savory.Objects.ensure(this.handleDelete, true)
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
				var q = this.query ? castQuery(conversation, Savory.Objects.clone(this.query), this.values) : {}
				iterator = this.collection.find(q, this.fields)
				total = iterator.count()
				
				if (!total) {
					iterator.close()
					return Savory.Resources.Status.ClientError.NotFound
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
				var q = castQuery(conversation, this.query ? Savory.Objects.clone(this.query) : {_id: {$oid: '{id}'}}, this.values)
				var doc = this.collection.findOne(q, this.fields)
				if (doc) {
					iterator = new Savory.Iterators.Array([doc])
				}
				else {
					return Savory.Resources.Status.ClientError.NotFound
				}
			}
			
			return representIterator.call(this, conversation, query, iterator, total)
		}
		
	    Public.handleGetInfo = function(conversation) {
			// TODO:
		}
		
	    Public.handlePost = function(conversation) {
			if (!this.handlePost) {
				return Savory.Resources.Status.ServerError.NotImplemented
			}
			
			// TODO: must it be JSON?
			
			var updates = Savory.Resources.getEntity(conversation, 'extendedJson')
			if (!updates) {
				return Savory.Resources.Status.ClientError.BadRequest
			}

			var query = getQuery(conversation)
			
			if (Savory.Objects.isArray(updates)) {
				if (!this.plural) {
					// Only plural resources can accept arrays
					return Savory.Resources.Status.ClientError.BadRequest
				}
			}
			else {
				updates = Savory.Objects.array(updates)
			}
			
			var docs = []
			for (var u in updates) {
				var update = updates[u]
				if (!Savory.Objects.exists(conversation.locals.get('id')) && Savory.Objects.exists(update._id)) {
					conversation.locals.put('id', String(update._id))
				}
				delete update._id
				var q = castQuery(conversation, this.query ? Savory.Objects.clone(this.query) : {_id: {$oid: '{id}'}}, this.values)
				var doc = this.collection.findAndModify(q, {$set: update}, Savory.Objects.isEmpty(this.fields) ? {returnNew: true} : {returnNew: true, fields: this.fields})
				if (doc) {
					docs.push(doc)
				}
			}

			return representIterator.call(this, conversation, query, new Savory.Iterators.Array(docs))
		}
		
	    Public.handlePut = function(conversation) {
			if (!this.handlePut) {
				return Savory.Resources.Status.ServerError.NotImplemented
			}

			var docs = Savory.Resources.getEntity(conversation, 'extendedJson')
			if (!docs) {
				return Savory.Resources.Status.ClientError.BadRequest
			}

			var query = getQuery(conversation)
			
			if (Savory.Objects.isArray(docs)) {
				if (!this.plural) {
					// Only plural resources can accept arrays
					return Savory.Resources.Status.ClientError.BadRequest
				}
			}
			else {
				docs = Savory.Objects.array(docs)
			}
			
			var duplicates = false
			var newDocs = []
			for (var d in docs) {
				var doc = docs[d]
				try {
					var result = this.collection.insert(doc, 1)
					if (result && (result.n == 1)) {
						newDocs.push(doc)
					}
				}
				catch (x) {
					if (x.code == MongoDB.Error.DuplicateKey) {
						duplicates = true
					}
				}
			}

			conversation.statusCode = duplicates ? Savory.Resources.Status.ClientError.Conflict : Savory.Resources.Status.Success.Created
			return representIterator.call(this, conversation, query, new Savory.Iterators.Array(docs))
		}
		
	    Public.handleDelete = function(conversation) {
			if (!this.handleDelete) {
				return Savory.Resources.Status.ServerError.NotImplemented
			}

			var q
			if (this.plural) {
				q = {}
			}
			else {
				q = castQuery(conversation, this.query ? Savory.Objects.clone(this.query) : {_id: {$oid: '{id}'}}, this.values)
			}
			
			var result = this.collection.remove(q, 1)
			if (result) {
				if (result.ok == 0) {
					return Savory.Resources.ServerError.Internal
				}
				if (result.n == 0) {
					return Savory.Resources.Status.ClientError.NotFound
				}
			}

			return Savory.Resources.Status.Success.NoContent
		}
		
		//
		// Private
		//
		
		function getQuery(conversation) {
			var query = Savory.Resources.getQuery(conversation, {
				human: 'bool',
				format: 'string',
				filter: 'string[]',
				mode: 'string',
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
				iterator = new Savory.Iterators.Transformer(iterator, function(doc) {
					return extract(doc, this)
				}, this.extract)
				for (var f in query.filter) {
					iterator = new Savory.Iterators.Transformer(iterator, query.filter[f])
				}
			}
				
			if (this.plural) {
				var docs = iterator ? Savory.Iterators.toArray(iterator) : []
				return represent(conversation, query, total ? {total: total, documents: docs} : {documents: docs}, '/savory/service/rest/plural/')
			}
			else {
				if (!iterator.hasNext()) {
					return Savory.Resources.Status.ClientError.NotFound // this shouldn't happen, really
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
					var xml = Savory.XML.to({documents: value})
					if (query.human && xml) {
						xml = Savory.XML.humanize(xml)
					}
					return xml || ''
				
				case 'text/html':
					var html = Savory.Resources.generateHtml(htmlUri, {
						resource: this,
						value: value,
						query: conversation.query,
						pathToBase: conversation.pathToBase
					})
					return html || '<html>Could not represent as HTML</html>'
			}
			
			return Savory.JSON.to(value, query.human || false)
		}

		function castQuery(conversation, obj, values) {
			if (Savory.Objects.isObject(obj, true)) {
				for (var k in obj) {
					var value = obj[k]
					if (Savory.Objects.isString(value)) {
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
			
			commands = Savory.Objects.clone(commands)
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
