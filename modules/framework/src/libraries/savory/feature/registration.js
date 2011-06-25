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

document.executeOnce('/savory/service/authentication/')
document.executeOnce('/savory/service/notification/')
document.executeOnce('/savory/service/internationalization/')
document.executeOnce('/savory/integration/backend/re-captcha/')
document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/classes/')
document.executeOnce('/savory/foundation/mail/')
document.executeOnce('/savory/foundation/templates/')
document.executeOnce('/savory/foundation/prudence/resources/')
document.executeOnce('/savory/foundation/prudence/logging/')
document.executeOnce('/mongo-db/')

var Savory = Savory || {}

/**
 * This feature allows for new users to add themselves to the {@link Savory.Authentication} service
 * without anyone else's intervention. The process is as follows:
 * <ol>
 * <li>The user fills in a form with some basic information required to create the user, most importantly
 * a username, a password and an email address. The form contains a reCAPTCHA to avoid spam. The user
 * is created in the database in "unconformed" state for now, and the {@link Savory.Authentication} service will
 * not let the user login yet. Why store this record? This guarantees that no other new users would be able to
 * take the name, and also provides a convenient placeholder until confirmation happens. A cron task makes sure to
 * delete these entries after a while (one week by default) if they are not confirmed, so that non-validated
 * usernames can be freed again.</li>
 * <li>An email is sent to the user requiring them to confirm registration. (The {@link Savory.Notification}
 * service is used for this.)</li>
 * <li>If the user clicks the link in the email, their user will become "confirmed". This confirmation can
 * happen once and only once. Why introduce this extra step? This allows us to make sure that the user is truly
 * the owner of this email address, thus mailing it more difficult for spammers to use your site as a way to spam
 * other email addresses.
 * </li>
 * <li>A welcome email is sent to the user. And that's it!</li>
 * </ol>

 * <h1>Installation</h1>
 * To install this feature, you will need to call {@link Savory.Registration#settings} in your application's
 * settings.js and {@link Savory.Registration#routing} from your routing.js.
 * 
 * <h1>Configuration</h1>
 * Set the following application globals:
 * <ul>
 * <li><em>savory.feature.registration.site:</em> the site name as it appears in the form and in notifications</li>
 * <li><em>savory.feature.registration.from:</em> the email address from which notifications are sent</li>
 * <li><em>savory.feature.registration.uri:</em> the relative URL in your application where the registration page will
 * be made available</li>
 * </ul>
 * 
 * <h1>Internationalization</h1>
 * Set the following keys in the {@link Savory.Internationalization.Pack}:
 * <ul>
 * <li><em>savory.feature.registration.form.success</em></li>
 * <li><em>savory.feature.registration.form.invalid.email</em></li>
 * <li><em>savory.feature.registration.form.invalid.username</em></li>
 * <li><em>savory.feature.registration.form.invalid.password</em></li>
 * <li><em>savory.feature.registration.form.invalid.password2</em></li>
 * <li><em>savory.feature.registration.form.invalid.humanity</em></li>
 * <li><em>savory.feature.registration.form.invalid.usernameUsed</em></li>
 * <li><em>savory.feature.registration.confirmation.success</em></li>
 * <li><em>savory.feature.registration.confirmation.invalid</em></li>
 * <li><em>savory.feature.registration.message.registration:</em> a {@link Savory.Mail.MessageTemplate}</li>
 * <li><em>savory.feature.registration.message.welcome:</em> a {@link Savory.Mail.MessageTemplate}</li>
 * </ul>  
 * 
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Registration = Savory.Registration || function() {
	/** @exports Public as Savory.Registration */
    var Public = {}

	/**
	 * The library's logger.
	 *
	 * @field
	 * @returns {Savory.Logging.Logger}
	 */
	Public.logger = Savory.Logging.getLogger('registration')

	/**
	 * Installs the library's pass-throughs.
	 * <p>
	 * Can only be called from Prudence configuration scripts!
	 */
	Public.settings = function() {
		dynamicWebPassThrough.push('/savory/feature/registration/')
	}

	/**
	 * Installs the library's captures.
	 * <p>
	 * Can only be called from Prudence configuration scripts!
	 */
    Public.routing = function() {
    	var uri = predefinedGlobals['savory.feature.registration.uri']
    	uri = (Savory.Objects.isArray(uri) && uri.length > 1) ? uri[1] : '/registration/'
		router.captureAndHide(uri, '/savory/feature/registration/')
	}
	
    /**
     * The site name as it appears in the form and in notifications.
     * 
     * @returns {String}
     */
    Public.getSiteName = function() {
		return siteName
	}
	
    /**
     * Creates a new user document in the MongoDB users collection, properly encrypting the password,
     * and sends a confirmation email to the user, which contains a unique validation link.
     * 
     * @see Savory.Authentication#encryptPassword
     * @returns {Boolean} True if the user created, false if the username is already taken
     */
    Public.register = function(email, name, password) {
		var salt = Savory.Authentication.createPasswordSalt()
		
		var user = {
			_id: MongoDB.newId(),
			name: name,
			password: Savory.Authentication.encryptPassword(password, salt),
			passwordSalt: salt,
			email: email,
			created: new Date()
		}
		
		try {
			usersCollection.insert(user, 1)
			
			Savory.Notification.queueForReference('Email', {type: 'user', id: user._id}, registrationMessageTemplate.cast({
				link: Savory.Resources.buildUri(registrationUri, {'confirm-registration': user._id}),
				siteName: siteName,
				username: name
			}), from)
			
			Public.logger.info('Queued registration email to {0}', email)
			return true
		}
		catch (x if x.code == MongoDB.Error.DuplicateKey) {
			return false
		}
	}

    /**
     * Confirms a user by its ID.
     * 
     * @param {String} id
     */
    Public.confirm = function(id) {
		var result = usersCollection.update({
			_id: id,
			confirmed: {$exists: false}
		}, {
			$set: {
				confirmed: new Date()
			}
		}, false, 1)
		
		//Public.logger.dump(result)
		
		if (result && (result.n == 1)) {
			var user = Savory.Authentication.getUserById(id)

			Savory.Notification.queueForReference('Email', {type: 'user', id: id}, welcomeMessageTemplate.cast({
				siteName: siteName,
				username: user.getName(),
				link: Savory.Authentication.getUri()
			}), from)
			
			Public.logger.info('Queued welcome email to {0}', user.getEmail())
			return true
		}
		
		return false
	}

	/**
     * Manages the registration form.
     * <p>
     * The relevant fragments can be found at /web/fragments/savory/feature/registration/form/.
     * 
	 * @class
	 * @name Savory.Registration.Form
	 */
    Public.Form = Savory.Classes.define(function(Module) {
    	/** @exports Public as Savory.Registration.Form */
        var Public = {}

        /** @ignore */
    	Public._construct = function(document, conversation) {
    		this.reCaptcha = new Savory.ReCAPTCHA()
    		this.conversation = conversation
    		conversation.locals.put('savory.feature.registration.form', this)
        }
        
        Public.getStatusText = function() {
			var status = this.conversation.locals.get('savory.feature.registration.status')
			return status || ''
		}

		Public.validate = function() {
			var form = Savory.Resources.getForm(this.conversation, {
				email: 'string',
				username: 'string',
				password: 'string',
				password2: 'string'
			})
			
			if (!form.email || !Savory.Mail.isAddressValid(form.email)) {
				conversation.locals.put('savory.feature.registration.status', textPack.get('savory.feature.registration.form.invalid.email'))
				return null
			}
			if (!form.username) {
				conversation.locals.put('savory.feature.registration.status', textPack.get('savory.feature.registration.form.invalid.username'))
				return null
			}
			if (!form.password) {
				conversation.locals.put('savory.feature.registration.status', textPack.get('savory.feature.registration.form.invalid.password'))
				return null
			}
			if (form.password != form.password2) {
				conversation.locals.put('savory.feature.registration.status', textPack.get('savory.feature.registration.form.invalid.password2'))
				return null
			}
			if (!this.reCaptcha.validate(this.conversation)) {
				conversation.locals.put('savory.feature.registration.status', textPack.get('savory.feature.registration.form.invalid.humanity'))
				return null
			}
			
			return form
		}
		
		Public.render = function() {
			switch (String(this.conversation.request.method)) {
				case 'GET':
					var confirmRegistration = this.conversation.query.get('confirm-registration')
					if (confirmRegistration) {
						var userId = MongoDB.id(confirmRegistration)
						if (Module.confirm(userId)) {
							this.conversation.locals.put('savory.feature.registration.status', textPack.get('savory.feature.registration.confirmation.success', {loginUri: Savory.Authentication.getUri()}))
						}
						else {
							this.conversation.locals.put('savory.feature.registration.status', textPack.get('savory.feature.registration.confirmation.invalid'))
						}
					
						document.include('/savory/feature/registration/form/status/')
						return
					}
					break
			
				case 'POST':
					switch (String(this.conversation.form.get('action'))) {
						case 'savory.feature.registration.register':
							var form = this.validate()
							
							if (form) {
								if (Module.register(form.email, form.username, form.password)) {
									this.conversation.locals.put('savory.feature.registration.status', textPack.get('savory.feature.registration.form.success'))
									document.include('/savory/feature/registration/form/status/')
									return
								}
								else {
									this.conversation.locals.put('savory.feature.registration.status', textPack.get('savory.feature.registration.form.invalid.usernameUsed'))
								}
							}
							
							break
					}
					break
			}
			
			document.include('/savory/feature/registration/form/')
		}
		
		return Public
	}(Public))
    
    //
    // Initialization
    //
	
	var textPack
	try {
		textPack = Savory.Internationalization.getCurrentPack(conversation)
	}
	catch (x) {
		// No conversation
	}

	var usersCollection
	try {
		usersCollection = new MongoDB.Collection('users')
		usersCollection.ensureIndex({name: 1}, {unique: true})
	}
	catch (x) {
		// MongoDB has not been initialized, and that's OK!
	}

	var from = application.globals.get('savory.feature.registration.from')
	var siteName = application.globals.get('savory.feature.registration.site')
	var registrationUri = Savory.Objects.string(application.globals.get('savory.feature.registration.uri'))
	
	var registrationMessageTemplate
	var welcomeMessageTemplate
	if (textPack) {
		registrationMessageTemplate = new Savory.Mail.MessageTemplate(textPack, 'savory.feature.registration.message.registration')
		welcomeMessageTemplate = new Savory.Mail.MessageTemplate(textPack, 'savory.feature.registration.message.welcome')
	}
	
	return Public
}()
