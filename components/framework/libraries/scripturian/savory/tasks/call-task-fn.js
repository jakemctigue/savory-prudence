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

document.executeOnce('/prudence/tasks/')
document.executeOnce('/sincerity/json/')

function call(context) {
	if (context) {
		context = Sincerity.JSON.from(context, true)
		var taskContext = context['savory.task']
		if (taskContext && taskContext.fn) {
			try {
				eval(String(taskContext.fn))(context)
			}
			catch (x) {
				Savory.Tasks.logger.exception(x, 'warn')
			}
		}
	}
}
