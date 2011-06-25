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

document.executeOnce('/savory/foundation/jvm/')

var ShoppingCart = function() {
	var Public = {
		addItem: function(x) {
			return items.add(x)
		},
		
		getItems: function() {
			return Savory.JVM.fromCollection(items)
		}
	}
	
	var items = application.getGlobal('shoppingCart', Savory.JVM.newSet(true))
	
	return Public
}()