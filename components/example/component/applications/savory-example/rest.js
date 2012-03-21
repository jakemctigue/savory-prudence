//
// This file is part of the Savory Framework for Prudence
//
// Copyright 2011 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the LGPL version 3.0:
// http://www.gnu.org/copyleft/lesser.html
//
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.executeOnce('/savory/service/rest/')

var data = [{
	type: 'fish2',
	color: 'red',
	born: new Date()
}, {
	type: 'fish',
	color: 'green',
	born: new Date()
}, {
	type: 'cat',
	color: 'orange',
	born: new Date()
}]

for (var i = 0; i < 10; i++) {
	data = data.concat(Sincerity.Objects.clone(data))
}

routes = Sincerity.Objects.merge(routes, Savory.Lazy.build(Savory.REST.lazyConfigsForMongoDbCollections('/mongo/')))

routes = Sincerity.Objects.merge(routes, Savory.Lazy.build({
	'/about/integration/sencha/charts/self-contained/': {
		dependencies: '/savory/integration/frontend/sencha/',
		name: 'Savory.Sencha.SelfContainedResource',
		config: {
			data: [{
				type: 'Fish',
				bought: 46,
				sold: 6
			}, {
				type: 'Elephants',
				bought: 13,
				sold: 1
			}, {
				type: 'Asparaguses',
				bought: 30,
				sold: 29
			}],
			columns: {
				bought: {editor: 'textfield'},
				sold: {editor: 'textfield'}
			}
		}
	},
	'/about/integration/sencha/grids/mongo-db/': {
		dependencies: '/savory/integration/frontend/sencha/',
		name: 'Savory.Sencha.MongoDbResource',
		config: {
			collection: 'users',
			fields: ['name', {name: 'lastSeen', type: 'date'}],
			columns: {
				name: {header: 'Name', width: 200, editor: 'textfield'},
				lastSeen: {header: 'Last Seen', width: 250}
			}
		}
	},
	'/about/integration/sencha/grids/resource/': {
		dependencies: '/savory/integration/frontend/sencha/',
		name: 'Savory.Sencha.ResourceWrapper',
		config: {
			resource: {
				uri: '/data/users/',
				internal: true
			},
			fields: ['name', {name: 'lastSeen', type: 'date'}],
			columns: {
				name: {header: 'Name', width: 200, editor: 'textfield'},
				lastSeen: {header: 'Last Seen', width: 250}
			}
		}
	},
	'/about/integration/sencha/grids/self-contained/': {
		dependencies: '/savory/integration/frontend/sencha/',
		name: 'Savory.Sencha.SelfContainedResource',
		config: {
			data: data,
			columns: {
				type: {editor: 'textfield'},
				color: {editor: 'textfield'},
				born: {width: 250}
			}
		}
	},
	'/about/integration/sencha/trees/mongo-db/': {
		dependencies: '/savory/integration/frontend/sencha/',
		name: 'Savory.Sencha.MongoDbTreeResource',
		config: {
			collection: 'textpacks',
			field: 'text',
			query: {locale: 'fr'},
			getNodeText: function(id, node) {
				return typeof node == 'string' ? id + ': ' + node : id
			}
		}
	},
	'/about/integration/sencha/trees/self-contained/': {
		dependencies: '/savory/integration/frontend/sencha/',
		name: 'Savory.Sencha.SelfContainedTreeResource',
		config: {
			root: {
				children: {
					node1: 'hi',
					node2: {
						text: 'hi2',
						children: {
							node3: 'fish'
						}
					}
				}
			}
		}
	},
	
	/*'/rpc/': {
		dependencies: '/savory/service/rpc/',
		name: 'Savory.RPC.JsonResource'
	},*/
	
	'/data/sites/': {
		dependencies: '/savory/service/rest/',
		name: 'Savory.REST.MongoDbResource',
		config: {
			name: 'site',
			plural: true
		}
	},
	'/data/user/{id}/': {
		dependencies: '/savory/service/rest/',
		name: 'Savory.REST.MongoDbResource',
		config: 'user'
	},
	'/data/users/': {
		dependencies: '/savory/service/rest/',
		name: 'Savory.REST.MongoDbResource',
		config: {
			name: 'user',
			plural: true,
			sencha: { // TODO: remove?
				fields: ['name', {name: 'lastSeen', type: 'date'}],
				columns: {
					name: {header: 'Name'},
					lastSeen: {header: 'Last Seen', width: 250}
				}
			}
		}
	},
	'/data/user/{id}/email/': {
		dependencies: '/savory/service/rest/',
		name: 'Savory.REST.MongoDbResource',
		config: {
			name: 'user',
			fields: 'email',
			extract: 'email'
		}
	},
	'/data/users/emails/': {
		dependencies: '/savory/service/rest/',
		name: 'Savory.REST.MongoDbResource',
		config: {
			name: 'user',
			plural: true,
			fields: 'email',
			extract: 'email'
		}
	},
	'/data/user/{id}/groups/': {
		dependencies: '/savory/service/rest/',
		name: 'Savory.REST.MongoDbResource',
		config: {
			name: 'user',
			fields: 'authorization',
			extract: ['authorization', 'entities']
		}
	},
	'/data/users/groups/': {
		dependencies: '/savory/service/rest/',
		name: 'Savory.REST.MongoDbResource',
		config: {
			name: 'user',
			plural: true,
			fields: 'authorization',
			extract: ['authorization', 'entities']
		}
	},
	'/data/tests/': {
		dependencies: '/savory/service/rest/',
		name: 'Savory.REST.MongoDbResource',
		config: {
			name: 'test',
			plural: true
		}
	},
	'/data/test/{id}/': {
		dependencies: '/savory/service/rest/',
		name: 'Savory.REST.MongoDbResource',
		config: 'test'
	}
}))

/*source2 = new Savory.Sencha.SelfContainedTreeResource({
	root: ['HI', {text: 'HI2', children: ['FISH']}]
})*/
