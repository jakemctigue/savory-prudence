
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
	'/users/{id}/': {type: 'implicit', id: 'users'},
	'/users/': {type: 'implicit', id: 'users.plural'}
}

app.dispatchers = {
	javascript: {library: '/resources/'}
}
