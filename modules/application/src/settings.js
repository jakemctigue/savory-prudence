//
// This file is part of the Savory Framework for Prudence
//
// Copyright 2011 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the LGPL version 3.0:
// http://www.opensource.org/licenses/lgpl-3.0.html
//
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.execute('/defaults/application/settings/')

document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/prudence/lazy/')

applicationName = 'Savory Demonstration'
applicationDescription = 'Demos for the Savory Framework'
applicationAuthor = 'Tal Liron'
applicationOwner = 'Three Crickets'
applicationHomeURL = 'http://threecrickets.com/savory/'
applicationContactEmail = 'info@threecrickets.com'

showDebugOnError = true
minimumTimeBetweenValidityChecks = 0

var excludeFromFilter = ['/media/', '/style/', '/script/']
var publicBaseUri = 'https://threecrickets.com/savory'

predefinedGlobals = Savory.Objects.merge(Savory.Objects.flatten({
	savory: {
		revision: '42',
		version: 'Early Bird R42',
		
		feature: {
			console: {
				theme: 'gray'
			},
			
			contactUs: {
				channel: 'contactUs',
				site: applicationName
			},
			
			registration: {
				from: 'TODO',
				site: applicationName,
				uri: [publicBaseUri, '/registration/']
			},
			
			wiki: {
				excludeFromFilter: excludeFromFilter
			},
			
			seo: {
				domains: [{
					rootUri: 'http://localhost:8080',
					delaySeconds: 100,
					dynamic: true
				}, {
					rootUri: 'http://threecrickets.com',
					dynamic: true,
					delaySeconds: 100
				}],
				providers: {
					'.': Savory.Lazy.build({
						'the-real-thing': {
							dependencies: '/savory/feature/seo/provider/explicit/',
							name: 'Savory.SEO.Provider.Explicit',
							config: {
								domains: ['http://localhost:8080', 'http://threecrickets.com'],
								locations: ['/happy/', '/this/', '/is/', '/working/'],
								exclusions: ['/savory/media/', '/savory/style/', '/savory/script/'],
								inclusions: ['/savory/media/name/']
							}
						},
						'test': {
							dependencies: '/about/feature/seo/fake-locations/',
							name: 'Savory.SEO.Provider.Fake',
							config: {
								domains: ['http://localhost:8080', 'http://threecrickets.com']
							}
						}
					})
				}
			}
		},
		
		service: {
			authentication: {
				maxSessionIdleMinutes: 15,
				maxUserUnconfirmedDays: 7,
				passwordAlgorithm: 'SHA-256',
				passwordIterations: 1000,
				passwordSaltLength: 8,
				cookiePath: '/savory/',
				uri: [publicBaseUri, '/authentication/'],
				logoutUri: [publicBaseUri, '/authentication/logout/'],
				providerBaseUri: [publicBaseUri, '/authentication/provider/'],
				excludeFromFilter: excludeFromFilter,
				providers: {
					'.': Savory.Lazy.build({
						Facebook: {
							dependencies: '/savory/service/authentication/provider/facebook/',
							name: 'Savory.Authentication.Provider.Facebook'
						},
						Twitter: {
							dependencies: '/savory/service/authentication/provider/twitter/',
							name: 'Savory.Authentication.Provider.Twitter'
						},
						Myspace: {
							dependencies: '/savory/service/authentication/provider/open-id/',
							name: 'Savory.Authentication.Provider.OpenID',
							config: {
								slug: 'myspace',
								xrdsUri: 'https://www.myspace.com/'
							}
						},
						Google: {
							dependencies: '/savory/service/authentication/provider/open-id/',
							name: 'Savory.Authentication.Provider.OpenID',
							config: {
								slug: 'google',
								xrdsUri: 'https://www.google.com/accounts/o8/id'
							}
						},
						'Yahoo!': {
							dependencies: '/savory/service/authentication/provider/open-id/',
							name: 'Savory.Authentication.Provider.OpenID',
							config: {
								slug: 'yahoo',
								uri: 'https://me.yahoo.com',
								//xrdsUri: 'https://open.login.yahooapis.com/openid20/www.yahoo.com/xrds'
							}
						},
						'Windows Live': {
							dependencies: '/savory/service/authentication/provider/windows-live/',
							name: 'Savory.Authentication.Provider.WindowsLive'
						},
						Launchpad: {
							dependencies: '/savory/service/authentication/provider/open-id/',
							name: 'Savory.Authentication.Provider.OpenID',
							config: {
								slug: 'launchpad',
								xrdsUri: 'https://launchpad.net/~{username}',
								username: true
							}
						}/*,
						LiveJournal: {
							dependencies: '/savory/service/authentication/provider/open-id/',
							name: 'Savory.Authentication.Provider.OpenID',
							config: {
								slug: 'liveJournal',
								uri: 'http://{username}.livejournal.com', // causes invalid tag format exception
								//xrdsUri: 'http://api.livejournal.com/xrds',
								username: true
							}
						}*/
					})
				}
			},
			
			notification: {
				services: {
					'.': Savory.Lazy.build({
						Email: {
							dependencies: '/savory/service/notification/service/email/',
							name: 'Savory.Notification.Service.Email',
							config: {
								from: 'TODO',
								site: applicationName
							}
						}
					})
				}
			},
			
			authorization: {
				cacheDuration: 10000,
				excludeFromFilter: excludeFromFilter
			},
			
			nonce: {
				defaultDuration: 15 * 60 * 1000
			},
			
			internationalization: {
				locale: 'en',
				cacheDuration: 10000,
				path: applicationBasePath + '/data/savory/service/internationalization/',
				excludeFromFilter: excludeFromFilter
			},
			
			events: {
				defaultStores: function() {
					document.executeOnce('/savory/service/events/')
					return [new Savory.Events.MongoDbCollectionStore()]
				}
			},
			
			rpc: {
				store: function() {
					document.executeOnce('/savory/service/rpc/')
					return new Savory.RPC.DistributedStore()
					//return new Savory.RPC.MapStore(application.globals)
					//return new Savory.RPC.MongoDbStore()
				}
			},
			
			linkback: {
				trackbackUri: [publicBaseUri, '/trackback/{id}/'],
				pingbackUri: [publicBaseUri, '/pingback/']
			}
		},
		
		integration: {
			backend: {
				payPal: {
					branding: {
						name: 'My Cool Brand',
						headerImage: 'https://threecrickets.com/media/three-crickets.png'
					},
					sandbox: true,
					username: 'TODO',
					password: 'TODO',
					signature: 'TODO',
					expressCheckoutUri: [publicBaseUri, '/pay-pal/express-checkout/'],
					expressCheckoutCallbackUri: [publicBaseUri, '/pay-pal/express-checkout/callback/'],
					defaultDuration: 15 * 60 * 1000
				},
				
				reCaptcha: {
					publicKey: 'TODO',
					privateKey: 'TODO'
				},
				
				openId: {
					realmUri: 'https://threecrickets.com/',
					callbackUri: [publicBaseUri, '/authentication/provider/open-id/']
				},
				
				facebook: {
					appId: 'TODO',
					appSecret: 'TODO',
					apiKey: 'TODO',
					callbackUri: [publicBaseUri, '/authentication/provider/facebook/']
				},
				
				twitter: {
					consumerKey: 'TODO',
					consumerSecret: 'TODO',
					oauthToken: 'TODO',
					oauthTokenSecret: 'TODO',
					callbackUri: [publicBaseUri, '/authentication/provider/twitter/']
				},
				
				windowsLive: {
					clientId: 'TODO',
					secretKey: 'TODO'
				},
				
				oauth: {
					defaultDuration: 15 * 60 * 1000
				}
			},
			
			frontend: {
				sencha: {
					defaultTheme: 'gray'
				}
			}
		},
		
		foundation: {
			mail: {
				smtp: {
					host: '127.0.0.1'
				}
			}
		}
	}
}), predefinedGlobals)

