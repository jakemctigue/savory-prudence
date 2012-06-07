
document.executeOnce('/prudence/lazy/')

app.settings = {
	description: {
		name: 'Savory Framework Example',
		description: 'The example application for the Savory Framework',
		author: 'Three Crickets',
		owner: 'The Savory Framework'
	},

	errors: {
		debug: true,
		homeUrl: 'http://threecrickets.com/savory/', // Only used when debug=false
		contactEmail: 'info@threecrickets.com' // Only used when debug=false
	},
	
	code: {
		libraries: ['libraries'], // Handlers and tasks will be found here
		defrost: true,
		minimumTimeBetweenValidityChecks: 1000,
		defaultDocumentName: 'default',
		defaultExtension: 'js',
		defaultLanguageTag: 'javascript',
		sourceViewable: true
	},
	
	uploads: {
		root: 'uploads',
		sizeThreshold: 0
	},
	
	mediaTypes: {
		php: 'text/html'
	}
}

app.globals = {
	mongoDb: {
		defaultServers: '127.0.0.1',
		defaultSwallow: true,
		defaultDb: 'savory'
	},

	savory: {
		service: {
			internationalization: {
				locale: 'en',
				cacheDuration: 10000,
				path: Sincerity.Container.getFileFromHere('data', 'savory', 'service', 'internationalization')
			},
			
			notification: {
				services: {
					'.': Prudence.Lazy.build({
						Email: {
							dependencies: '/savory/service/notification/service/email/',
							name: 'Savory.Notification.EmailService',
							config: {
								from: 'emblemparade@sbcglobal.net',
								site: 'Savory Framework Example'
							}
						}
					})
				}
			},
			
			events: {
				defaultStores: [function() {
					document.executeOnce('/savory/service/events/')
					return new Savory.Events.MongoDbCollectionStore() 				
				}]
			}
		}
	}
}

MongoDB = null
document.execute('/mongo-db/')
