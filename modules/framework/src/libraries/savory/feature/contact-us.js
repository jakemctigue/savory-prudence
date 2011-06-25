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

// simple form with recaptcha for sending us email

document.executeOnce('/savory/service/notification/')
document.executeOnce('/savory/service/authentication/')
document.executeOnce('/savory/service/nonces/')
document.executeOnce('/savory/integration/backend/re-captcha/')
document.executeOnce('/savory/foundation/classes/')
document.executeOnce('/savory/foundation/mail/')
document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/prudence/resources/')

var Savory = Savory || {}

/**
 * This feature enables an HTML form for anonymous visitors to send one-way messages to the site
 * owner. It uses reCAPTCHA to avoid spam. The message is then broadcast via the {@link Savory.Notification}
 * service on a configured channel name. Any listener on that channel would thus get the message.
 * <p>
 * This feature is useful for allowing users to send general comments and also bug reports in a controlled manner,
 * without having to give away an email address that could be easily abused.
 * <p>
 * For users who are logged in, a simpler form is presented, which does not require them to
 * pass reCAPTCHA or to enter their email address.
 * 
 * <h1>Configuration</h1>
 * Set the following application globals:
 * <ul>
 * <li><em>savory.feature.contactUs.site</em>: the site name as it appears in the form and in notifications</li>
 * <li><em>savory.feature.contactUs.channel</em>: the channel used for {@link Savory.Notification@queueForChannel}</li>
 * </ul>
 * 
 * <h1>Internationalization</h1>
 * Set the following keys in the {@link Savory.Internationalization.Pack}:
 * <ul>
 * <li><em>savory.feature.contactUs.form.invalid.email</em></li>
 * <li><em>savory.feature.contactUs.form.invalid.message</em></li>
 * <li><em>savory.feature.contactUs.form.invalid.humanity</em></li>
 * <li><em>savory.feature.contactUs.message:</em> a {@link Savory.Mail.MessageTemplate}</li>
 * </ul>
 *  
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.ContactUs = Savory.ContactUs || function() {
	/** @exports Public as Savory.ContactUs */
    var Public = {}

    /**
     * Manages the 'contact us' form.
     * <p>
     * The relevant fragments can be found at /web/fragments/savory/feature/contact-us/form/.
     * 
     * @class
     * @name Savory.ContactUs.Form
     */
	Public.Form = Savory.Classes.define(function() {
		/** @exports Public as Savory.ContactUs.Form */
	    var Public = {}

	    /** @ignore */
		Public._construct = function(document, conversation) {
			var reCaptcha = new Savory.ReCAPTCHA()
			this.textPack = Savory.Internationalization.getCurrentPack(conversation)
			this.messageTemplate = new Savory.Mail.MessageTemplate(textPack, 'savory.feature.contactUs.message')
		
			conversation.locals.put('savory.feature.contactUs.form', this)
		}
	
		Public.getStatusText = function() {
			var status = conversation.locals.get('savory.feature.contactUs.status')
			return status || ''
		}

		Public.validate = function() {
			var form = Savory.Resources.getForm(conversation, {
				email: 'string',
				message: 'string'
			})
			
			var session = Savory.Authentication.getCurrentSession(conversation)
			var user = session ? session.getUser() : null
			
			if (user) {
				form.email = user.getEmail()
			}
			else {
				if (!form.email || !Savory.Mail.isAddressValid(form.email)) {
					conversation.locals.put('savory.feature.contactUs.status', this.textPack.get('savory.feature.contactUs.form.invalid.email'))
					return null
				}
			}
			if (!form.message) {
				conversation.locals.put('savory.feature.contactUs.status', this.textPack.get('savory.feature.contactUs.form.invalid.message'))
				return null
			}
			if (!user) {
				if (!reCaptcha.validate(conversation)) {
					conversation.locals.put('savory.feature.contactUs.status', this.textPack.get('savory.feature.contactUs.form.invalid.humanity'))
					return null
				}
			}
			
			return form				
		}
		
		Public.render = function() {
			switch (String(conversation.request.method)) {
				case 'POST':
					var form = this.validate()
					if (form) {
						var address = Savory.Resources.getClientAddress(conversation)
						
						Savory.Notification.queueForChannel(channel, this.messageTemplate.cast({
							siteName: siteName,
							address: address.ip,
							hostName: address.hostName,
							message: form.message
						}), form.email)
						
						document.include('/savory/feature/contact-us/form/success/')
						return
					}
					break
			}
			
			document.include('/savory/feature/contact-us/form/')				
		}
		
		return Public
	}())
    
    //
    // Initialization
    //

	var channel = application.globals.get('savory.feature.contactUs.channel')
	var siteName = application.globals.get('savory.feature.contactUs.site')
	
	return Public
}()