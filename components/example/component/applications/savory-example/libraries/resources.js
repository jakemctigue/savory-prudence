
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

resources = {
	math: new Savory.RPC.Resource({namespaces: {Math: Math}}),
	shoppingcart: new Savory.Sencha.DirectResource({name: 'Savory', objects: {ShoppingCart: new ShoppingCart()}}),
	users: new Savory.REST.MongoDbResource({name: 'users'}),
	'users.plural': new Savory.REST.MongoDbResource({name: 'users', plural: true}),
	'users.model': new Savory.REST.InMemoryResource({name: 'users.model', data: {test: 1}})
}

//resources = Savory.REST.createMongoDbResources()
