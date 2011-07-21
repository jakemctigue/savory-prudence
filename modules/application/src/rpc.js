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

document.executeOnce('/savory/service/rpc/')

//
// Modules
//

modules = Savory.Objects.pushAll(modules, Savory.RPC.buildLazyModules({
	module: 'Savory',
	object: 'ShoppingCart',
	dependencies: '/about/integration/sencha/shopping-cart/',
	reset: true
}, {
	module: 'Savory',
	object: 'Multiplier',
	methodOverrides: {
		multiply: {
			extDirect: {
				formHandler: true
			}
		}
	},
	dependencies: '/about/integration/sencha/multiplier/'
}))
//print(modules[0])
//print(modules[1])

/*modules.push(function() {
	document.executeOnce('/savory/service/rpc/')
	Savory.RPC.exportMethods({
		module: 'Savory',
		object: 'ShoppingCart',
		dependencies: '/about/integration/sencha/shopping-cart/',
		reset: true
	})
	return null
})

modules.push(function() {
	document.executeOnce('/savory/service/rpc/')
	Savory.RPC.exportMethods({
		module: 'Savory',
		object: 'Multiplier',
		methodOverrides: {
			multiply: {
				extDirect: {
					formHandler: true
				}
			}
		},
		dependencies: '/about/integration/sencha/multiplier/'
	})
	return null
})*/

//
// Routes
//

routes['/rpc/'] = 'Savory'
