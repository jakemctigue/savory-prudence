//
// This file is part of the Savory Framework
//
// Copyright 2011-2012 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the LGPL version 3.0:
// http://www.gnu.org/copyleft/lesser.html
//
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.executeOnce('/prudence/logging/')
document.executeOnce('/prudence/tasks/')

Prudence.Logging.getLogger().info('Hello task:')
var context = Savory.Tasks.getContext()
var task = context['savory.task']
var process = context['savory.process']
Prudence.Logging.getLogger().info('Hello {0} from {1}!', task.sayHello, process ? process.key : 'nobody')
