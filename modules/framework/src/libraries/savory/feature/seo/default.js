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
document.executeOnce('/savory/foundation/iterators/')
document.executeOnce('/savory/foundation/files/')
document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/xml/')
document.executeOnce('/savory/foundation/prudence/lazy/')
document.executeOnce('/savory/foundation/prudence/logging/')
document.executeOnce('/savory/foundation/prudence/tasks/')
document.executeOnce('/savory/foundation/prudence/resources/')

var Savory = Savory || {}

/**
 * The SEO feature allows for sophisticated, robust support for the robots.txt and
 * sitemap.xml standards, including very large sitemaps. The feature also supports separate
 * sitemaps for multiple domains, so you can easily host multiple domains with sitemaps
 * on a single Prudence instance.
 * <p>
 * The features works by letting you set up providers which supply the feature with
 * iterators of URLs per domain, as well as domains, which will be the consumers of
 * these providers.  * Each provider is responsible for a single 'URL set' (part of
 * the sitemap spec). See 'Configuration' below for details on how to configure
 * providers and domains.
 * 
 * <h1>Static vs. Dynamic</h1>
 * Sitemap generation is supported in two modes: dynamic, in which the whole page is
 * generated at once upon demand (with allowance for Prudence's caching) or static, in
 * which sitemap files are generated asynchronously to be served by a static web server
 * (which could be your application's /web/static/ subdirectory).
 * <p>
 * Static mode is recommended for very large sitemaps. You can set up your Prudence
 * crontab to have it run once or multiple times per day. Results of the generation
 * process, including errors and timing, will be found in your prudence.log.
 * <p>
 * Static mode makes sure to keep files within the size limits required by search
 * engines, compresses all the data in gzip (per the spec), and also carefully uses
 * a spooling directory for generated files, so that the whole sitemap can be replaced
 * at once.
 * 
 * <h1>Root vs. Non-Root Applications</h1>
 * There can be only one root application per domain, but there still may be many
 * other applications installed and running in the Prudence instance. Thus, when you use
 * the SEO feature you need to make sure you have one and only one application for which
 * you call {@link Savory.SEO#routing} with isRoot=true.
 * <p>
 * The root application will make sure to query URL sets from all other configured
 * applications for the relevant domain in the instance. It accomplishes this via a
 * Prudence document.internal call.
 * 
 * <h1>Installation</h1>
 * To install this feature, you will need to call {@link Savory.SEO#settings} in your application's
 * settings.js and {@link Savory.SEO#routing} from your routing.js.
 * For static sitemap generation, you should also call {@link Savory.SEO#registerExtensions} in
 * your default.js.
 * 
 * <h1>Configuration</h1>
 * Set the following application globals:
 * <ul>
 * <li><em>savory.feature.seo.providers:</em> an array of provider instances or functions that generate
 * provider instances (see {@link Savory.Lazy}); see {@link Savory.SEO.Provider.Explicit} for an example provider
 * implementation</li>
 * <li><em>savory.feature.seo.domains:</em> an array of configs uses to instantiate
 * {@link Savory.SEO.Domain} instances</li>
 * </ul>
 * 
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 * @see Visit the <a href="http://www.robotstxt.org/robotstxt.html">robots.txt</a> spec;
 * @see Visit the <a href="http://sitemaps.org/protocol.php">sitemap.xml</a> spec
 */
