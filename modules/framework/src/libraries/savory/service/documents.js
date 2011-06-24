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
document.executeOnce('/savory/foundation/html/markup/')
document.executeOnce('/savory/foundation/prudence/logging/')
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
	 * @returns {Savory.Logging.Logger}
	 */
	Public.logger = Savory.Logging.getLogger('documents')
	
	/**
	 * @returns {Savory.Documents.Site}
	 */
	Public.getSite = function(id) {
		var site = sitesCollection.findOne({_id: id})
		return site ? new Public.Site(site) : null
	}
	
	Public.getDocument = function(id, revision) {
		return documentsCollection.findOne({_id: id})
	}

	// No revision means fetch the active draft
	
	/**
	 * @returns {Savory.Documents.Draft}
	 */
	Public.getDraft = function(documentId, revision) {
		if (revision) {
			if (typeof revision == 'number') {
				revision = 'r' + revision
			}
			
			var fields = {name: 1, site: 1}
			fields['drafts.' + revision] = 1

			var document = documentsCollection.findOne({_id: documentId}, fields)
			var draft = document && document.drafts ? document.drafts[revision] : null
			return draft ? new Public.Draft(draft, revision, document) : null
		}
		else {
			var fields = {name: 1, activeDraft: 1, site: 1}

			var document = documentsCollection.findOne({_id: documentId}, fields)
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
		
		var document = documentsCollection.findOne({_id: documentId}, {revisions: 1})

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
	Public.Site = Savory.Classes.define(function() {
		/** @exports Public as Savory.Documents.Site */
	    var Public = {}
		
	    /** @ignore */
	    Public._construct = function(site) {
	    	this.site = site
	    }
		
	    Public.createDocument = function(source, revision, now) {
			now = now || new Date()

			if (!Savory.Objects.exists(revision)) {
				revision = this.revise(now)
			}

			if (!Savory.Objects.exists(revision)) {
				return null
			}
			
			var document = {
				_id: MongoDB.newId(),
				created: now,
				lastUpdated: now,
				site: this.site._id,
				activeDraft: {
					source: source,
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
	Public.Draft = Savory.Classes.define(function() {
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
			return this.draft.source ? this.draft.source : null
		}
		
	    Public.revise = function(source, newRevision, now) {
			now = now || new Date()
			
			if (!Objects.exists(newRevision)) {
				var site = this.getSite()
				if (site) {
					newRevision = site.revise(now)
				}
			}

			if (!Objects.exists(newRevision)) {
				// Can't revise without a revision
				return
			}
			
			var key = typeof newRevision == 'number' ? 'r' + newRevision : newRevision
			
			this.draft.source = source
			delete this.draft.rendered

			var update = {
				$set: {
					'activeDraft.source': source,
					'activeDraft.revision': newRevision,
					lastUpdated: now
				},
				$unset: {
					'activeDraft.rendered': 1
				},
				$addToSet: {
					revisions: newRevision
				}
			}
			
			update.$set['drafts.' + key + '.source'] = source
			
			documentsCollection.update({_id: this.document._id}, update)
		}
		
	    Public.render = function() {
			if (!this.draft.rendered && this.draft.source) {
				this.draft.rendered = getRenderer.call(this).render(this.draft.source)
				
				// Update our draft
				var update = {$set: {}}
				update.$set['drafts.r' + revision + '.rendered'] = this.draft.rendered
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
				this.renderer = Savory.HTML.getRenderer(this.document.language || defaultLanguage, {
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
