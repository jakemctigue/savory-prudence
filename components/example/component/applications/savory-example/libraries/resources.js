
document.executeOnce('/savory/service/rest/')
document.executeOnce('/savory/service/rpc/')
document.executeOnce('/savory/integration/frontend/sencha/')
document.executeOnce('/sincerity/jvm/')

var Math = {
	multiply: {
		fn: function(x, y) {
			if ((x == 1) && (y == 2)) {
				throw 'You\'re trying to multiply the magic numbers!'
			}
			return x * y
		}
	}
}

var ShoppingCart = function() {
	this.addItem = function(item) {
		if (item == 'magic') {
			throw 'You\'re trying to add the \'magic\' item!'
		}
		return this.items.add(item)
	}

	this.getItems = function() {
		return Sincerity.JVM.fromCollection(this.items)
	}
	
	this.items = Sincerity.JVM.newSet(true)
}

/*
var MathClass = function(multiplyAll) {
	this.multiplyAll = multiplyAll

	this.multiply = function(x, y) {
		return x * y * this.multiplyAll
	}
}

var Math = new MathClass(100)
*/

var users = {
	'4e057e94e799a23b0f581d7d': {
		_id: '4e057e94e799a23b0f581d7d',
		name: 'newton',
		lastSeen: new Date()
	},
	'4e057e94e799a23b0f581d7e': {
		_id: '4e057e94e799a23b0f581d7e',
		name: 'sagan',
		lastSeen: new Date()
	}
}

var usersMap = Sincerity.JVM.toMap(users, true)

resources = {
	math:                       new Savory.RPC.Resource({namespaces: {Math: Math}}),
	shoppingcart:               new Savory.Sencha.DirectResource({name: 'Savory', objects: {ShoppingCart: new ShoppingCart()}}),
	'mongo.users':              new Savory.REST.MongoDbResource({name: 'users'}),
	'mongo.users.plural':       new Savory.REST.MongoDbResource({name: 'users', plural: true}),
	'mongo.textpack':           new Savory.Sencha.MongoDbTreeResource({collection: 'textpacks', field: 'text', query: {locale: 'fr'}}),
	'memory.users':             new Savory.REST.InMemoryResource({name: 'users', documents: usersMap}),
	'memory.users.plural':      new Savory.REST.InMemoryResource({name: 'users', documents: usersMap, plural: true}),
	'distributed.users':        new Savory.REST.DistributedResource({name: 'users', documents: users}),
	'distributed.users.plural': new Savory.REST.DistributedResource({name: 'users', documents: users, plural: true}),
	'users.model':              new Savory.REST.InMemoryResource({name: 'users.model', document: users})
}

//resources = Savory.REST.createMongoDbResources()