Savory.SEO = Savory.SEO || function() {
	/** @exports Public as Savory.SEO */
    var Public = {}
    
	/**
	 * The library's logger.
	 *
	 * @field
	 * @returns {Savory.Logging.Logger}
	 */
	Public.logger = Savory.Logging.getLogger('seo')

	/**
	 * @namespace
	 */
	Public.Provider = {}
	
	/**
	 * Fetches the location providers configured in the 'savory.feature.seo.providers' application global.
	 * 
	 * @returns {Object} A dict of location providers by name
	 * @see Savory.Lazy#Map
	 */
    Public.getProviders = function() {
		return Savory.Lazy.getGlobalMap('savory.feature.seo.providers', Public.logger, function(constructor) {
			return eval(constructor)()
		})
	}

	/**
	 * Registers the '.gz' extension (not available by default in Restlet).
	 * <p>
	 * Can only be called from Prudence configuration scripts!
	 */
    Public.registerExtensions = function() {
		applicationInstance.metadataService.addExtension('gz', org.restlet.data.MediaType.APPLICATION_GNU_ZIP)
	}
	
	/**
	 * Installs the library's pass-throughs.
	 * <p>
	 * Can only be called from Prudence configuration scripts!
	 */
    Public.settings = function() {
		resourcesPassThrough.push('/savory/feature/seo/robots/')
		resourcesPassThrough.push('/savory/feature/seo/sets/')
		resourcesPassThrough.push('/savory/feature/seo/locations/')
		dynamicWebPassThrough.push('/savory/feature/seo/robots/')
		dynamicWebPassThrough.push('/savory/feature/seo/sitemap/')
	}

	/**
	 * Installs the library's captures and filters.
	 * <p>
	 * Can only be called from Prudence configuration scripts!
	 * 
	 * @param {Boolean} [isRoot=false] True to install root application captures
	 * @param {String} [app] For root applications, allows hosting resources on another
	 *        application
	 */
	Public.routing = function(isRoot, app) {
		if (isRoot) {
			if (app) {
				// Robots
				router.captureOtherAndHide('/robots.txt', app, '/savory/feature/seo/robots/')

				// Dynamic site map
				router.captureOther('/sitemap.xml', app, '/savory/feature/seo/sitemap/')
				router.captureOtherAndHide('/sitemap-{sitemap}.xml', app, '/savory/feature/seo/sitemap/')
				
				// Static site map
				router.captureOther('/sitemap.xml.gz', app, '/sitemap.xml.gz')
				router.captureOther('/sitemap-{sitemap}.xml.gz', '/sitemap-{sitemap}.xml.gz')
			}
			else {
				// Robots
				router.captureAndHide('/robots.txt', '/savory/feature/seo/robots/')

				// Dynamic site map
				router.capture('/sitemap.xml', '/savory/feature/seo/sitemap/')
				router.captureAndHide('/sitemap-{sitemap}.xml', '/savory/feature/seo/sitemap/')

				// Static site map
				var filter = new com.threecrickets.prudence.DelegatedFilter(applicationInstance.context, '/savory/feature/seo/sitemap-filter/')
				filter.next = staticWeb
				router.attach('/sitemap.xml.gz', filter)
				router.attach('/sitemap-{sitemap}.xml.gz', filter)
			}
		}
		else {
			router.hide('/savory/feature/seo/sitemap/')
			router.hide('/savory/feature/seo/robots/')
		}
	}
	
	/**
	 * The domain instance for a conversation.
	 * <p>
	 * Note that this works slightly differently for internal requests, which use special
	 * internal URIs instead of internet URLs.
	 * 
	 * @param conversation The Prudence conversation
	 * @returns {Savory.SEO.Domain}
	 */
	Public.getCurrentDomain = function(conversation) {
		if (conversation.internal) {
			return Public.getDomain(conversation.query.get('domain'))
		}
		else {
			return Public.getDomain(conversation.reference.hostIdentifier)
		}
	}
	
	/**
	 * The domain instance by its root URI, for example: 'http://mysite.org/'
	 * 
	 * @param {String} rootUri The root URI of the domain
	 * @returns {Savory.SEO.Domain} Null if not found
	 */
	Public.getDomain = function(rootUri) {
		for (var d in domains) {
			var domain = domains[d]
			var domainRootUri = domain.getRootUri()
			if (!domainRootUri || (domainRootUri == rootUri)) {
				return domain
			}
		}
		return null
	}
	
	/**
	 * An array of all supported domain instances.
	 * 
	 * @returns {Savory.SEO.Domain[]}
	 */
	Public.getDomains = function() {
		return domains
	}
	
	/**
	 * Domain instances are the main engine for the SEO feature, and provide the ability to
	 * generate robots.txt and sitemap.xml in their various modes.
	 * <p>
	 * The class relies on the providers available in {@link Savory.SEO#getProviders}.
	 * 
	 * @class
	 * @name Savory.SEO.Domain
	 * @param config
	 * @param {String} config.rootUri The root URI of this domain, for example: 'http://mysite.org/'
	 * @param {String} [config.userAgent='*'] The user agent string for robots.txt
	 * @param {Boolean} [config.dynamic=true] Whether to use dynamic mode for sitemap generation
	 * @param {Number} [config.delaySeconds=100] The number of seconds search engines should allow between hits (for robots.txt) 
	 * @param {String[]} [config.applications] For root applications, these are the names of applications would should be
	 *        aggregated into our sitemap
	 * @param {String} [config.staticPath] The directory in which to put the statically generated sitemap files
	 * @param {String} [config.staticRelativePath] The directory in which to put the statically generated sitemap files, relative to
	 *        this application's /web/static/ subdirectory
	 * @param {String} [config.workPath] The temporary directory in which to put the statically generated sitemap files before moving
	 *        them to their final location
	 * @param {String} [config.workRelativePath] The directory in which to put the statically generated sitemap files before moving
	 *        them to their final location, relative to this application's /work/seo/ subdirectory
	 * @see Savory.SEO#getDomain
	 * @see Savory.SEO#getDomains
	 * @see Savory.SEO#getCurrentDomain
	 */
	Public.Domain = Savory.Classes.define(function(Module) {
		/** @exports Public as Savory.SEO.Domain */
		var Public = {}
		
		/** @ignore */
		Public._construct = function(config) {
			Savory.Objects.merge(this, config, ['rootUri', 'userAgent', 'dynamic', 'delaySeconds', 'applications', 'staticPath', 'staticRelativePath', 'workPath', 'workRelativePath'])
			this.rootUri = this.rootUri || null
			this.userAgent = this.userAgent || '*'
			this.dynamic = Savory.Objects.ensure(this.dynamic, true)
			this.delaySeconds = this.delaySeconds || 100
			this.applications = Savory.Objects.array(this.applications)
		}

		/**
		 * The user agent string for robots.txt.
		 * 
		 * @returns {String}
		 */
		Public.getUserAgent = function() {
			return this.userAgent
		}

		/**
		 * The exclusion URLs for this domain for this application, used for robots.txt,
		 * aggregated from all the location providers.
		 * 
		 * @returns {Savory.Iterators.Iterator}
		 */
		Public.getExclusions = function() {
			var iterators = []

			var providers = Savory.SEO.getProviders()
			if (providers) {
				for (var p in providers) {
					var provider = providers[p]
					if (provider.getExclusions) {
						iterators.push(provider.getExclusions())
					}
				}
			}
			
			return new Savory.Iterators.Chain(iterators)
		}

		/**
		 * The inclusion URLs for this domain for this application, used for robots.txt,
		 * aggregated from all the location providers.
		 * 
		 * @returns {Savory.Iterators.Iterator}
		 */
		Public.getInclusions = function() {
			var iterators = []
			
			var providers = Savory.SEO.getProviders()
			if (providers) {
				for (var p in providers) {
					var provider = providers[p]
					if (provider.getInclusions) {
						iterators.push(provider.getInclusions())
					}
				}
			}
			
			return new Savory.Iterators.Chain(iterators)
		}

		/**
		 * The number of seconds search engines should allow between hits (for robots.txt).
		 *
		 * @returns {Number}
		 */
		Public.getDelaySeconds = function() {
			return this.delaySeconds
		}

		/**
		 * The root URI of this domain, for example: 'http://mysite.org/'.
		 * 
		 * @returns {String}
		 */
		Public.getRootUri = function() {
			return this.rootUri
		}
		
		/**
		 * Whether to use dynamic mode for sitemap generation.
		 * 
		 * @returns {Boolean}
		 */
		Public.isDynamic = function() {
			return this.dynamic
		}
		
		/**
		 * The URL set names for this domain for this application,
		 * aggregated from all the location providers.
		 * 
		 * @returns {String[]}
		 */
		Public.getSetNames = function() {
			var setNames = []

			var providers = Savory.SEO.getProviders()
			if (providers) {
				var rootUri = this.getRootUri()
				for (var p in providers) {
					var provider = providers[p]
					var domains = provider.getDomains()
					for (var d in domains) {
						if (domains[d] == rootUri) {
							setNames.push(provider.getName())
						}
					}
				}
			}

			return setNames
		}

		/**
		 * The URLs within a URL set, supplied by a single location provider for this application.
		 * 
		 * @returns {Savory.Iterators.Iterator} 
		 */
		Public.getLocations = function(setName) {
			var providers = Savory.SEO.getProviders()
			if (providers) {
				for (var p in providers) {
					var provider = providers[p]
					if (provider.getName() == setName) {
						return provider.getLocations()
					}
				}
			}

			return null
		}
		
		/**
		 * For root applications, these are the names of applications would should be
		 * aggregated into our sitemap, otherwise is an empty array.
		 *
		 * @returns {String[]}
		 */
		Public.getApplications = function() {
			return this.applications
		}
		
		/**
		 * Aggregates exclusion and inclusion URLs from all providers and all applications for this domain.
		 * 
		 * @returns A dict in the form of {exclusions: [], inclusions: []}
		 * @see Savory.SEO.Domain#getExclusions
		 * @see Savory.SEO.Domain#getInclusions
		 */
		Public.getAllRobots = function() {
			// Our data
			var exclusions = Savory.Iterators.toArray(this.getExclusions())
			var inclusions = Savory.Iterators.toArray(this.getInclusions())

			// Gather robots from all applications
			var applications = this.getApplications()
			for (var a in applications) {
				var app = applications[a]

				var robots = Savory.Resources.request({
					uri: 'riap://component/' + app.internalName + '/savory/feature/seo/robots/',
					mediaType: 'application/java',
					query: {
						domain: this.getRootUri()
					}
				})
				
				if (robots) {
					exclusions = exclusions.concat(robots.exclusions)
					inclusions = inclusions.concat(robots.inclusions)
				}
			}
			
			return {
				exclusions: exclusions,
				inclusions: inclusions
			}
		}
		
		/**
		 * Aggregates URL set names from all providers and all applications for this domain.
		 * <p>
		 * Note that this method returns an array, not an iterator, and is capped at 50,000 URLs!
		 * 
		 * @returns {String[]}
		 * @see Savory.SEO.Domain#getSetNames 
		 */
		Public.getAllSetNames = function() {
			// Our data
			var setNames = Savory.Objects.clone(this.getSetNames())

			// Gather locations from all applications
			var applications = this.getApplications()
			for (var a in applications) {
				var app = applications[a]

				var sets = Savory.Resources.request({
					uri: 'riap://component/' + app.internalName + '/savory/feature/seo/sets/',
					mediaType: 'application/java',
					query: {
						domain: this.getRootUri()
					}
				})
				
				if (sets) {
					setNames = setNames.concat(sets)
				}
			}
			
			return setNames				
		}
		
		/**
		 * The URLs within a URL set, supplied by a single location provider for this application
		 * <i>or</i> any of the aggregated applications.
		 * 
		 * @returns {String[]}
		 * @see Savory.SEO.Domain#getLocations
		 */
		Public.getAllLocations = function(setName) {
			// Try our data
			var setNames = this.getSetNames()
			for (var s in setNames) {
				if (setNames[s] == setName) {
					return Savory.Iterators.toArray(this.getLocations(setName), 0, 50000)
				}
			}

			// Try all applications
			var applications = this.getApplications()
			for (var a in applications) {
				var app = applications[a]

				var setNames = Savory.Resources.request({
					uri: 'riap://component/' + app.internalName + '/savory/feature/seo/sets/',
					mediaType: 'application/java',
					query: {
						domain: this.getRootUri()
					}
				})

				if (setNames) {
					for (var s in setNames) {
						if (setNames[s] == setName) {
							return Savory.Resources.request({
								uri: 'riap://component/' + app.internalName + '/savory/feature/seo/locations/',
								mediaType: 'application/java',
								query: {
									domain: this.getRootUri(),
									set: setName
								}
							})
						}
					}
				}
			}
			
			return null
		}

		/**
		 * Static generation of sitemap for this domain. Files are gzip-compressed, and are limited to 50,000 URLs per file,
		 * per the sitemap spec. The files are first generated in a temporary directory, and then moved all at once to the
		 * final destination, to make sure the sitemap update occurs atomically.
		 * <p>
		 * All location providers from all applications are aggregated here. Note that each and every URL set for all applications
		 * is generated simultaneously, to maximize performance in multi-core, pooled-connection environments.
		 * <p>
		 * Still, for large sitemaps this can many seconds or even many minutes, and as such should always be done as a
		 * asynchronous task.
		 * <p>
		 * The generaton process, including failures, successes and timings, is logged to prudence.log.
		 * 
		 * @param {String|java.io.File} [staticDir] The directory in which to put the statically generated sitemap files; defaults to staticPath or
		 *        staticRelativePath provided in the constructor 
		 * @param {String|java.io.File} [workDir] The temporary directory in which to put the statically generated sitemap files before moving
		 *        them to their final location; defaults to workPath or workRelativePath provided in the constructor 
		 */
		Public.generateStatic = function(staticDir, workDir) {
			if ((!staticDir && !this.staticPath && !this.staticRelativePath) || (!workDir && !this.workPath && !this.workRelativePath)) {
				Module.logger.warning('Both staticDir and workDir must be present to generate site map')
				return
			}
			
			staticDir = staticDir || (this.staticPath ? new java.io.File(this.staticPath) : new java.io.File(document.source.basePath, '../web/static/' + this.staticRelativePath))
			workDir = workDir || (this.workPath ? new java.io.File(this.workPath) : new java.io.File(document.source.basePath, '../work/seo/' + this.workRelativePath))
			
			staticDir = (Savory.Objects.isString(staticDir) ? new java.io.File(staticDir) : staticDir).canonicalFile
			workDir = (Savory.Objects.isString(workDir) ? new java.io.File(workDir) : workDir).canonicalFile

			Module.logger.time('sitemap generation', function() {
				if (!Savory.Files.remove(workDir, true)) {
					Module.logger.severe('Failed to delete work directory "{0}"', workDir)
					return false
				}

		    	if (!workDir.mkdirs()) {
					Module.logger.severe('Failed to create work directory "{0}"', workDir)
					return false
		    	}

				var rootUri = this.getRootUri()
				var futures = []

				// Generate our URL sets
				var sets = this.getSetNames()
				for (var s in sets) {
					var set = sets[s]

					futures.push(Savory.Tasks.task({
						fn: function(context) {
							document.executeOnce('/savory/feature/seo/')
							var domain = Savory.SEO.getDomain(context.rootUri)
							if (domain) {
								domain.generateUrlSet(context.workDir, context.set)
							}
						},
						context: {
							workDir: String(workDir),
							rootUri: rootUri,
							set: set
						}
					}))
				}
				
				// Generate URL sets for other applications
				var applications = this.getApplications()
				for (var a in applications) {
					var app = applications[a]

					futures.push(Savory.Tasks.task({
						application: app.name,
						fn: function(context) {
							document.executeOnce('/savory/feature/seo/')
							var domain = Savory.SEO.getDomain(context.rootUri)
							if (domain) {
								domain.generateUrlSets(context.workDir)
							}
						},
						context: {
							workDir: String(workDir),
							rootUri: rootUri
						}
					}))
				}
				
				// Wait for all tasks to finish
				for (var f in futures) {
					futures[f].get(10000, java.util.concurrent.TimeUnit.MILLISECONDS)
				}
				
				// Generate site map index
				var file = new java.io.File(workDir, 'sitemap.xml.gz')
				var writer = Savory.Files.openForTextWriting(file, true)
				try {
					Module.logger.info('Generating "{0}"...', file)

					writer.println('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd">')
					
					var files = workDir.list()
					for (var f in files) {
						var file = files[f]
						if (file != 'sitemap.xml.gz') {
							writer.print('<sitemap><loc>')
							writer.print((rootUri + '/' + file).escapeText())
							writer.println('</loc></sitemap>')
						}
					}

					writer.println('</sitemapindex>')
				}
				finally {
					writer.close()
				}
				
				// Move working directory to static directory
				if (Savory.Files.remove(staticDir, true)) {
					if (Savory.Files.move(workDir, staticDir, true)) {
						Module.logger.info('Moved generated site map from "{0}" to "{1}"', workDir, staticDir)
					}
					else {
						Module.logger.severe('Failed to move generated site map from "{0}" to "{1}"', workDir, staticDir)
					}
				}
				else {
					Module.logger.severe('Failed to delete static directory "{0}"', staticDir)
				}
			}, this)
		}

		/**
		 * Generates the URL set files by making sure to simultaneously call all relevant {@link #generatUrlSet} methods.
		 * 
		 * @param {String|java.io.File} workDir The temporary directory in which to put the statically generated sitemap files before moving
		 *        them to their final location
		 * @see Savory.SEO.Domain#getSetNames
		 */
		Public.generateUrlSets = function(workDir) {
			workDir = Savory.Objects.isString(workDir) ? new java.io.File(workDir) : workDir

			var rootUri = this.getRootUri()
			var futures = []

			// Generate URL sets
			var sets = this.getSetNames()
			for (var s in sets) {
				var set = sets[s]

				futures.push(Savory.Tasks.task({
					fn: function(context) {
						document.executeOnce('/savory/feature/seo/')
						var domain = Savory.SEO.getDomain(context.rootUri)
						if (domain) {
							domain.generateUrlSet(context.workDir, context.set)
						}
					},
					context: {
						workDir: String(workDir),
						rootUri: rootUri,
						set: set
					}
				}))
			}

			// Wait for all tasks to finish
			for (var f in futures) {
				futures[f].get(10000, java.util.concurrent.TimeUnit.MILLISECONDS)
			}
		}

		/**
		 * Generates all files for a URL set, supplied by a single location provider for this application.
		 * Files are gzip-compressed, and are limited to 50,000 URLs per file, per the sitemap spec.
		 * 
		 * @param {String|java.io.File} workDir The temporary directory in which to put the statically generated sitemap files before moving
		 *        them to their final location
		 * @param {String} setName The name of the URL set
		 * @returns {Number} The number of files generated for the URL set (1 or more)
		 * @see Savory.SEO.Domain#getLocations
		 */
		Public.generateUrlSet = function(workDir, setName) {
			workDir = Savory.Objects.isString(workDir) ? new java.io.File(workDir) : workDir

			// Google's limits: 50,000 URLs per file and 10MB uncompressed

			var file = new java.io.File(workDir, 'sitemap-' + setName + '.xml.gz')
			var writer = Savory.Files.openForTextWriting(file, true)
			var pages = 1
			try {
				Module.logger.info('Generating "{0}"...', file)

				writer.println('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">')
				var rootUri = this.getRootUri()
				var locations = this.getLocations(setName)
				if (locations) {
					locations = new Savory.Iterators.Buffer(locations, 1000)
					try {
						var dateFormat = new Savory.Localization.DateTimeFormat('yyyy-MM-dd')
						var rootUri = this.getRootUri()
						var count = 0
						
						while (locations.hasNext()) {
							var location = locations.next()
							writer.print('<url><loc>')
							writer.print((rootUri + location.uri).escapeText())
							writer.print('</loc><lastmod>')
							writer.print(location.lastModified.format(dateFormat))
							writer.print('</lastmod><changefreq>')
							writer.print(location.frequency)
							writer.print('</changefreq><priority>')
							writer.print(location.priority)
							writer.println('</priority></url>')
							
							if (++count == urlSetPageSize) {
								// Start a new page
								writer.println('</urlset>')
								writer.close()
								
								file = new java.io.File(workDir, 'sitemap-' + setName + '-' + (pages++) + '.xml.gz')
								writer = Savory.Files.openForTextWriting(file, true)
								count = 0

								Module.logger.info('Generating "{0}"...', file)
								writer.println('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">')
							}
						}
					}
					finally {
						locations.close()
					}
				}
				writer.println('</urlset>')
			}
			finally {
				writer.close()
			}
			
			return pages
		}
		
		return Public
	}(Public))
    
    //
    // Initialization
    //

    var domains = []
    var domainConfigs = application.globals.get('savory.feature.seo.domains')
    if (domainConfigs && domainConfigs.length) {
    	for (var d in domainConfigs) {
    		domains.push(new Public.Domain(domainConfigs[d]))
    	}
    }
    else {
    	domains.push(new Public.Domain({}))
    }

    // This is the standard as determined by Google. All praise Google!
	var urlSetPageSize = 50000

	return Public
}()
