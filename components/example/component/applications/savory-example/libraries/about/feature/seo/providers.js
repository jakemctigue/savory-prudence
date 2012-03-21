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

document.executeOnce('/savory/feature/seo/')
document.executeOnce('/sincerity/classes/')
document.executeOnce('/sincerity/iterators/')

Savory.SEO.resetProviders()

var FakeProvider = FakeProvider || Sincerity.Classes.define(function() {
	var Public = {}
	
	Public._inherit = Savory.SEO.Provider
	
	Public._construct = function(config) {
		Sincerity.Objects.merge(this, config, ['name', 'domains'])
		FakeProvider.prototype.superclass.call(this, this)
	}
	
	Public.getLocations = function() {
		return new Sincerity.Iterators.Fetcher(function(options, index) {
			if (index == 300000) {
				options.hasNext = false
				return
			}
			return {
				uri: '/fake' + index + '/',
				lastModified: new Date(),
				frequency: 'weekly',
				priority: 0.9
			}
		})
	}

	Public.getExclusions = function() {
		return new Sincerity.Iterators.Fetcher(function(options, index) {
			if (index == 100) {
				options.hasNext = false
				return
			}
			return '/fake-exclude' + index + '/'
		})
	}

	Public.getInclusions = function() {
		return new Sincerity.Iterators.Fetcher(function(options, index) {
			if (index == 100) {
				options.hasNext = false
				return
			}
			return '/fake-include' + index + '/'
		})
	}
	
	return Public
}())

var SavoryProvider = SavoryProvider || Sincerity.Classes.define(function() {
	var Public = {}
	
	Public._inherit = Savory.SEO.ExplicitProvider
	
	Public._construct = function(config) {
		this.name = 'savory'
		this.domains = ['http://threecrickets.com', 'http://localhost:8080']
		this.exclusions = ['/savory/media/', '/savory/style/', '/savory/script/']
		
		var lastModified = new Date()
		
		this.locations = [{
			uri: '/savory/',
			lastModified: lastModified,
			priority: 0.9,
			frequency: 'monthly'
		}, {
			uri: '/savory/download/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/legal/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/progress/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/feature/blog/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/feature/console/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/feature/contact-us/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/feature/discussion/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/feature/registration/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/feature/seo/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/feature/shopping-cart/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/feature/wiki/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/foundation/blocks/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/foundation/html/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/foundation/html/markup/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/foundation/iterators/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/foundation/lazy/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/foundation/logging/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/foundation/lucene/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/foundation/resources/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/foundation/svg/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/foundation/tasks/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/foundation/templates/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/integration/gravatar/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/integration/pay-pal/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/integration/sencha/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/integration/sencha/charts/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/integration/sencha/direct/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/integration/sencha/forms/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/integration/sencha/grids/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/integration/sencha/touch/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/integration/sencha/trees/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/service/authentication/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/service/authorization/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/service/backup/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/service/cache/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/service/documents/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/service/events/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/service/internationalization/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/service/linkback/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/service/nonces/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/service/notification/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/service/progress/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/service/rest/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/service/rpc/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/service/search/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/service/serials/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/service/syndication/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/about/service/tool/js-doc/',
			lastModified: lastModified,
			priority: 0.3,
			frequency: 'monthly'
		}, {
			uri: '/savory/api/',
			lastModified: lastModified,
			priority: 0.5,
			frequency: 'monthly'
		}]
		
		SavoryProvider.prototype.superclass.call(this, this)
	}
	
	return Public
}())
