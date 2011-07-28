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
 * <li><em>savory.feature.contactUs.form.title</em></li>
 * <li><em>savory.feature.contactUs.form.button.send</em></li>
 * <li><em>savory.feature.contactUs.form.label.email</em></li>
 * <li><em>savory.feature.contactUs.form.label.message</em></li>
 * <li><em>savory.feature.contactUs.form.label.recaptcha_response_field</em></li>
 * <li><em>savory.feature.contactUs.form.success</em></li>
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
     * Returns either {@link Savory.ContactUs#loggedInForm} or {@link Savory.ContactUs#notLoggedInForm}
     * as appropriate.
     * 
     * @returns {Savory.ContactUs.Form}
     */
    Public.getForm = function(conversation) {
    	var session = Savory.Authentication.getCurrentSession(conversation)
    	var user = session ? session.getUser() : null
    	return user ? Public.loggedInForm : Public.notLoggedInForm
    }

    /**
     * Manages the 'contact us' form.
     * <p>
     * The relevant fragments can be found at /web/fragments/savory/feature/contact-us/form/.
     * 
     * @class
     * @name Savory.ContactUs.Form
     * @augments Savory.Resources.Form
     */
	Public.Form = Savory.Classes.define(function(Module) {
		/** @exports Public as Savory.ContactUs.Form */
	    var Public = {}

	    /** @ignore */
	    Public._inherit = Savory.Resources.Form
	    
	    /** @ignore */
	    Public._configure = ['hasUser']
	    
	    /** @ignore */
		Public._construct = function(config) {
	    	if (this.hasUser) {
				this.fields = this.fields || {
					message: {
						required: true
					}
				}
	    	}
	    	else {
				this.fields = this.fields || {
					email: {
						type: 'email',
						required: true
					}, 
					message: {
						required: true
					},
					recaptcha_response_field: {
						type: 'reCaptcha',
						required: true
					},
					recaptcha_challenge_field: {
						required: true
					}
				}
	    	}

			this.includeDocumentName = this.includeDocumentName || '/savory/feature/contact-us/form/'
			this.includeSuccessDocumentName = this.includeSuccessDocumentName || '/savory/feature/contact-us/form/success/'
			this.reCaptcha = this.reCaptcha || new Savory.ReCAPTCHA() // required by 'reCaptcha' field type
			
			Module.Form.prototype.superclass.call(this, this)
		}

    	Public.process = function(results, conversation) {
    		if (results.success) {
				var address = Savory.Resources.getClientAddress(conversation)
				var session = Savory.Authentication.getCurrentSession(conversation)
				var user = session ? session.getUser() : null
				var email = user ? user.getEmail() : results.values.email
				var textPack = Savory.Internationalization.getCurrentPack(conversation)
				var messageTemplate = new Savory.Mail.MessageTemplate(textPack, 'savory.feature.contactUs.message')
	
				Savory.Notification.queueForChannel(channel, messageTemplate.cast({
					siteName: siteName,
					address: address.ip,
					hostName: address.hostName,
					message: results.values.message
				}), email)
    		}
    	}
		
		return Public
	}(Public))
	
	/**
	 * @constant
	 * @returns {Savory.ContactUs.Form}
	 */
	Public.loggedInForm = new Public.Form({hasUser: true})

	/**
	 * @constant
	 * @returns {Savory.ContactUs.Form}
	 */
    Public.notLoggedInForm = new Public.Form()
    
    //
    // Initialization
    //

	var channel = application.globals.get('savory.feature.contactUs.channel')
	var siteName = application.globals.get('savory.feature.contactUs.site')
	
	return Public
}()
