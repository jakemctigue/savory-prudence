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
document.executeOnce('/savory/foundation/json/')

var Savory = Savory || {}

/**
 * Lazy, thread-safe construction of global services via a straightforward DSL.
 * 
 * @namespace
 * 
 * @author Tal Liron
 */
Savory.Lazy = Savory.Lazy || function() {
	/** @exports Public as Savory.Lazy */
    var Public = {}

	/**
	 * @returns {Savory.Lazy.Entry}
	 */
	Public.createEntry = function(value) {
		return isConstructor(value) ? new Public.LazyEntry(value) : new Public.Entry(value)
	}
	
	/**
	 * @returns {Savory.Lazy.Entry|Object}
	 */
	Public.getGlobalEntry = function(name, logger, createFn) {
		var lazyName = name + '.lazy'
		var lazyEntry = application.globals.get(lazyName)

		if (!Savory.Objects.exists(lazyEntry)) {
			var value = application.globals.get(name)
			if (Savory.Objects.exists(value)) {
				lazyEntry = Public.createEntry(value)
				lazyEntry = application.getGlobal(lazyName, lazyEntry)
			}
		}
		
		if (lazyEntry && createFn) {
			lazyEntry = lazyEntry.get(createFn, logger)
			return lazyEntry ? lazyEntry.instance : null
		}
		
		return lazyEntry
	}

	/**
	 * @returns {Savory.Lazy.List|Array}
	 */
	Public.getGlobalList = function(name, logger, createFn) {
		var lazyName = name + '.lazy'
		var lazyList = application.globals.get(lazyName)

		if (!Savory.Objects.exists(lazyList)) {
			var list = application.globals.get(name)
			if (Savory.Objects.exists(list)) {
				lazyList = new Public.List({logger: logger})
				lazyList.addAll(list)
				lazyList = application.getGlobal(lazyName, lazyList)
			}
		}
		
		return lazyList && createFn ? lazyList.toArray(createFn) : lazyList
	}
		
	/**
	 * @returns {Savory.Lazy.Map|Object}
	 */
	Public.getGlobalMap = function(name, logger, createFn) {
		var lazyName = name + '.lazy'
		var lazyMap = application.globals.get(lazyName)

		if (!Savory.Objects.exists(lazyMap)) {
			var map = application.globals.get(name)
			if (Savory.Objects.exists(map)) {
				lazyMap = new Public.Map({logger: logger})
				lazyMap.putAll(map)
				lazyMap = application.getGlobal(lazyName, lazyMap)
			}
		}
		
		return lazyMap && createFn ? lazyMap.toDict(createFn) : lazyMap
	}
	
	/**
	 * Builds the source code for a constructor based on a simple DSL.
	 * 
	 * @returns {String}
	 */
	Public.buildOne = function(config) {
		var fn = 'function(){\n'
		if (config.dependencies) {
			config.dependencies = Savory.Objects.array(config.dependencies)
			for (var d in config.dependencies) {
				fn += 'document.executeOnce(\'' + config.dependencies[d].escapeSingleQuotes() + '\');\n'
			}
		}
		if (config.config) {
			fn += 'document.executeOnce(\'/savory/foundation/json/\');\n'
		}
		fn += 'return new ' + config.name + '('
		if (config.config) {
			fn += 'Savory.JSON.fromExtendedJSON(' + Savory.JSON.to(config.config, true) + ')'
		}
		fn += ');\n}'
		return fn
	}

	/**
	 * Builds an array or dict of constructors based on a simple DSL.
	 * 
	 * @returns {Array|Object}
	 */
	Public.build = function(configs) {
		var r
		if (Savory.Objects.isArray(configs)) {
			r = []
		}
		else {
			r = {}
		}
		
		for (var c in configs) {
			var config = configs[c]
			config.config = config.config || {}
			config.config.name = config.config.name || c
			r[c] = Public.buildOne(config)
		}
		
		return r
	}
		
	/**
	 * @class
	 * @name Savory.Lazy.Entry
	 */
	Public.Entry = Savory.Classes.define(function() {
		/** @exports Public as Savory.Lazy.Entry */
	    var Public = {}
	    
	    /** @ignore */
	    Public._construct = function(instance) {
	    	this.instance = instance
	    }

	    /**
		 * Retrieves the current instance.
		 */
	    Public.get = function(createFn, logger) {
			return {
				instance: this.instance,
				created: false
			}
		}
		
		/**
		 * Resets the instance, if supported.
		 */
		Public.reset = function() {
			return false
		}
		
		return Public
	}())

	/**
	 * @class
	 * @name Savory.Lazy.LazyEntry
	 * @augments Savory.Lazy.Entry
	 */
	Public.LazyEntry = Savory.Classes.define(function(Module) {
		/** @exports Public as Savory.Lazy.LazyEntry */
	    var Public = {}
	    
	    /** @ignore */
	    Public._inherit = Module.Entry

	    /** @ignore */
	    Public._construct = function(constructor) {
			// We will need to eval this later so that we don't use Rhino's compiled version,
			// which contains optimizations that would have the wrong scope for us
			this.constructor = String(constructor)

			this.instance = null
			this.lock = Savory.JVM.newLock(true)
	    }

	    Public.get = function(createFn, logger) {
	    	logger = logger || application.logger
	    	this.lock.readLock().lock()
			try {
				if (this.instance) {
					return {
						instance: this.instance,
						created: false
					}
				}

				this.lock.readLock().unlock()
				this.lock.writeLock().lock()
				try {
					if (this.instance) {
						return {
							instance: this.instance,
							created: false
						}
					}

					try {
						this.instance = createFn(this.constructor)
					}
					catch (x) {
						logger.warning(x)
						throw x
					}
					return {
						instance: this.instance,
						created: true
					}
				}
				finally {
					this.lock.writeLock().unlock()
					this.lock.readLock().lock()
				}
			}
			finally {
				this.lock.readLock().unlock()
			}
		}
		
	    Public.reset = function() {
			this.lock.writeLock().lock()
			try {
				if (this.instance) {
					this.instance = null
					return true
				}
				
				return false
			}
			finally {
				this.lock.writeLock().unlock()
			}
		}
		
		return Public
	}(Public))
	
	/**
	 * @class
	 * @name Savory.Lazy.List
	 */
	Public.List = Savory.Classes.define(function(Module) {
		/** @exports Public as Savory.Lazy.List */
	    var Public = {}

	    /** @ignore */
	    Public._construct = function(config) {
			this.list = config.list || Savory.JVM.newList(true)
			this.logger = config.logger || application.logger
	    }

	    Public.reset = function() {
			var index = 0
			for (var i = this.list.iterator(); i.hasNext(); ) {
				var entry = i.next()
				if (entry.reset()) {
					this.logger.info('Reset lazy entry: ' + index)
				}
				index++
			}
		}
		
	    Public.get = function(index, createFn) {
			var entry = this.list.get(index)
			if (entry) {
				entry = entry.get(createFn, this.logger)
				if (entry.created) {
					this.logger.info('Created lazy entry: ' + index)
				}
				return entry.instance
			}
			return null
		}
		
	    Public.set = function(index, value) {
	    	this.list.set(index, Module.createEntry(value))
		}
		
	    Public.add = function(value) {
	    	this.list.add(Module.createEntry(value))
		}
		
	    Public.addAll = function(array) {
			for (var a in array) {
				this.add(array[a])
			}
		}
		
	    Public.toArray = function(createFn) {
			var array = []
			var index = 0
			for (var i = this.list.iterator(); i.hasNext(); ) {
				var entry = i.next()
				entry = entry.get(createFn, this.logger)
				if (Savory.Objects.exists(entry)) {
					if (entry.created) {
						this.logger.info('Created lazy entry: ' + index)
					}
					array.push(entry.instance)
				}
				index++
			}
			return array
		}
		
		return Public
	}(Public))

	/**
	 * @class
	 * @name Savory.Lazy.Map
	 */
	Public.Map = Savory.Classes.define(function(Module) {
		/** @exports Public as Savory.Lazy.Map */
	    var Public = {}
	    
	    /** @ignore */
	    Public._construct = function(config) {
			this.map = config.map || Savory.JVM.newMap(true)
			this.logger = config.logger || application.logger
	    }

	    Public.reset = function() {
			for (var i = this.map.entrySet().iterator(); i.hasNext(); ) {
				var entry = i.next()
				if (entry.value.reset()) {
					this.logger.info('Reset lazy entry: ' + entry.key)
				}
			}
		}
		
	    Public.get = function(name, createFn) {
			var entry = this.map.get(name)
			if (entry) {
				entry = entry.get(createFn, this.logger)
				if (entry.created) {
					this.logger.info('Created lazy entry: ' + name)
				}
				return entry.instance
			}
			return null
		}
		
	    Public.put = function(name, value) {
	    	this.map.put(name, Module.createEntry(value))
		}
		
	    Public.putAll = function(dict) {
			for (var name in dict) {
				this.put(name, dict[name])
			}
		}
		
	    Public.toDict = function(createFn) {
			var dict = {}
			for (var i = this.map.entrySet().iterator(); i.hasNext(); ) {
				var mapEntry = i.next()
				var entry = mapEntry.value.get(createFn, this.logger)
				if (Savory.Objects.exists(entry)) {
					if (entry.created) {
						this.logger.info('Created lazy entry: ' + mapEntry.key)
					}
					dict[mapEntry.key] = entry.instance
				}
			}
			return dict
		}
		
		return Public
	}(Public))

	//
	// Private
	//
	
	function isConstructor(value) {
		return (typeof value == 'function') || Savory.Objects.isString(value)
	}

	return Public
}()
