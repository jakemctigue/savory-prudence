
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
	'/math/':                   {type: 'implicit', id: 'math'},
	'/shoppingcart/':           {type: 'implicit', id: 'shoppingcart'},
	'/mongo/users/{id}/':       {type: 'implicit', id: 'mongo.users'},
	'/mongo/users/':            {type: 'implicit', id: 'mongo.users.plural'},
	'/mongo/textpack/{node}/':  {type: 'implicit', id: 'mongo.textpack'},
	'/memory/users/{id}/':      {type: 'implicit', id: 'memory.users'},
	'/memory/users/':           {type: 'implicit', id: 'memory.users.plural'},
	'/distributed/users/{id}/': {type: 'implicit', id: 'distributed.users'},
	'/distributed/users/':      {type: 'implicit', id: 'distributed.users.plural'},
	'/model/users/':            {type: 'implicit', id: 'users.model'}
}

//Sincerity.Objects.merge(app.routes, Savory.REST.createMongoDbRoutes({prefix: '/data/'}))

app.dispatchers = {
	javascript: {library: '/resources/'}
}
