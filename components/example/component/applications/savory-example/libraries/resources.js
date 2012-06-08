
document.executeOnce('/savory/service/rest/')
document.executeOnce('/savory/service/rpc/')

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
	hello: {
		handleInit: function(conversation) {
		    conversation.addMediaTypeByName('text/plain')
		},
		handleGet: function(conversation) {
			return 'hello'
		}
	},
	math: new Savory.RPC.Resource({namespaces: {Math: Math}}),
	users: new Savory.REST.MongoDbResource({name: 'users'}),
	'users.plural': new Savory.REST.MongoDbResource({name: 'users', plural: true})
}

//resources = Savory.REST.createMongoDbResources()
