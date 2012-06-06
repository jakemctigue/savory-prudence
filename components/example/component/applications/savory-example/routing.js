
document.executeOnce('/savory/service/rest/')

app.hosts = {
	'default': '/savory-example/'
}

app.routes = {
	'/*': [
		'explicit',
		'dynamicWeb',
		{type: 'zuss', next: [
			'staticWeb',
			{type: 'staticWeb', root: sincerity.container.getLibrariesFile('web')}]}
	]/*,
	'/users/{id}/': {type: 'implicit', id: 'users'},
	'/users/': {type: 'implicit', id: 'users.plural'}*/
}

Sincerity.Objects.merge(app.routes, Savory.REST.createMongoDbRoutes({prefix: '/data/'}))

app.dispatchers = {
	javascript: {library: '/resources/'}
}
