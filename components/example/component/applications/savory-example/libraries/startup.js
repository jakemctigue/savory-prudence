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

document.executeOnce('/prudence/tasks/')

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
