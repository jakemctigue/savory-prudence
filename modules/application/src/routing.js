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

document.execute('/defaults/application/routing/')

document.executeOnce('/savory/service/authorization/')
document.executeOnce('/savory/foundation/prudence/blocks/')

Savory.SEO.routing(true)
Savory.Console.routing()
Savory.Wiki.routing()
Savory.Registration.routing()
Savory.RPC.routing()
Savory.REST.routing()
Savory.Internationalization.routing()
Savory.Linkback.routing()
Savory.Authentication.routing()
Savory.Authentication.privatize('/private/')
Savory.Authorization.routing()
Savory.Processing.routing()
Savory.PayPal.routing()
Savory.Blocks.routing()
Savory.HTML.routing()

/*
importClass(org.restlet.routing.Variable, com.threecrickets.prudence.DelegatedFilter)

var uriPathVariable = new Variable(Variable.TYPE_URI_PATH)

function createFilter(name, next) {
	var filter = new DelegatedFilter(applicationInstance.context, name)
	filter.next = next
	return filter
}

function filterDynamicWeb(name, uri, base) {
	if (uri) {
		return base ? router.attachBase(uri, createFilter(name, dynamicWeb)) : router.attach(uri, createFilter(name, dynamicWeb))
	}
	else {
		var filter = createFilter(name, dynamicWeb)
		var route = router.filter(dynamicWebBaseURL, filter, dynamicWeb)
		dynamicWeb = filter
		return route
	}
}
*/


// uhoh !!! see /page/about/ !!!!
//router.attachBase('page/', dynamicWeb)
//router.reattachBase(dynamicWebBaseURL, dynamicWeb)

//router.capture('/', 'page/home/')


//router.capture('test/{id}/', 'data/?{rq}#{rp}', false)
//router.capture('data/user/{id}/', 'data/?{rq}#user', false)
//router.capture('data/users/', 'data/?{rq}#users', false)
