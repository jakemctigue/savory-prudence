
document.executeOnce('/savory/service/rest/')

/*resources = {
	users:  new Savory.REST.MongoDbResource({name: 'users'}),
	'users.plural': new Savory.REST.MongoDbResource({name: 'users', plural: true})
}*/

resources = Savory.REST.createMongoDbResources()
