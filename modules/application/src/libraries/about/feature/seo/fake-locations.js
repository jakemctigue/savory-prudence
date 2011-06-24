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

document.executeOnce('/savory/foundation/iterators/')

Savory.SEO.Provider.Fake = Savory.SEO.Provider.Fake || function(config) {
	this.getName = function() {
		return config.name
	}

	this.getDomains = function() {
		return config.domains
	}
	
	this.getLocations = function() {
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

	this.getExclusions = function() {
		return new Savory.Iterators.Fetcher(function(options, index) {
			if (index == 100) {
				options.hasNext = false
				return
			}
			return '/fake-exclude' + index + '/'
		})
	}

	this.getInclusions = function() {
		return new Savory.Iterators.Fetcher(function(options, index) {
			if (index == 100) {
				options.hasNext = false
				return
			}
			return '/fake-include' + index + '/'
		})
	}
}
