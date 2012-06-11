//
// This file is part of the Savory Framework for Prudence
//
// Copyright 2011 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the LGPL version 3.0:
// http://www.gnu.org/copyleft/lesser.html
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
document.executeOnce('/prudence/resources/')
document.executeOnce('/sincerity/classes/')
document.executeOnce('/sincerity/mail/')
document.executeOnce('/sincerity/objects/')

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
 * <li><em>savory.feature.contactUs.message:</em> a {@link Sincerity.Mail.MessageTemplate}</li>
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
     * @augments Prudence.Resources.Form
     */
	Public.Form = Sincerity.Classes.define(function(Module) {
		/** @exports Public as Savory.ContactUs.Form */
	    var Public = {}

	    /** @ignore */
	    Public._inherit = Prudence.Resources.Form
	    
	    /** @ignore */
	    Public._configure = ['hasUser', 'conversation']
	    
	    /** @ignore */
		Public._construct = function(config) {
			this.reCaptcha = this.reCaptcha || new Savory.ReCAPTCHA() // required by 'reCaptcha' field type

			if (!Sincerity.Objects.exists(this.fields)) {
        		if (Sincerity.Objects.exists(this.conversation)) {
        	    	var session = Savory.Authentication.getCurrentSession(this.conversation)
        	    	this.hasUser = session ? session.getUser() : null
        		}
	    	
		    	if (this.hasUser) {
					this.fields = {
						message: {
							required: true,
							sencha: {
								xtype: 'textareafield'
							}
						}
					}
		    	}
		    	else {
					this.fields = {
						email: {
							type: 'email',
							required: true
						}, 
						message: {
							required: true,
							sencha: {
								xtype: 'textareafield'
							}
						},
						recaptcha_response_field: {
							type: 'reCaptcha',
							code: this.reCaptcha.getPublicKey(),
							required: true
						},
						recaptcha_challenge_field: {
							type: 'reCaptchaChallenge',
							required: true
						}
					}
		    	}
		    	
        		if (Sincerity.Objects.exists(this.conversation)) {
        			var textPack = Savory.Internationalization.getCurrentPack(this.conversation)
        			this.fields.message.label = textPack.get('savory.feature.contactUs.form.label.message')
        			if (!this.hasUser) {
	        			this.fields.email.label = textPack.get('savory.feature.contactUs.form.label.email')
	        			this.fields.recaptcha_response_field.label = textPack.get('savory.feature.registration.form.label.recaptcha_response_field')
        			}
    				delete this.conversation // this really shouldn't be kept beyond construction
        		}
        	}

			this.includeDocumentName = this.includeDocumentName || '/savory/feature/contact-us/form/'
			this.includeSuccessDocumentName = this.includeSuccessDocumentName || '/savory/feature/contact-us/form/success/'
			
			Module.Form.prototype.superclass.call(this, this)
		}

    	Public.process = function(results, conversation) {
    		if (results.success) {
				var address = Prudence.Resources.getClientAddress(conversation)
				var session = Savory.Authentication.getCurrentSession(conversation)
				var user = session ? session.getUser() : null
				var email = user ? user.getEmail() : results.values.email
				var textPack = Savory.Internationalization.getCurrentPack(conversation)
				var messageTemplate = new Sincerity.Mail.MessageTemplate(textPack, 'savory.feature.contactUs.message')
	
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
