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

document.executeOnce('/savory/service/rpc/')

//
// Modules
//

modules = Sincerity.Objects.pushAll(modules, Savory.RPC.buildLazyModules({
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

//
// Routes
//

routes['/rpc/'] = 'Savory'
