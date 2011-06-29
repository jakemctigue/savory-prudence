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

document.executeOnce('/savory/foundation/json/')
document.executeOnce('/savory/foundation/files/')
document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/localization/')
document.executeOnce('/savory/foundation/prudence/tasks/')
document.executeOnce('/savory/foundation/prudence/logging/')
document.executeOnce('/mongo-db/')

var Savory = Savory || {}

/**
 * Flexible multi-threaded export/import service for MongoDB or MongoDB-compatible data sources.
 * <p>
 * Data is exported in standard JSON (MongoDB's extended JSON notation), and optionally can be
 * gzip-compressed during the export process.
 * 
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Backup = Savory.Backup || function() {
	/** @exports Public as Savory.Backup */
    var Public = {}

	/**
	 * The library's logger.
	 *
	 * @field
	 * @returns {Savory.Logging.Logger}
	 */
	Public.logger = Savory.Logging.getLogger('backup')
	
	/**
	 * Multithreaded export of multiple MongoDB collection to files in a directory.
	 * The directory is deleted before export, to guarantee a consistent snapshot.
	 * 
	 * @param params
	 * @param {Array} [params.collections]
	 * @param {String|com.mongodb.DB} [params.db=MongoDB.defaultDb] The MongoDB database to use
	 * @param {Number} [params.threads=5] How many threads (and thus MongoDB connections) to use at once
	 * @param {Number} [params.timeout=5*60*1000] Maximum time allowed for exporting per collection in milliseconds (the default is 5 minutes)
	 * @param {String|java.io.File} params.directory The directory or its path (will be created if it doesn't exist)
	 */
	Public.exportMongoDb = function(params) {
    	params = Savory.Objects.clone(params)
    	
    	params.threads = params.threads || 5
		params.directory = (Savory.Objects.isString(params.directory) ? new java.io.File(params.directory) : params.directory).canonicalFile
		params.timeout = params.timeout || (5*60*1000)
		
		Public.logger.time('MongoDB export ({0} threads)'.cast(params.threads), function() {
			if (!Savory.Files.remove(params.directory, true)) {
				Module.logger.severe('Failed to delete output directory "{0}"', params.directory)
				return false
			}
	    	
	    	if (!params.directory.mkdirs()) {
				Public.logger.severe('Failed to create output directory "{0}"', params.directory)
				return false
	    	}

			var collections = params.collections
			if (!collections || !collections.length) {
				var db = params.db || MongoDB.defaultDb
				if (Savory.Objects.exists(db)) {
					if (Savory.Objects.isString(db)) {
						db = MongoDB.getDB(MongoDB.defaultConnection, db)
					}
					collections = Savory.JVM.fromCollection(db.collectionNames)
				}
				else {
					collections = []
				}
			}

			if (Savory.Objects.exists(params.db)) {
				params.db = String(params.db)
			}

			var futures = []
			for (var c in collections) {
				params.collection = collections[c]
				if (!Savory.Objects.isString(params.collection)) {
					params.query = params.collection.query
					params.collection = params.collection.name
				}
				
				futures.push(Savory.Tasks.task({
					fn: function(params) {
						document.executeOnce('/savory/service/backup/')
						Savory.Backup.exportMongoDbCollection(params)
					},
					context: params
				}))
				
				if (futures.length == params.threads) {
					//Public.logger.info('Waiting')
					// Wait for tasks to finish
					for (var f in futures) {
						futures[f].get(params.timeout, java.util.concurrent.TimeUnit.MILLISECONDS)
					}
					futures = []
				}
			}
			
			// Wait for tasks to finish
			for (var f in futures) {
				futures[f].get(params.timeout, java.util.concurrent.TimeUnit.MILLISECONDS)
			}
		})
    }

    /**
     * Exports a MongoDB collection to a file, optional gzip-compressing it. The file will have
     * the same name as the collection, with the '.json' extension (or '.json.gz' for gzip mode).
     * 
     * @param params
     * @param {String} params.collection The MongoDB collection name
     * @param {String|com.mongodb.DB} [params.db=MongoDB.defaultDb] The MongoDB database to use
     * @param [params.query] The MongoDB query to use (otherwise exports all documents)
     * @param {Boolean} [gzip=false] True to gzip the output
	 * @param {String|java.io.File} params.directory The base directory (or its path) in which to put the file
     */
	Public.exportMongoDbCollection = function(params) {
    	params = Savory.Objects.clone(params)

    	params.directory = (Savory.Objects.isString(params.directory) ? new java.io.File(params.directory) : params.directory).canonicalFile
		params.file = new java.io.File(params.directory, params.collection + (params.gzip ? '.json.gz' : '.json'))
    	
    	var collection = new MongoDB.Collection(params.collection, {db: params.db})
    	params.iterator = collection.find(params.query || {})
		
		Public.logger.info('Exporting MongoDB collection "{0}"', params.collection)
		
		Public.exportIterator(params)
	}

	/**
	 * @param params
	 * @param {Savory.Iterator} params.iterator The source data (must be compatible with MongoDB's extended JSON notation)
	 * @param {String|java.io.File} params.file The file or its path
	 * @param {Boolean} [params.gzip=false] True to gzip the output
	 * @param {Boolean} [params.human=false] True to output indented, human-readable JSON
	 */
    Public.exportIterator = function(params) {
    	var writer = Savory.Files.openForTextWriting(params.file, params.gzip || false)
    	var count = 0
		Public.logger.info('Exporting iterator to "{0}"', params.file)
    	try {
			writer.println('[')
    		while (params.iterator.hasNext()) {
    			var entry = params.iterator.next()
    			var text = Savory.JSON.to(entry, params.human || false)
    			if (params.iterator.hasNext()) {
    				text += ','
    			}
    			writer.println(text)
    			count++
    		}
			writer.println(']')
    	}
    	finally {
    		try {
    			params.iterator.close()
    		}
    		catch (x) {}
    		writer.close()
    		Public.logger.info('{0} documents written to "{1}"', Savory.Localization.formatNumber(count), params.file)
    	}
    }
    
    Public.importMongoDb = function(params) {
    	params = Savory.Objects.clone(params)
    	
    }

	return Public
}()
