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
document.executeOnce('/savory/foundation/jvm/')

var Savory = Savory || {}

/**
 * JavaScript-friendly wrapper over Lucene.
 * 
 * @namespace
 * @requires org.apache.lucene.jar
 * @see Visit <a href="http://lucene.apache.org/">Lucene</a>
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Lucene = Savory.Lucene || function() {
	/** @exports Public as Savory.Lucene */
    var Public = {}

	/**
	 * Converts a JavaScript value into a Lucene textual field.
	 * 
	 * @param {String} name The field name
	 * @param {Object} o The explicit field value (will be converted into a string) or a dict
	 * @param [o.value] The field value (will be converted into a string)
	 * @param {Boolean|String} [o.store=true] Whether to store the field in the directory (can also be string values 'yes' or 'no') 
	 * @param {Boolean|String} [o.index=true] Whether and how to index the field (can also be string values 'analyzed',
	 *        'analyzedNoNorms', 'no', 'notAnalyzed' or 'notAnalyzedNoNorms')
	 * @returns {org.apache.lucene.document.Field}
	 */
	Public.createField = function(name, o) {
		if (Savory.Objects.isDict(o, true)) {
			var store = (typeof o.store == 'boolean' ? (o.store ? fieldStore.yes : fieldStore.no) : fieldStore[o.store]) || fieldStore.yes
			var index = (typeof o.index == 'boolean' ? (o.index ? fieldIndex.analyzed : fieldIndex.no) : fieldIndex[o.index]) || fieldIndex.analyzed
			return new org.apache.lucene.document.Field(name, String(o.value), store, index)
		}
		else {
			return new org.apache.lucene.document.Field(name, String(o), fieldStore.yes, fieldIndex.analyzed)
		}
	}
	
	/**
	 * Converts a JavaScript dict into a Lucene document.
	 * <p>
	 * Note that Lucene documents are flat, with no hierarchical depth.
	 * You may want to call {@link Savory.Objects#flatten} first for more complex
	 * data structures.
	 * 
	 * @param o A flat dict
	 * @returns {org.apache.lucene.document.Document}
	 * @see #createField
	 */
	Public.createDocument = function(o) {
	    var doc = new org.apache.lucene.document.Document()
	    for (var k in o) {
	    	var field = Public.createField(k, o[k])
	    	doc.add(field)
	    }
	    return doc
	}
	
	/**
	 * Converts a Lucene document into a JavaScript dict.
	 * 
	 * @param {org.apache.lucene.document.Document} doc The Lucene document
	 * @returns {Object} A dict
	 */
	Public.fromDocument = function(doc) {
		var o = {}
		for (var i = doc.fields.iterator(); i.hasNext(); ) {
			var field = i.next()
			var name = field.name()
			o[name] = doc.get(name)
		}
		return o
	}
	
	/**
	 * @class
	 * @param {String|java.io.File} file The file or path for the directory; will be created if it doesn't
	 *        exist; leave empty to use an in-process memory directory
	 */
	Public.Directory = Savory.Classes.define(function(Module) {
		/** @exports Public as Savory.Lucene.Directory */
	    var Public = {}
	    
	    /** @ignore */
	    Public._construct = function(file) {
			this.file = Savory.Objects.isString(file) ? new java.io.File(file) : file
			this.directory = Savory.Objects.exists(this.file) ? org.apache.lucene.store.FSDirectory.open(this.file) : new org.apache.lucene.store.RAMDirectory()
	    }

	    Public.close = function() {
	    	this.directory.close()
		}

	    Public.createWriter = function(config) {
			var indexWriterConfig = new org.apache.lucene.index.IndexWriterConfig(version, analyzer)
			for (var k in config) {
				var value = config[k]
				if (k == 'openMode') {
					value = writerOpenMode[value]
				}
				indexWriterConfig[k] = value
			}
			return new org.apache.lucene.index.IndexWriter(this.directory, indexWriterConfig)
		}
		
	    Public.createSearcher = function() {
			var searcher = new org.apache.lucene.search.IndexSearcher(this.directory, true)
			return searcher
		}
		
	    Public.index = function(iterator, writerConfig) {
			if (Savory.Objects.isArray(iterator)) {
				iterator = new Savory.Iterators.Array(iterator)
			}
			var writer = this.createWriter(writerConfig)
			try {
				try {
					while (iterator.hasNext()) {
						var doc = Savory.Lucene.createDocument(iterator.next())
						writer.addDocument(doc)
					}
				}
				finally {
					iterator.close()
				}
			}
			finally {
				writer.close()
			}
		}
		
		/**
		 * @param {String} query The Lucene query
		 * @param [params]
		 * @param {Number} [params.count=100] The maximum number of top documents to return
		 * @param {String} [params.defaultField] The default query field
		 * @param {String} [params.previewField] If present generates a short HTML preview of this field with
		 *        search terms highlighted in the fragments in which they appear
		 * @param {String} [params.preview='preview'] The new field in which to store the preview
		 * @param {Number} [params.fragmentLength=100] The maximum length of a preview fragment
		 * @param {Number} [params.maxFragments=5] The maximum number of fragments to include in the preview
		 * @param {String} [params.fragmentsSeparator='&amp;hellip;'] The HTML code to appear between preview fragments
		 * @param {String} [params.termPrefix='&lt;strong&gt'] The HTML code to appear before highlighted terms
		 * @param {String} [params.termPostfix='&lt;/strong&gt'] The HTML code to appear after highlighted terms
		 */
	    Public.search = function(query, params) {
			var parser = new org.apache.lucene.queryParser.QueryParser(version, params.defaultField || null, analyzer)
			//application.logger.info(query)
			query = parser.parse(query)

			var scorer, formatter, highlighter
			if (params.previewField) {
				scorer = new org.apache.lucene.search.highlight.QueryScorer(query)
				formatter = new org.apache.lucene.search.highlight.SimpleHTMLFormatter(params.termPrefix || '<strong>', params.termPostfix || '</strong>')
				highlighter = new org.apache.lucene.search.highlight.Highlighter(formatter, scorer)
				highlighter.textFragmenter.fragmentSize = params.fragmentLength || 100
			}

			var searcher = this.createSearcher()
			try {
				var hits = searcher.search(query, null, params.count || 100).scoreDocs
				var docs = []
				for (var h in hits) {
					var id = hits[h].doc
					var doc = searcher.doc(id)
					var o = Module.fromDocument(doc)
					
					if (params.previewField) {
						try {
							var tokens = org.apache.lucene.search.highlight.TokenSources.getAnyTokenStream(searcher.indexReader, id, params.previewField, analyzer)
							o[params.preview || 'preview'] = highlighter.getBestFragments(tokens, o[params.previewField], params.maxFragments || 5, params.fragmentsSeparator || '&hellip;')
						}
						catch (x if x.javaException instanceof java.lang.IllegalArgumentException) {
							// Field can't be analyzed; it's probably not stored in the document
						}
					}

					docs.push(o)
				}
				return docs
			}
			finally {
				searcher.close()
			}
		}
		
		return Public
	}(Public))
    
    //
    // Private
    //
    
    var version = org.apache.lucene.util.Version.LUCENE_31
	
    var fieldStore = {
    	yes: org.apache.lucene.document.Field.Store.YES,
    	no: org.apache.lucene.document.Field.Store.NO
    }
    
    var fieldIndex = {
    	analyzed: org.apache.lucene.document.Field.Index.ANALYZED,
    	analyzedNoNorms: org.apache.lucene.document.Field.Index.ANALYZED_NO_NORMS,
    	no: org.apache.lucene.document.Field.Index.NO,
    	notAnalyzed: org.apache.lucene.document.Field.Index.NOT_ANALYZED,
    	notAnalyzedNoNorms: org.apache.lucene.document.Field.Index.NOT_ANALYZED_NO_NORMS
    }
    
    var writerOpenMode = {
    	append: org.apache.lucene.index.IndexWriterConfig.OpenMode.APPEND,
    	create: org.apache.lucene.index.IndexWriterConfig.OpenMode.CREATE,
    	createOrAppend: org.apache.lucene.index.IndexWriterConfig.OpenMode.CREATE_OR_APPEND
    }
    
	//
	// Construction
	//

    var analyzer = new org.apache.lucene.analysis.standard.StandardAnalyzer(version)

	return Public	
}()
