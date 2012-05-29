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
document.executeOnce('/sincerity/objects/')
document.executeOnce('/sincerity/jvm/')
document.executeOnce('/savory/foundation/html/')

var Savory = Savory || {}

/**
 * Rendering of HTML via Textile, Confluence, MediaWiki, Trac,
 * TWiki and Markdown markup languages, including support for extending the parsers
 * via JavaScript closures.
 *  
 * @name Savory.HTML.Markup
 * @namespace
 * @requires For Textile: org.eclipse.mylyn.wikitext.textile.jar, org.eclipse.mylyn.wikitext.core.jar;
 * @requires For Confluence: org.eclipse.mylyn.wikitext.confluence.jar, org.eclipse.mylyn.wikitext.core.jar;
 * @requires For MediaWiki: org.eclipse.mylyn.wikitext.mediawiki.jar, org.eclipse.mylyn.wikitext.core.jar;
 * @requires For Trac: org.eclipse.mylyn.wikitext.tracwiki.jar, org.eclipse.mylyn.wikitext.core.jar;
 * @requires For TWiki: org.eclipse.mylyn.wikitext.twiki.jar, org.eclipse.mylyn.wikitext.core.jar;
 * @requires For Markdown: org.pegdown.jar, org.parboiled.jar, org.parboiled.java.jar, org.objectweb.asm.jar, org.objectweb.asm.tree.jar, org.objectweb.asm.tree.analysis.jar, org.objectweb.asm.util.jar
 * @see Visit <a href="http://wiki.eclipse.org/Mylyn/Incubator/WikiText">Mylyn WikiText</a>;
 * @see Visit <a href="https://github.com/sirthias/pegdown">pegdown</a>
 * 
 * @author Tal Liron
 * @version 1.1
 */
Savory.HTML = Sincerity.Objects.merge(Savory.HTML, function() {
	/** @exports Public as Savory.HTML */
    var Public = {}

	/**
	 * Installs the library's scriptlet plugins.
	 * <p>
	 * Can only be called from Prudence configuration scripts!
	 */
	Public.routing = function() {
		scriptletPlugins.put('markup', '/savory/foundation/html/markup/scriptlet-plugin/')
	}

    /**
	 * Gets a renderer for a markup language
	 * 
	 * @param {String} name Supported renderers: 'confluence', 'mediaWiki',
	 *        'twiki', 'trac', 'textile', 'bugzillaTextile' and 'markdown'
	 * @param [configuration] See {@link Savory.HTML.Renderer#configure}
	 * @returns {Savory.HTML#Renderer} Null if not supported
	 */
	Public.getRenderer = function(name, configuration) {
		name = String(name)
		var name = shortLanguageNames[name.toLowerCase()] || name
		
		if (name == 'markdown') {
			// Use pegdown
			return new Public.Renderer(name)
		}
		else {
			// Use Mylyn
			var language = serviceLocator.getMarkupLanguage(name)
			if (language !== null) {
				var renderer = new Public.Renderer(name, language)
				if (configuration) {
					renderer.configure(configuration)
				}
				return renderer
			}
		}
	}
	
	/**
	 * A renderer converts a markup language to HTML.
	 * 
	 * @class
	 * @name Savory.HTML.Renderer
	 * 
	 * @param {String} name The markup language name
	 * @param {org.eclipse.mylyn.wikitext.core.parser.markup.MarkupLanguage} [language] The Mylyn language parser implementation
	 * 
	 * @see Savory.HTML#getRenderer
	 */
	Public.Renderer = Sincerity.Classes.define(function() {
		/** @exports Public as Savory.HTML.Renderer */
	    var Public = {}
	    
	    /** @ignore */
	    Public._construct = function(name, language) {
	    	this.name = name
	    	this.language = language
			this.parser = name == 'markdown' ? new org.pegdown.PegDownProcessor() : new org.eclipse.mylyn.wikitext.core.parser.MarkupParser(language) 
	    }
		
		/**
		 * Configures the Mylyn language parser.
		 * 
		 * @param configuration
		 * @param {Boolean} [configuration.escapingHTMLAndXml]
		 * @param {Boolean} [configuration.enableUnwrappedParagraphs]
		 * @param {Boolean} [configuration.newlinesMustCauseLineBreak]
		 * @param {Boolean} [configuration.optimizeForRepositoryUsage]
		 * @param {Boolean} [configuration.wikiWordLinking]
		 * @param [configuration.locale] See {@link Sincerity.JVM#toLocale}
		 * @param {PatternBasedElement[]} [configuration.tokenExtensions]
		 * @param {PatternBasedElement[]} [configuration.phraseModifiers]
		 * @param {Boolean} [configuration.blockExtensions] Currently unsupported
		 */
	    Public.configure = function(configuration) {
			var languageConfiguration = new org.eclipse.mylyn.wikitext.core.parser.markup.MarkupLanguageConfiguration()
			for (var c in configuration) {
				var value = configuration[c]
				switch (c) {
					case 'locale':
						languageConfiguration[c] = Sincerity.JVM.toLocale(value)
						break
					
					case 'tokenExtensions':
						var elements = Sincerity.Objects.array(value)
						var tokens = languageConfiguration.tokens
						for (e in elements) {
							tokens.add(elements[e])
						}
						break
						
					case 'phraseModifiers':
						var elements = Sincerity.Objects.array(value)
						var phraseModifiers = languageConfiguration.phraseModifiers
						for (e in elements) {
							phraseModifiers.add(elements[e])
						}
						break
						
					case 'blockExtensions':
						// TODO ?
						break
						
					default:
						languageConfiguration[c] = value
						break
				}
			}

			this.language.configure(languageConfiguration)
		}
		
		/**
		 * Renders source markup into HTML.
		 * 
		 * @param {String} source The markup source
		 * @param [complete=false] If true, renders a complete HTML page, with headers and all
		 * @returns {String} The rendered HTML
		 */
	    Public.render = function(source, complete) {
			if (this.name == 'markdown') {
				// pegdown
				source = new java.lang.String(source).toCharArray()
				return String(this.parser.markdownToHtml(source))
			}
			else {
				// Mylyn
				var writer = new java.io.StringWriter()
				var builder = new org.eclipse.mylyn.wikitext.core.parser.builder.HtmlDocumentBuilder(writer)
				this.parser.builder = builder
				this.parser.parse(source, complete ? true : false)
				var rendered = String(writer.toString())
				
				return rendered
			}
		}
		
		return Public
	}())
	
	//
	// Initialization
	//

	var serviceLocator = org.eclipse.mylyn.wikitext.core.util.ServiceLocator.instance

	var shortLanguageNames = {
		confluence: 'Confluence',
		mediaWiki: 'MediaWiki',
		twiki: 'TWiki',
		trac: 'TracWiki',
		textile: 'Textile',
		bugzillaTextile: 'Textile Bugzilla Dialect'
	}
	
	return Public
}())
