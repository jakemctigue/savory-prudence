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

document.executeOnce('/savory/')
document.executeOnce('/mongo-db/')

// Yes, we added just about everything in the Savory Framework to
// make it easily available to the console

/** @ignore */
function handleInit(conversation) {
    conversation.addMediaTypeByName('text/plain')
}

/** @ignore */
function handleGet(conversation) {
	return Savory.Resources.Status.ClientError.NotFound
}

/** @ignore */
function handlePost(conversation) {
	var form = Savory.Resources.getForm(conversation, {
		program: 'string',
		download: 'bool'
	})
	
	// 'download' means we want an attachment disposition
	if (form.download) {
		conversation.disposition.type = 'attachment'
		conversation.disposition.filename = 'console.txt'
	}
	
	var logger = Savory.Logging.getLogger('console')
	var representation = ''
		
	function print(/* arguments */) {
		for (var a = 0, length = arguments.length; a < length; a++) {
			var arg = arguments[a]
			if (Savory.Objects.exists(arg)) {
				representation += String(arg)
			}
		}
	}
	
	function println(/* arguments */) {
		print.apply(this, arguments)
		representation += '\n'
	}

	logger.info('Executing')
	try {
		eval(form.program)
	}
	catch (x) {
		logger.exception(x, 'warn')
	}
	
	return representation
}
