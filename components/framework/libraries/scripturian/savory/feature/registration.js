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

document.executeOnce('/savory/service/authentication/')
document.executeOnce('/savory/service/notification/')
document.executeOnce('/savory/service/internationalization/')
document.executeOnce('/savory/integration/backend/re-captcha/')
document.executeOnce('/sincerity/objects/')
document.executeOnce('/sincerity/classes/')
document.executeOnce('/sincerity/mail/')
document.executeOnce('/sincerity/templates/')
document.executeOnce('/prudence/resources/')
document.executeOnce('/prudence/logging/')
document.executeOnce('/mongo-db/')

var Savory = Savory || {}

/**
 * This feature allows for new users to add themselves to the {@link Savory.Authentication} service
 * without anyone else's intervention. The process is as follows:
 * <ol>
 * <li>The user fills in a form with some basic information required to create the user, most importantly
 * a username, a password and an email address. The form contains a reCAPTCHA to avoid spam. The user
 * is created in the database in "unconfirmed" state for now, and the {@link Savory.Authentication} service will
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
 * <li><em>savory.feature.registration.message.registration:</em> a {@link Sincerity.Mail.MessageTemplate}</li>
 * <li><em>savory.feature.registration.message.welcome:</em> a {@link Sincerity.Mail.MessageTemplate}</li>
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
	 * @returns {Prudence.Logging.Logger}
	 */
	Public.logger = Prudence.Logging.getLogger('registration')

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
    	uri = (Sincerity.Objects.isArray(uri) && uri.length > 1) ? uri[1] : '/registration/'
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
     * Creates a new user document in the MongoDB users collection, properly encrypting and salting the password,
     * and sends a confirmation email to the user, which contains a unique validation link.
     *
     * @param {String} email The user's email
     * @param {String} name The user's name (must be unique for registration to succeed)
     * @param {String} password The user's password
     * @param conversation The Prudence conversation
     * @see Savory.Authentication#encryptPassword
     * @returns {Boolean} True if the user created, false if the username is already taken
     */
    Public.register = function(email, name, password, conversation) {
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
			
			var textPack = Savory.Internationalization.getCurrentPack(conversation)
			var registrationMessageTemplate = new Sincerity.Mail.MessageTemplate(textPack, 'savory.feature.registration.message.registration')

			Savory.Notification.queueForReference('Email', {type: 'user', id: user._id}, registrationMessageTemplate.cast({
				link: Prudence.Resources.buildUri(registrationUri, {'confirm-registration': user._id}),
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
     * @param {String} id The confirmation ID
     * @param conversation The Prudence conversation
     */
    Public.confirm = function(id, conversation) {
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

			var textPack = Savory.Internationalization.getCurrentPack(conversation)
			var welcomeMessageTemplate = new Sincerity.Mail.MessageTemplate(textPack, 'savory.feature.registration.message.welcome')

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
     * 
     * @param conversation The Prudence conversation
     * @returns {Boolean} True if confirmation was handled
     */
    Public.handleConfirmation = function(conversation) {
		var confirmRegistration = conversation.query.get('confirm-registration')
		if (confirmRegistration) {
			var userId = MongoDB.id(confirmRegistration)
			var textPack = Savory.Internationalization.getCurrentPack(conversation)
			if (Public.confirm(userId, conversation)) {
				conversation.locals.put('savory.feature.registration.confirmation', textPack.get('savory.feature.registration.confirmation.success', {loginUri: Savory.Authentication.getUri()}))
			}
			else {
				conversation.locals.put('savory.feature.registration.confirmation', textPack.get('savory.feature.registration.confirmation.invalid'))
			}
		
			document.include('/savory/feature/registration/confirmed/')
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
     * @augments Prudence.Resources.Form
	 */
    Public.Form = Sincerity.Classes.define(function(Module) {
    	/** @exports Public as Savory.Registration.Form */
        var Public = {}

	    /** @ignore */
	    Public._inherit = Prudence.Resources.Form

	    /** @ignore */
	    Public._configure = ['conversation']

        /** @ignore */
    	Public._construct = function(config) {
			this.reCaptcha = this.reCaptcha || new Savory.ReCAPTCHA() // required by 'reCaptcha' field type

			if (!Sincerity.Objects.exists(this.fields)) {
				this.fields = {
					email: {
						type: 'email',
						required: true
					}, 
					username: {
						required: true
					},
					password: {
						type: 'password',
						required: true
					},
					password2: {
						type: 'password',
						required: true,
						validator: function(value, field, conversation) {
							var password = conversation.form.get('password')
							return value == password ? true : 'savory.feature.registration.form.validation.passwordDifferent'
						},
						clientValidation: false
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
				
        		if (Sincerity.Objects.exists(this.conversation)) {
        			var textPack = Savory.Internationalization.getCurrentPack(this.conversation)
        			this.fields.email.label = textPack.get('savory.feature.registration.form.label.email')
        			this.fields.username.label = textPack.get('savory.feature.registration.form.label.username')
        			this.fields.password.label = textPack.get('savory.feature.registration.form.label.password')
        			this.fields.password2.label = textPack.get('savory.feature.registration.form.label.password2')
        			this.fields.recaptcha_response_field.label = textPack.get('savory.feature.registration.form.label.recaptcha_response_field')
    				delete this.conversation // this really shouldn't be kept beyond construction
        		}
        	}

			this.includeDocumentName = this.includeDocumentName || '/savory/feature/registration/form/'
			this.includeSuccessDocumentName = this.includeSuccessDocumentName || '/savory/feature/registration/form/success/'
			
			Module.Form.prototype.superclass.call(this, this)
        }

    	Public.process = function(results, conversation) {
    		if (results.success) {
				var textPack = Savory.Internationalization.getCurrentPack(conversation)

				if (!Module.register(results.values.email, results.values.username, results.values.password, conversation)) {
					results.success = false
					results.errors = results.errors || {} 
					results.errors.username = textPack.get('savory.feature.registration.form.validation.usernameUsed')
				}
    		}
    	}
		
		return Public
	}(Public))
    
	/**
	 * @constant
	 * @returns {Savory.Registration.Form}
	 */
	Public.form = new Public.Form()
    
    //
    // Initialization
    //
	
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
	var registrationUri = Sincerity.Objects.string(application.globals.get('savory.feature.registration.uri'))
	
	return Public
}()
