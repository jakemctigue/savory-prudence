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
document.executeOnce('/savory/foundation/prudence/resources/')

var form = new Savory.Resources.Form({fields: {
	first: {type: 'number', label: 'A number'},
	second: {type: 'integer', label: 'An integer'}
}})

form.process = function(results) {
	if (results.success) {
		results.values.result = Number(results.values.first) * Number(results.values.second)
		results.msg = '{first} times {second} equals {result}'.cast(results.values)
		//results.msg = Savory.JSON.to(results.values)
	}
	else {
		results.msg = 'Wrong!'
	}
}

var Multiplier = function() {
	var Public = {
		multiply: function(first, second) {
			return form.handle({
				values: {
					first: first,
					second: second
				}
			})
		}
	}
	
	return Public
}()
