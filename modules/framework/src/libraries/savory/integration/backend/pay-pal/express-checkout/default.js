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

document.executeOnce('/savory/integration/backend/pay-pal/')
document.executeOnce('/savory/service/authentication/')
document.executeOnce('/savory/foundation/prudence/resources/')

/** @ignore */
function handleInit(conversation) {
    conversation.addMediaTypeByName('text/plain')
}

/** @ignore */
function handleGet(conversation) {
	// TODO:
	//var from = conversation.query.get('from')
	
	var session = Savory.Authentication.getCurrentSession(conversation)
	var order = session ? session.getValue('order') : null
	
	if (!order) {
		conversation.statusCode = Savory.Resources.Status.ClientError.BadRequest
		return 'There is no order!'
	}
	
	var expressCheckout = Savory.PayPal.createExpressCheckout(order, false)
	if (expressCheckout) {
		conversation.response.redirectSeeOther(expressCheckout.getUri())
		return ''
	}
	
	conversation.statusCode = Savory.Resources.Status.ClientError.BadRequest
	return 'Could not create Express Checkout'
}