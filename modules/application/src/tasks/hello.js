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

document.executeOnce('/savory/foundation/prudence/logging/')
document.executeOnce('/savory/foundation/prudence/tasks/')

Savory.Logging.getLogger().info('Hello task:')
var context = Savory.Tasks.getContext()
var task = context['savory.task']
var process = context['savory.process']
Savory.Logging.getLogger().info('Hello {0} from {1}!', task.sayHello, process ? process.key : 'nobody')
