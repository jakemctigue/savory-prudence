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

function handleGetScriptlet(conversation, code, languageAdapter, content) {
	switch (String(code)) {
		case '{{':
			var content = String(content).split('->', 2)
			var name = content[0]
			var args = content.length > 1 ? content[1] : ''
			return 'document.executeOnce(\'/savory/foundation/prudence/blocks/\');Savory.Blocks.append(' + name + ', function(' + args + ') {'

		case '}}':
			return '});'

		case '&&':
			return 'document.executeOnce(\'/savory/foundation/prudence/blocks/\');Savory.Blocks.include(' + content + ');'
	}

	return ''
}