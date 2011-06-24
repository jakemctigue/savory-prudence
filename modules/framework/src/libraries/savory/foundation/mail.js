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

document.executeOnce('/savory/foundation/classes/')
document.executeOnce('/savory/foundation/templates/')
document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/jvm/')

var Savory = Savory || {}

/**
 * Email utilities.
 * Supports mixed-media HTML/plain-text emails.
 * <p>
 * JavaScript-friendly wrapper over JavaMail. 
 *
 * @namespace
 * @requires javax.mail.jar
 * @see Visit <a href="http://www.oracle.com/technetwork/java/javamail/">JavaMail</a>
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Mail = Savory.Mail || function() {
	/** @exports Public as Savory.Mail */
    var Public = {}

	/**
	 * True if the email address is valid.
	 * 
	 * @param address The email address to check
	 * @returns {Boolean}
	 */
	Public.isAddressValid = function(address) {
		return address ? emailRegExp.test(address) : false
	}
	
	/**
	 * Arguments can be either:
	 * a dict of templates: {subject:'', text:'', html:''},
	 * or (textPack, prefix): where subject, text and html will be taken from the
	 * {@link Savory.Internationalization.Pack} as prefix+'.subject', prefix+'.text' and prefix+'.html'.
	 * <p>
	 * In both cases the 'html' template is optional.
	 * 
	 * @class
	 * @name Savory.Mail.MessageTemplate
	 */
	Public.MessageTemplate = Savory.Classes.define(function() {
		/** @exports Public as Savory.Mail.MessageTemplate */
	    var Public = {}
	    
	    /** @ignore */
	    Public._construct = function(/* arguments */) {
			if (arguments.length == 2) {
				var textPack = arguments[0]
				var prefix = arguments[1]
				this.templates = {
					subject: textPack.get(prefix + '.subject'),
					text: textPack.get(prefix + '.text'),
					html: textPack.getOrNull(prefix + '.html')
				}
			}
			else {
				this.templates = argmuents[0]
			}
	    }
	    
		/**
		 * Casts the subject, text and html templates with the filling.
		 * 
		 * @see Templates#cast
		 */
		Public.cast = function(filling) {
			var message = {
				subject: this.templates.subject.cast(filling),
				text: this.templates.text.cast(filling)
			}
			if (this.templates.html) {
				message.html = this.templates.html.cast(filling)
			}
			return message
		}
		
		return Public
	}())
	
	/**
	 * An SMTP host.
	 * 
	 * @class
	 * @name Savory.Mail.SMTP
	 * 
	 * @param [host='127.0.0.1'] The IP address of the SMTP host
	 */
	Public.SMTP = Savory.Classes.define(function() {
		/** @exports Public as Savory.Mail.SMTP */
	    var Public = {}
	    
	    /** @ignore */
	    Public._construct = function(host) {
			host = host || application.globals.get('savory.foundation.mail.smtp.host') || '127.0.0.1'
			this.session = javax.mail.Session.getInstance(Savory.JVM.toProperties({
				'mail.transport.protocol': 'smtp',
				'mail.smtp.host': host
			}))
	    }

	    /**
		 * Sends an email via SMTP.
		 * 
		 * @param params
		 * @param {String} params.from The email address of the sender
		 * @param {String|String[]} params.to One or more recipient email addresses
		 * @param [params.replyTo] The email address to use for replying
		 * @param message The message to send
		 * @param message.subject
		 * @param message.text
		 * @param [message.html]
		 */
		Public.send = function(params, message) {
			var mimeMessage = new javax.mail.internet.MimeMessage(this.session)
			
			mimeMessage.setFrom(new javax.mail.internet.InternetAddress(params.from))
			mimeMessage.subject = message.subject

			params.to = Savory.Objects.array(params.to)
			for (var t in params.to) {
				mimeMessage.addRecipient(javax.mail.Message.RecipientType.TO, new javax.mail.internet.InternetAddress(params.to[t]))
			}

			params.replyTo = Savory.Objects.array(params.replyTo)
			var replyTo = []
			for (var r in params.replyTo) {
				replyTo.push(new javax.mail.internet.InternetAddress(params.replyTo[r]))
			}
			if (replyTo.length) {
				mimeMessage.replyTo = Savory.JVM.toArray(replyTo, 'javax.mail.Address')
			}
			
			if (!message.html) {
				// Simple text message
				mimeMessage.setText(message.text, 'UTF-8')
			}
			else {
				// Multipart message with alternatives
				var textPart = new javax.mail.internet.MimeBodyPart()
				textPart.setText(message.text, 'UTF-8')
				
				var htmlPart = new javax.mail.internet.MimeBodyPart()
				htmlPart.setText(message.html, 'UTF-8', 'html')
				
				var multipart = new javax.mail.internet.MimeMultipart('alternative')
				multipart.addBodyPart(textPart)
				multipart.addBodyPart(htmlPart)
				
				mimeMessage.setContent(multipart)
			}
			
			javax.mail.Transport.send(mimeMessage)
		}

		return Public
	}())
    
    //
    // Initialization
    //

	// See: http://fightingforalostcause.net/misc/2006/compare-email-regex.php
	var emailRegExp = /^([\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+\.)*[\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+@((((([a-z0-9]{1}[a-z0-9\-]{0,62}[a-z0-9]{1})|[a-z])\.)+[a-z]{2,6})|(\d{1,3}\.){3}\d{1,3}(\:\d{1,5})?)$/i
	
	return Public
}()
