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

document.executeOnce('/savory/feature/seo/')
document.executeOnce('/savory/foundation/classes/')
document.executeOnce('/savory/foundation/iterators/')

Savory.SEO.resetProviders()

var FakeProvider = FakeProvider || Savory.Classes.define(function() {
	var Public = {}
	
	Public._construct = function(config) {
		Savory.Objects.merge(this, config, ['name', 'domains'])
		FakeProvider.prototype.superclass.call(this, this)
	}
	
	Public._inherit = Savory.SEO.Provider
	
	Public.getLocations = function() {
		return new Savory.Iterators.Fetcher(function(options, index) {
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
		return new Savory.Iterators.Fetcher(function(options, index) {
			if (index == 100) {
				options.hasNext = false
				return
			}
			return '/fake-exclude' + index + '/'
		})
	}

	Public.getInclusions = function() {
		return new Savory.Iterators.Fetcher(function(options, index) {
			if (index == 100) {
				options.hasNext = false
				return
			}
			return '/fake-include' + index + '/'
		})
	}
	
	return Public
}())
