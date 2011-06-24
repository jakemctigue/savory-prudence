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

document.executeOnce('/savory/foundation/lucene/')
document.executeOnce('/savory/foundation/iterators/')

var directory = new Savory.Lucene.Directory('/tmp/index')
try {
	var messages = new MongoDB.Collection('messages')
	var i = messages.find()
	i = new Savory.Iterators.Transformer(i, function fn(entry) {
		//entry = Savory.Objects.flatten(entry)
		//return entry
		return {
			_id: {
				value: entry._id,
				index: false
			},
			subject: {
				value: entry.message.subject,
				store: true
			},
			text: {
				value: entry.message.text,
				store: true
			}
		}
	})
	directory.index(i, {openMode: 'create'})
	
	var documents = new MongoDB.Collection('documents')
	i = documents.find()
	i = new Savory.Iterators.Transformer(i, function(entry) {
		return {
			text: Savory.HTML.strip(entry.activeDraft.rendered)
		}
	})
	directory.index(i)
	
	directory.index([{
		type: 'hello'
	}, {
		type: 'world'
	}])
}
finally {
	directory.close()
}
