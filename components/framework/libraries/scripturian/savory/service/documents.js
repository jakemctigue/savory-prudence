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

document.executeOnce('/sincerity/classes/')
document.executeOnce('/savory/foundation/html/markup/')
document.executeOnce('/prudence/logging/')
document.executeOnce('/mongo-db/')

var Savory = Savory || {}

/**
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Documents = Savory.Documents || function() {
	/** @exports Public as Savory.Documents */
    var Public = {}

	/**
	 * The library's logger.
	 *
	 * @field
	 * @returns {Prudence.Logging.Logger}
	 */
	Public.logger = Prudence.Logging.getLogger('documents')
	
	/**
	 * @returns {Savory.Documents.Site}
	 */
	Public.getSite = function(id) {
		var site = sitesCollection.findOne({_id: {$oid: id}})
		return site ? new Public.Site(site) : null
	}
	
	Public.getDocument = function(id, revision) {
		return documentsCollection.findOne({_id: {$oid: id}})
	}

	// No revision means fetch the active draft
	
	/**
	 * @returns {Savory.Documents.Draft}
	 */
	Public.getDraft = function(documentId, revision) {
		if (revision) {
			var key = revision
			if (typeof key == 'number') {
				key = 'r' + key
			}
			
			var fields = {name: 1, site: 1}
			fields['drafts.' + key] = 1

			var document = documentsCollection.findOne({_id: {$oid: documentId}}, fields)
			var draft = document && document.drafts ? document.drafts[key] : null
			return draft ? new Public.Draft(draft, revision, document) : null
		}
		else {
			var fields = {name: 1, activeDraft: 1, site: 1}

			var document = documentsCollection.findOne({_id: {$oid: documentId}}, fields)
			return document ? new Public.Draft(document.activeDraft || {source: ''}, document.activeDraft ? document.activeDraft.revision : null, document) : null
		}
	}
	
	/**
	 * @returns {Savory.Documents.Draft}
	 */
	Public.getLatestDraft = function(documentId, maxRevision) {
		if (!maxRevision) {
			return Public.getDraft(documentId)
		}
		
		var document = documentsCollection.findOne({_id: {$oid: documentId}}, {revisions: 1})

		var latestRevision = null
		if (document && document.revisions) {
			// Find latest revision
			for (var r in document.revisions) {
				var revision = document.revisions[r]
				if ((revision <= maxRevision) && ((latestRevision === null) || (revision > latestRevision))) {
					latestRevision = revision
				}
			}
		}

		return latestRevision ? Public.getDraft(documentId, latestRevision) : null
	}
	
	/**
	 * @class
	 * @name Savory.Documents.Site
	 * @see #getSite
	 */
	Public.Site = Sincerity.Classes.define(function() {
		/** @exports Public as Savory.Documents.Site */
	    var Public = {}
		
	    /** @ignore */
	    Public._construct = function(site) {
	    	this.site = site
	    }
		
	    Public.createDocument = function(source, language, revision, now) {
			now = now || new Date()
			language = language || defaultLanguage

			if (!Sincerity.Objects.exists(revision)) {
				revision = this.revise(now)
			}

			if (!Sincerity.Objects.exists(revision)) {
				return null
			}
			
			var document = {
				_id: MongoDB.newId(),
				created: now,
				lastUpdated: now,
				site: this.site._id,
				activeDraft: {
					source: source,
					language: language,
					revision: revision
				},
				drafts: {},
				revisions: [revision]
			}
			
			document.drafts[revision] = {
				source: source
			}
			
			documentsCollection.insert(document)
			
			return new Public.Draft(document.activeDraft, revision, document)
		}
		
	    Public.revise = function(now) {
			now = now || new Date()
			this.site = sitesCollection.findAndModify({_id: this.site._id}, {$inc: {nextRevision: 1}, $set: {lastRevised: now}})
			return this.site.nextRevision
		}
		
		return Public
	}())
	
	/**
	 * @class
	 * @name Savory.Documents.Draft
	 * @see #getDraft
	 * @see #getLatestDraft
	 */
	Public.Draft = Sincerity.Classes.define(function() {
		/** @exports Public as Savory.Documents.Draft */
	    var Public = {}
	    
	    /** @ignore */
	    Public._construct = function(draft, revision, document) {
	    	this.draft = draft
	    	this.revision = revision
	    	this.document = document
			this.site = null
			this.renderer = null
	    }
		
	    Public.getDocumentId = function() {
			return this.document._id
		}
		
	    Public.getSite = function() {
			if (!this.site) {
				this.site = Savory.Documents.getSite(this.document.site)
			}
			return this.site
		}
		
	    Public.getRevision = function() {
			return this.revision
		}
		
	    Public.getSource = function() {
			return this.draft.source || null
		}

	    Public.getLanguage = function() {
			return this.draft.language || null
		}

	    Public.revise = function(source, language, newRevision, now) {
			now = now || new Date()
			language = language || defaultLanguage
			
			if (!Sincerity.Objects.exists(newRevision)) {
				var site = this.getSite()
				if (site) {
					newRevision = site.revise(now)
				}
			}

			if (!Sincerity.Objects.exists(newRevision)) {
				// Can't revise without a revision
				return
			}
			
			this.revision = newRevision
			if (typeof this.revision != 'number') {
				this.revision = parseInt(String(this.revision = newRevision).substring(1))
			}
			
			this.draft.source = source
			this.draft.language = language
			delete this.draft.rendered

			// Set as active draft
			var update = {
				$set: {
					'activeDraft.source': this.draft.source,
					'activeDraft.language': this.draft.language,
					'activeDraft.revision': this.revision,
					lastUpdated: now
				},
				$unset: {
					'activeDraft.rendered': 1
				},
				$addToSet: {
					revisions: newRevision
				}
			}

			// Move current draft to drafts
			update.$set['drafts.r' + this.revision + '.source'] = this.draft.source
			update.$set['drafts.r' + this.revision + '.language'] = this.draft.language

			documentsCollection.update({_id: this.document._id}, update)
		}
		
	    Public.render = function() {
			if (!this.draft.rendered && this.draft.source) {
				this.draft.rendered = getRenderer.call(this).render(this.draft.source)
				
				// Update our draft
				var update = {$set: {}}
				update.$set['drafts.r' + this.revision + '.rendered'] = this.draft.rendered
				documentsCollection.update({_id: this.document._id}, update)

				// Update active draft, if we are it
				update = {$set: {'activeDraft.rendered': this.draft.rendered}}
				documentsCollection.update({_id: this.document._id, 'activeDraft.revision': this.revision}, update)
			}

			return this.draft.rendered ? this.draft.rendered : ''
		}
		
		//
		// Private
		//
		
		function getRenderer() {
			if (!this.renderer) {
				this.renderer = Savory.HTML.getRenderer(this.draft.language || defaultLanguage, {
					escapingHtmlAndXml: true,
					phraseModifiers: getReferenceReplacementToken(mapReference)
				})
				
				/* For MediaWiki:
					language.pageMapping = new org.eclipse.mylyn.internal.wikitext.mediawiki.core.PageMapping({
						mapPageNameToHref: function(pageName) {
							return mapper(pageName)
						}
					})
				 */
				
				/*var token1 = new com.threecrickets.util.wikitext.ReferenceReplacementToken(new com.threecrickets.util.wikitext.ReferenceMapping({
					mapReferenceToHref: function(pageName) {
						Public.logger.info('REFERENCE')
						return pageName + 'REFERENCE'
					}
				}))*/
			}	
			
			return this.renderer
		}
		
		function mapReference(reference) {
			return 'reference/' + reference + '/'
		}
		
		function getReferenceReplacementToken(mapper) {
			
			// TODO: is this a good idea?! are these generated classes being garbage collected?
			
			return new org.eclipse.mylyn.wikitext.core.parser.markup.PatternBasedElement({
				getPattern: function() {
					return '(?:\\[\\[(\\w+)\\]\\])'
				},
				
				getPatternGroupCount: function() {
					return 1
				},
				
				newProcessor: function() {
					return new org.eclipse.mylyn.wikitext.core.parser.markup.PatternBasedElementProcessor({
						emit: function() {
							var reference = this.group(1)
							var href = mapper(String(reference))
							var attributes = new org.eclipse.mylyn.wikitext.core.parser.Attributes(null, 'reference', null, null)
				
							this.builder.beginSpan(org.eclipse.mylyn.wikitext.core.parser.DocumentBuilder.SpanType.SUPERSCRIPT, attributes)
							this.builder.link(href, '*')
							this.builder.endSpan()
						}
					})
				}
			})
		}
		
		return Public
	}())
	
	//
	// Initialization
	//

	var documentsCollection = new MongoDB.Collection('documents')
	var sitesCollection = new MongoDB.Collection('sites')
	
	var defaultLanguage = application.globals.get('savory.service.documents.defaultLanguage') || 'textile'
	
	return Public
}()
