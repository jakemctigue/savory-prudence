
app.hosts = {
	'default': '/savory-example/'
}

app.routes = {
	'/*': [
		'explicit',
		'dynamicWeb',
		[
			{type: 'zuss', root: Sincerity.Container.getFileFromHere('mapped', 'style', 'three-crickets'), next: 'staticWeb'},
			{type: 'staticWeb', root: sincerity.container.getLibrariesFile('web')}
		]
	],
	'/user/{id}/': {type: 'implicit', id: 'user'},
	'/users/': {type: 'implicit', id: 'users'}
}

app.dispatchers = {
	javascript: {library: '/resources/'}
}
