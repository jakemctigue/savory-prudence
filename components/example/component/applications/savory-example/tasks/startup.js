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

document.executeOnce('/savory/foundation/prudence/tasks/')

Savory.Tasks.task({
	fn: function() {
		document.executeOnce('/savory/service/notification/')
		Savory.Notification.sendQueuedNotices()
	},
	repeatEvery: 10000
})

Savory.Tasks.task({
	name: '/hello/',
	sayHello: 'Tal',
	distributed: true,
	block: 2000
})

application.distributedGlobals.put('test', 'I\'m a distributed value')
application.logger.info(application.distributedGlobals.get('test'))