predefinedGlobals['mongoDb.defaultConnection'] = predefinedSharedGlobals['mongoDb.defaultConnection']
predefinedGlobals['mongoDb.defaultServers'] = predefinedSharedGlobals['mongoDb.defaultServers']
predefinedGlobals['mongoDb.defaultSwallow'] = predefinedSharedGlobals['mongoDb.defaultSwallow']
predefinedGlobals['mongoDb.defaultDb'] = 'savory'

// Force re-initialization of MongoDB API
MongoDB = null
document.execute('/mongo-db/')

//
// RPC service
//

var modules = predefinedGlobals['savory.service.rpc.modules'] = (predefinedGlobals['savory.service.rpc.modules'] || [])
modules.push(function() {
	document.executeOnce('/savory/service/rpc/')
	Savory.RPC.exportMethods({
		module: 'Savory',
		object: 'ShoppingCart',
		dependencies: '/about/integration/sencha/shopping-cart/',
		reset: true
	})
	return null
})

var routes = predefinedGlobals['savory.service.rpc.routes'] = (predefinedGlobals['savory.service.rpc.routes'] || {})
routes['/rpc/'] = 'Savory'

//
// Route service
//

routes = predefinedGlobals['savory.service.rest.routes'] = (predefinedGlobals['savory.service.rest.routes'] || {})
document.execute('/applications/savory/rest/')

//
// Extra settings
//

try {
document.execute('/applications/savory/settings-extra/')
} catch(x) {}

document.executeOnce('/savory/feature/console/')
document.executeOnce('/savory/feature/seo/')
document.executeOnce('/savory/feature/wiki/')
document.executeOnce('/savory/feature/registration/')
document.executeOnce('/savory/service/linkback/')
document.executeOnce('/savory/service/authentication/')
document.executeOnce('/savory/service/rpc/')
document.executeOnce('/savory/service/rest/')
document.executeOnce('/savory/service/processing/')
document.executeOnce('/savory/service/events/')
document.executeOnce('/savory/integration/backend/pay-pal/')
document.executeOnce('/savory/integration/frontend/sencha/')

Savory.Console.settings()
Savory.SEO.settings()
Savory.Wiki.settings()
Savory.Registration.settings()
Savory.Authentication.settings()
Savory.Linkback.settings()
Savory.RPC.settings()
Savory.REST.settings()
Savory.Processing.settings()
Savory.PayPal.settings()
Savory.Sencha.settings()
