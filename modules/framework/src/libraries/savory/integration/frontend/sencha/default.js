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

document.executeOnce('/savory/service/rest/')
document.executeOnce('/savory/foundation/classes/')
document.executeOnce('/savory/foundation/templates/')
document.executeOnce('/savory/foundation/json/')
document.executeOnce('/savory/foundation/jvm/')
document.executeOnce('/savory/foundation/xml/')
document.executeOnce('/savory/foundation/iterators/')
document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/prudence/resources/')
document.executeOnce('/mongo-db/')

var Savory = Savory || {}

/**
 * Integration with Sencha's Ext JS client framework. Extensible
 * server-side implementations for Ext.data.Store and Ext.tree.TreeLoader,
 * with MongoDB integration.
 * <p>
 * See front-end companion utilities:
 *   /web/static/script/ext/savory/sencha.js
 * 
 * @namespace
 * @see Visit <a href="http://www.sencha.com/products/extjs/">Ext JS</a>
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Sencha = Savory.Sencha || function() {
	/** @exports Public as Savory.Sencha */
    var Public = {}
    
	/**
	 * Installs the library's pass-throughs.
	 * <p>
	 * Can only be called from Prudence configuration scripts!
	 */
	Public.settings = function() {
		resourcesPassThrough.push('/savory/integration/frontend/sencha/direct/')
	}
    
	/**
	 * Generates HTML head entries (JavaScript and CSS) for using Ext JS.
	 * 
	 * @param conversation The Prudence conversation
	 * @param [params]
	 * @param [params.theme='blue'] The initial Ext JS theme to use
	 * @param [params.indent='\t'] The indentations to print in front of every line
	 * @param [params.debug=The 'debug' query parameter] Whether to use the debug version of Ext JS
	 * @param [params.pathToBase=conversation.pathToBase] Used to create URIs for the Ext JS resources
	 * @returns {String} The head text
	 */
	Public.extJsHead = function(conversation, params) {
		params = params ? Savory.Objects.clone(params) : {}

		params.debug = params.debug || (conversation.query.get('debug') == 'true')
		params.indent = params.indent || '\t'
		params.theme = params.theme || application.globals.get('savory.integration.frontend.sencha.defaultTheme')
		params.theme = Savory.Objects.exists(params.theme) ? '-' + params.theme : ''
		params.pathToBase = params.pathToBase || conversation.pathToBase

		return (params.debug ? extJsDebugHead : extJsHead).cast({
			base: params.pathToBase,
			theme: params.theme,
			indent: params.indent,
			scriptPath: extJsScriptPath,
			stylePath: extJsStylePath
		})
	}
	
	/**
	 * Generates HTML head entries (JavaScript and CSS) for using Sencha Touch.
	 * 
	 * @param conversation The Prudence conversation
	 * @param [params]
	 * @param [params.indent='\t'] The indentations to print in front of every line
	 * @param [params.debug=The 'debug' query parameter] Whether to use the debug version of Sencha Touch
	 * @param [params.pathToBase=conversation.pathToBase] Used to create URIs for the Sencha Touch resources
	 * @returns {String} The head text
	 */
	Public.senchaTouchHead = function(conversation, params) {
		params = params ? Savory.Objects.clone(params) : {}

		params.debug = params.debug || (conversation.query.get('debug') == 'true')
		params.indent = params.indent || '\t'
		params.pathToBase = params.pathToBase || conversation.pathToBase
		
		return (params.debug ? senchaTouchDebugHead : senchaTouchHead).cast({
			base: params.pathToBase,
			indent: params.indent,
			scriptPath: senchaTouchScriptPath,
			stylePath: senchaTouchStylePath
		})
	}
	
	/**
	 * Generates an Ext JS 'fields' array based on a sample record and property ID.
	 * 
	 * @param record A sample record
	 * @param {String} idProperty The name of the id property
	 */
	Public.guessStoreFields = function(record, idProperty) {
		var fields = [idProperty]
		for (var r in record) {
			if (r == idProperty) {
				continue
			}
			
			var field = record[r]
			if (Savory.Objects.isDate(field)) {
				fields.push({
					name: r,
					type: 'date'
				})
			}
			else {
				fields.push(r)
			}
		}
		return fields
	}
	
	Public.generateRecordIds = function(records, idProperty) {
		var id = 1
		for (var r in records) {
			records[r][idProperty] = id++
		}
	}
	
	/**
	 * A resource instance is the service-side partner of a client-side Ext JS
	 * Store instance.
	 * <p>
	 * Of course, it can operate as a fully REST-like resource without
	 * using Ext JS, because the Ext JS protocol for stores is quite usable.
	 * Just note that it has a unique representation protocol, and that it
	 * does not use standard HTTP status codes to indicate processing errors:
	 * request failure would still return an HTTP OK, but the success field
	 * in the representation would be false. This may make it an inefficient
	 * implementation for truly RESTful applications.
	 * 
	 * @class
	 * @name Savory.Sencha.Resource
	 * @augments Savory.REST.Resource
	 * 
	 * @param config
	 * @param {String} [config.rootProperty='records']
	 * @param {String} [config.totalProperty='total']
	 * @param {String} [config.idProperty='id']
	 */
	Public.Resource = Savory.Classes.define(function() {
		/** @exports Public as Savory.Sencha.Resource */
		var Public = {}

		/** @ignore */
		Public._inherit = Savory.REST.Resource
		
		/** @ignore */
		Public._construct = function(config) {
			Savory.Objects.merge(this, config, ['fields', 'columns', 'rootProperty', 'idProperty', 'totalProperty', 'allowPost', 'allowPut', 'allowDelete'])

			this.rootProperty = this.rootProperty || 'records'
			this.idProperty = this.idProperty || 'id'
			this.totalProperty = this.totalProperty || 'total'
			
			Savory.Sencha.Resource.prototype.superclass.call(this, this)
		}
		
	    Public.mediaTypes = [
			'application/json',
			'application/java',
			'text/plain'
 		]
		
		/**
		 * @param conversation The Prudence conversation
		 */
		Public.handleGet = function(conversation) {
			var query = Savory.Resources.getQuery(conversation, {
				human: 'bool',
				start: 'int',
				limit: 'int',
				columns: 'bool',
				meta: 'bool'
			})
			
			//Savory.REST.logger.dump(query)
			
			if (query.columns) {
				// "Get columns" mode
				return Savory.JSON.to(this.getColumns(), query.human || false)
			}
			
			var result = {}
			result.success = true
			result[this.totalProperty] = this.getTotal()
			result[this.rootProperty] = Savory.Iterators.toArray(new Savory.Iterators.Transformer(new Savory.Iterators.Buffer(this.getRecords(query.start, query.limit), 100), guaranteeId, this), 0, query.limit)
	
			// TODO error messages?
	
			if (query.meta) {
				// Meta data is used to initialize the client store
				result.metaData = {
					root: this.rootProperty,
					totalProperty: this.totalProperty,
					idProperty: this.idProperty,
					fields: this.fields
				}
			}
			
			var timestamp = getModificationTimestamp.call(this)
			if (timestamp) {
				conversation.modificationTimestamp = timestamp					
			}
			
			if (conversation.mediaTypeName == 'application/java') {
				return result
			}
			else {
				return Savory.JSON.to(result, query.human || false)
			}
		}
		
		Public.handleGetInfo = function(conversation) {
			var timestamp = getModificationTimestamp.call(this)
			if (timestamp) {
				return timestamp
			}
			return null
		}
		
		Public.handlePut = function(conversation) {
			var query = Savory.Resources.getQuery(conversation, {
				human: 'bool'
			})
			
			var entity = Savory.Resources.getEntity(conversation, 'extendedJson')
			entity = this.setRecord(entity, true)
			
			var result
			if (entity) {
				result = {
					success: true,
					message: 'Woohoo! Added!'
				}
				result[this.rootProperty] = [entity]
				conversation.statusCode = Savory.Resources.Status.Success.Created
			}
			else {
				result = {
					success: false,
					message: 'Could not add!'
				}
			}
	
			var timestamp = getModificationTimestamp.call(this)
			if (timestamp) {
				conversation.modificationTimestamp = timestamp					
			}
	
			if (conversation.mediaTypeName == 'application/java') {
				return result
			}
			else {
				return Savory.JSON.to(result, query.human || false)
			}
		}
		
		Public.handlePost = function(conversation) {
			var query = Savory.Resources.getQuery(conversation, {
				human: 'bool'
			})
			
			var entity = Savory.Resources.getEntity(conversation, 'extendedJson')
			entity = this.setRecord(entity, false)
	
			var result
			if (entity) {
				result = {
					success: true,
					message: 'Woohoo! Updated!'
				}
				result[this.rootProperty] = [entity]
			}
			else {
				result = {
					success: false,
					message: 'Could not update!'
				}
			}
	
			if (conversation.mediaTypeName == 'application/java') {
				return result
			}
			else {
				return Savory.JSON.to(result, query.human || false)
			}
		}
		
		Public.handleDelete = function(conversation) {
			var id = conversation.locals.get(this.idProperty)
			if (!Savory.Objects.exists(id)) {
				return Savory.Resources.Status.ClientError.NotFound
			}
			
			var query = Savory.Resources.getQuery(conversation, {
				human: 'bool'
			})
			
			var result
			if (this.deleteRecord(id)) {
				result = {
					success: true,
					message: 'Woohoo! Deleted!'
				}
			}
			else {
				result = {
					success: false,
					message: 'Could not delete!'
				}
			}
	
			if (conversation.mediaTypeName == 'application/java') {
				return result
			}
			else {
				return Savory.JSON.to(result, query.human || false)
			}
		}
		
		Public.getColumns = function() {
			var columns = []
			
			if (this.fields) {
				for (var f in this.fields) {
					var field = this.fields[f]
					var name = field.name || field
					if (name != this.idProperty) {
						columns.push({
							dataIndex: name,
							header: (field.header || name).escapeElements()
						})
					}
				}
			}
	
			if (this.columns) {
				for (var c in columns) {
					var column = columns[c]
					var o = this.columns[column.dataIndex]
					if (o) {
						Savory.Objects.merge(column, o)
					}
				}
			}
	
			return columns
		}
		
		//
		// Private
		//
		
		/**
		 * Ext JS does not know how to deal with entries that do not have IDs, so we will make sure
		 * that all do
		 */
		function guaranteeId(record) {
			if (!record[this.idProperty]) {
				record[this.idProperty] = String(new MongoDB.newId())
			}
			return record
		}

		function getModificationTimestamp() {
			if (this.getDate) {
				var date = this.getDate()
				if (date) {
					return date.getTime()
				}
			}
			return null
		}
		
		return Public
	}())
	
	/**
	 * @class
	 * @name Savory.Sencha.SelfContainedResource
	 * @augments Savory.Sencha.Resource
	 * 
	 * @param config
	 * @param config.data
	 */
	Public.SelfContainedResource = Savory.Classes.define(function(Module) {
		/** @exports Public as Savory.Sencha.SelfContainedResource */
		var Public = {}

		/** @ignore */
		Public._inherit = Module.Resource

		/** @ignore */
		Public._construct = function(config) {
			Savory.Objects.merge(this, config, ['fields', 'columns', 'rootProperty', 'idProperty', 'totalProperty', 'allowPost', 'allowPut', 'allowDelete'])

			this.idProperty = this.idProperty || 'id'
			this.list = Savory.JVM.toList(config.data, true)
			
			if (!this.fields) {
				var record = config.data[0]
				this.fields = Module.guessStoreFields(record, this.idProperty)
				if (record[this.idProperty] === undefined) {
					Module.generateRecordIds(this.data, this.idProperty)
				}
			}
			
			this.modificationTimestamp = new Date()
			
			Savory.Sencha.SelfContainedResource.prototype.superclass.call(this, this)
		}
	
		Public.getTotal = function() {
			return this.list.size()
		}
		
		Public.getDate = function() {
			return this.modificationTimestamp
		}
		
		Public.getRecords = function(start, limit) {
			var iterator = new Savory.Iterators.JVM(this.list.iterator())
			iterator.skip(start)
			return iterator
		}
		
		Public.setRecord = function(record, add) {
			this.modificationTimestamp = new Date()
			
			if (add) {
				this.list.add(record)
				return record
			}
			
			var found
			for (var i = this.list.iterator(); i.hasNext(); ) {
				var potentialRecord = i.next()
				if (potentialRecord[this.idProperty] == record[this.idProperty]) {
					found = potentialRecord
					break
				}
			}
			
			if (!found) {
				return null
			}
			
			Savory.Objects.merge(found, record)
			return record
		}
		
		Public.deleteRecord = function(id) {
			this.modificationTimestamp = new Date()
			
			for (var i = this.list.iterator(); i.hasNext(); ) {
				var record = i.next()
				if (record[this.idProperty] == id) {
					return this.list.remove(record)
				}
			}
			return false
		}
		
		return Public
	}(Public))
	
	/**
	 * @class
	 * @name Savory.Sencha.MongoDbResource
	 * @augments Savory.Sencha.Resource
	 * 
	 * @param config
	 * @param {MongoDB.Collection|String} this.config.collection
	 * @param {String} [config.idProperty='_id']
	 * @param {Boolean} [config.isObjectId=true] Whether the idProperty is a MongoDB ObjectID
	 */
	Public.MongoDbResource = Savory.Classes.define(function(Module) {
		/** @exports Public as Savory.Sencha.MongoDbResource */
		var Public = {}

		/** @ignore */
		Public._inherit = Module.Resource

		/** @ignore */
		Public._construct = function(config) {
			Savory.Objects.merge(this, config, ['collection', 'query', 'isObjectId', 'fields', 'columns', 'rootProperty', 'idProperty', 'totalProperty', 'allowPost', 'allowPut', 'allowDelete'])
			
			this.idProperty = this.idProperty || '_id'
			this.isObjectId = Savory.Objects.ensure(this.isObjectId, true)
			this.collection = Savory.Objects.isString(this.collection) ? new MongoDB.Collection(this.collection) : this.collection
			
			// Convert fields to MongoDB fields notations
			this.mongoDbFields = {}
			var hasIdField = false
			for (var f in this.fields) {
				var field = this.fields[f]
				var name = field.name || field
				this.mongoDbFields[name] = 1
				if (!hasIdField && (name == this.idProperty)) {
					hasIdField = true
				}
			}
			if (!hasIdField) {
				this.mongoDbFields[this.idProperty] = 1
				this.fields.push(this.idProperty)
			}
			
			Savory.Sencha.MongoDbResource.prototype.superclass.call(this, this)
		}

		Public.getTotal = function() {
			return this.collection.count(this.query)
		}
		
		Public.getDate = function() {
			// TODO
		}
		
		Public.getRecords = function(start, limit) {
			var cursor = this.collection.find(this.query, this.mongoDbFields)
			if (start) {
				cursor.skip(start)
			}
			if (Savory.Objects.exists(limit)) {
				cursor.limit(limit)
			}
			return this.isObjectId ? new Savory.Iterators.Transformer(cursor, toExtJs, this) : cursor
		}
		
		Public.setRecord = function(record, add) {
			if (this.isObjectId) {
				record = fromExtJs.call(this, record)
			}
	
			if (add) {
				if (this.isObjectId) {
					record[this.idProperty] = MongoDB.newId()
				}
				try {
					this.collection.insert(record, 1)
				}
				catch (x) {
					if (x.code == MongoDB.Error.DuplicateKey) {
						return null
					}
				}
			}
			else {
				if (record[this.idProperty]) {
					var query = {}
					query[this.idProperty] = record[this.idProperty]
					delete record[this.idProperty]
					record = this.collection.findAndModify(query, {$set: record}, {returnNew: true, fields: this.mongoDbFields})
				}
			}
	
			if (this.isObjectId && record) {
				record = toExtJs.call(this, record)
			}
			return record
		}
		
		Public.deleteRecord = function(id) {
			var query = {}
			query[this.idProperty] = id
			var result = this.collection.remove(query, 1)
			return result && (result.n == 1)
		}
		
		return Public
	}(Public))
	
	/**
	 * @class
	 * @name Savory.Sencha.ResourceWrapper
	 * @augments Savory.Sencha.Resource
	 * 
	 * @param config
	 * @param {String|Object} config.resource Basic config for {@link Savory.Resources#request}
	 * @param {String} [config.payloadType='json']
	 * @param {String} [config.idProperty='_id']
	 * @param {Boolean} [config.isObjectId=true] Whether the idProperty is a MongoDB ObjectID
	 * @param {String} [config.documentsProperty='documents']
	 * @param {String} [config.totalProperty='total']
	 * @param {String} [config.startAttribute='start']
	 * @param {String} [config.limitAttribute='limit']
	 */
	Public.ResourceWrapper = Savory.Classes.define(function(Module) {
		/** @exports Public as Savory.Sencha.ResourceWrapper */
		var Public = {}

		/** @ignore */
		Public._inherit = Module.Resource

		/** @ignore */
		Public._construct = function(config) {
			Savory.Objects.merge(this, config, ['resource', 'payloadType', 'startAttribute', 'limitAttribute', 'isObjectId', 'fields', 'columns', 'rootProperty', 'idProperty', 'totalProperty', 'allowPost', 'allowPut', 'allowDelete'])
			
			this.isObjectId = Savory.Objects.ensure(this.isObjectId, true)
			if (Savory.Objects.isString(this.resource)) {
				this.resource = {uri: String(this.resource), mediaType: 'application/json'}
			}
			this.payloadType = this.payloadType || 'json'
			this.idProperty = this.idProperty || '_id'
			this.documentsProperty = this.documentsProperty || 'documents'
			this.totalProperty = this.totalProperty || 'total'
			this.startAttribute = this.startAttribute || 'start'
			this.limitAttribute = this.limitAttribute || 'limit'
	
			this.fields = this.fields || []
			var hasIdField = false
			for (var f in this.fields) {
				var field = this.fields[f]
				var name = field.name || field
				if (name == this.idProperty) {
					hasIdField = true
					break
				}
			}
			if (!hasIdField) {
				this.fields.push(this.idProperty)
			}
			
			Savory.Sencha.ResourceWrapper.prototype.superclass.call(this, this)
		}

		Public.getTotal = function() {
			var request = Savory.Objects.clone(this.resource)
			request.query = request.query || {}
			request.query[this.limitAttribute] = 0
			var obj = Savory.Resources.request(request)
			return obj[this.totalProperty]
		}
			
		Public.getDate = function() {
			// TODO
		}
				
		Public.getRecords = function(start, limit) {
			var request = Savory.Objects.clone(this.resource)
			request.query = request.query || {}
			request.query[this.startAttribute] = start
			request.query[this.limitAttribute] = limit
			var obj = Savory.Resources.request(request)
			var iterator = new Savory.Iterators.Array(obj[this.documentsProperty])
			iterator.skip(start)
			return this.isObjectId ? new Savory.Iterators.Transformer(iterator, toExtJs, this) : iterator
		}
		
		Public.setRecord = function(record, add) {
			record = Savory.Objects.clone(record)
			Savory.Objects.prune(record)
			if (this.isObjectId) {
				record = fromExtJs.call(this, record)
			}
	
			var request = Savory.Objects.clone(this.resource)
			request.method = add ? 'put' : 'post'
			request.payload = {
				value: record,
				type: this.payloadType
			}
			
			var record = Savory.Resources.request(request)
			//Savory.Logging.getLogger().dump(record, 'obj1')
			if (record) {
				if (record[this.documentsProperty] && record[this.documentsProperty].length) {
					record = record[this.documentsProperty][0]
				}
				else {
					record = null
				}
			}
			
			if (this.isObjectId && record) {
				record = toExtJs.call(this, record)
			}
			return record
		}
		
		Public.deleteRecord = function(id) {
			var request = Savory.Objects.clone(this.resource)
			request.method = 'delete'
			Savory.Resources.request(request)
			return true
		}
		
		return Public
	}(Public))
	
	/**
	 * @class
	 * @name Savory.Sencha.TreeResource
	 * @augments Savory.REST.Resource
	 */
	Public.TreeResource = Savory.Classes.define(function() {
		/** @exports Public as Savory.Sencha.TreeResource */
		var Public = {}

		/** @ignore */
		Public._inherit = Savory.REST.Resource
		
		/** @ignore */
		Public._construct = function(config) {
			Savory.Objects.merge(this, config, ['allowPost', 'allowPut', 'allowDelete'])
			Savory.Sencha.TreeResource.prototype.superclass.call(this, this)
		}

		Public.getChildren = function() {}

		Public.handleGet = function(conversation) {
			var query = Savory.Resources.getQuery(conversation, {
				node: 'string',
				human: 'bool'
			})
			
			var node = this.getChildren(query.node)
			
			return Savory.JSON.to(node, query.human || false)
		}
		
		return Public
	}())

	/**
	 * @class
	 * @name Savory.Sencha.SelfContainedTreeResource
	 * @augments Savory.Sencha.TreeResource
	 */
	Public.SelfContainedTreeResource = Savory.Classes.define(function(Module) {
		/** @exports Public as Savory.Sencha.SelfContainedTreeResource */
		var Public = {}

		/** @ignore */
		Public._inherit = Module.TreeResource

		/** @ignore */
		Public._construct = function(config) {
			Savory.Objects.merge(this, config, ['rootName', 'nodePrefix', 'allowPost', 'allowPut', 'allowDelete'])

			this.rootName = this.rootName || 'root'
			this.nodePrefix = this.nodePrefix || '_n'
			this.nodes = {}
			this.lastId = 0
			
			addNode.call(this, this.rootName, Savory.Objects.clone(config.root))
			
			Savory.Sencha.SelfContainedTreeResource.prototype.superclass.call(this, this)
		}
		
		Public.getChildren = function(name) {
			var nodes = []
			
			var node = this.nodes[name]
			if (node && node.children) {
				for (var c in node.children) {
					var id = node.children[c]
					var child = this.nodes[id]
					nodes.push({
						id: id,
						text: Savory.XML.escapeElements(child.text)
					})
				}
			}
			
			return nodes
		}
		
		//
		// Private
		//
		
		function addNode(id, node, parentId) {
			if (Savory.Objects.isString(node)) {
				node = {
					text: String(node)
				}
			}
			else {
				var array
				if (Savory.Objects.isArray(node)) {
					array = node
					node = {}
				}
				else if (Savory.Objects.isArray(node.children)) {
					array = node.children
				}
				
				if (array) {
					var children = []
					for (var c in array) {
						var childId = this.nodePrefix + (this.lastId++)
						children.push(childId)
						var child = array[c]
						addNode.call(this, childId, child, id)
					}
					node.children = children
				}
				else if (node.children) {
					var children = []
					for (var c in node.children) {
						children.push(c)
						var child = node.children[c]
						addNode.call(this, c, child, id)
					}
					node.children = children
				}
			}
			
			if (parentId) {
				node.parent = parentId
			}
			
			this.nodes[id] = node
		}
		
		return Public
	}(Public))

	/**
	 * @class
	 * @name Savory.Sencha.MongoDbTreeResource
	 * @augments Savory.Sencha.TreeResource
	 */
	Public.MongoDbTreeResource = Savory.Classes.define(function(Module) {
		/** @exports Public as Savory.Sencha.MongoDbTreeResource */
		var Public = {}

		/** @ignore */
		Public._inherit = Module.TreeResource

		/** @ignore */
		Public._construct = function(config) {
			Savory.Objects.merge(this, config, ['collection', 'separator', 'rootName', 'query', 'field', 'getNodeText', 'allowPost', 'allowPut', 'allowDelete'])

			this.collection = Savory.Objects.isString(this.collection) ? new MongoDB.Collection(this.collection) : this.collection
			this.separator = this.separator || '/'
			this.rootName = this.rootName || this.separator
			
			Savory.Sencha.MongoDbTreeResource.prototype.superclass.call(this, this)
		}
	
		Public.getNode = function(id) {
			var query
			if (id == this.rootName) {
				query = this.query
			}
			else {
				id = id.split(this.separator)
				id = id[id.length - 1]
				query = {_id: MongoDB.id(id)}
			}
			
			var fields = {}
			fields[this.field] = 1
			var node = this.collection.findOne(query, fields)
			return node ? node[this.field] : null
		}
		
		Public.getNodeText = function(id, node) {
			return id
		}
		
		Public.getChildren = function(id) {
			node = this.getNode(id)
			
			var children = []
			
			if (node) {
				if (id == this.separator) {
					id = ''
				}
				for (var c in node) {
					addNode.call(this, id + this.separator + c, c, node[c], children)
				}
			}
			
			return children
		}
		
		function addNode(id, nodeId, node, array) {
			if (Savory.JVM.instanceOf(node, com.mongodb.DBRef)) {
				array.push({
					id: id + this.separator + String(node.id),
					text: Savory.XML.escapeElements(this.getNodeText(nodeId, null))
				})
				return
			}
			
			var n = {
				id: id,
				text: Savory.XML.escapeElements(this.getNodeText(nodeId, node)),
				expanded: true
			}
			array.push(n)

			if (Savory.Objects.isObject(node)) {
				n.children = []
				for (var c in node) {
					addNode.call(this, id + this.separator + c, c, node[c], n.children)
				}
			}
			else {
				n.leaf = true
			}
		}

		return Public
	}(Public))
    
    //
    // Private
    //
	
	function toExtJs(record) {
		// Ext JS uses strict identity for record IDs, so we need to use a string
		record[this.idProperty] = String(record[this.idProperty])
		return record
	}

	function fromExtJs(record) {
		// Ext JS uses strict identity for record IDs, so we used a string there
		if (record[this.idProperty]) {
			record[this.idProperty] = {$oid: record[this.idProperty]}
		}
		return record
	}

	//
    // Initialization
    //
	
	var extJsScriptPath = 'script/ext'
	var extJsStylePath = 'style/ext/style'

	var senchaTouchScriptPath = 'script/sencha-touch'
	var senchaTouchStylePath = 'style/sencha-touch/style'

	var extJsHead = '' +
		'<!-- Ext JS -->\n' +
		'{indent}<link rel="stylesheet" type="text/css" href="{base}/{stylePath}/css/ext-all{theme}.css" id="ext-theme" />\n' +
		'{indent}<script type="text/javascript" src="{base}/{scriptPath}/ext-all.js"></script>\n\n' +
		'{indent}<!-- Savory Extensions -->\n' +
		'{indent}<script type="text/javascript" src="{base}/script/savory/integration/ext-js.js"></script>'
	
	var extJsDebugHead = '' +
		'<!-- Ext JS Debug -->\n' +
		'{indent}<link rel="stylesheet" type="text/css" href="{base}/{stylePath}/css/ext-all{theme}.css" id="ext-theme" />\n' +
		'{indent}<script type="text/javascript" src="{base}/{scriptPath}/ext-debug.js"></script>\n\n' +
		'{indent}<!-- Savory Extensions -->\n' +
		'{indent}<script type="text/javascript" src="{base}/script/savory/integration/ext-js.js"></script>'

	var senchaTouchHead = '' +
		'<!-- Sencha Touch -->\n' +
		'{indent}<link rel="stylesheet" type="text/css" href="{base}/{stylePath}/sencha-touch.css" id="ext-theme" />\n' +
		'{indent}<script type="text/javascript" src="{base}/{scriptPath}/sencha-touch.js"></script>\n\n' +
		'{indent}<!-- Savory Extensions -->\n' +
		'{indent}<script type="text/javascript" src="{base}/script/savory/integration/sencha-touch.js"></script>'

	var senchaTouchDebugHead = '' +
		'<!-- Sencha Touch Debug -->\n' +
		'{indent}<link rel="stylesheet" type="text/css" href="{base}/{stylePath}/sencha-touch.css" id="ext-theme" />\n' +
		'{indent}<script type="text/javascript" src="{base}/{scriptPath}/sencha-touch-debug-w-comments.js"></script>\n\n' +
		'{indent}<!-- Savory Extensions -->\n' +
		'{indent}<script type="text/javascript" src="{base}/script/savory/integration/sencha-touch.js"></script>'

	return Public
}()
