
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
	],
	'/math/': {type: 'implicit', id: 'math'},
	'/shoppingcart/': {type: 'implicit', id: 'shoppingcart'},
	'/data/users/{id}/': {type: 'implicit', id: 'users'},
	'/data/users/': {type: 'implicit', id: 'users.plural'},
	'/model/users/': {type: 'implicit', id: 'users.model'}
}

//Sincerity.Objects.merge(app.routes, Savory.REST.createMongoDbRoutes({prefix: '/data/'}))

app.dispatchers = {
	javascript: {library: '/resources/'}
}
