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
document.executeOnce('/savory/foundation/mail/')
document.executeOnce('/savory/foundation/localization/')
document.executeOnce('/savory/foundation/objects/')

Savory = Savory || {Notification: {Service: {}}}

/**
 * @class
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Notification.Service.Email = Savory.Notification.Service.Email || Savory.Classes.define(function() {
	/** @exports Public as Savory.Notification.Service.Email */
    var Public = {}

    /** @ignore */
    Public._construct = function(config) {
    	Savory.Objects.merge(this, config, ['name', 'form', 'site'])
    	
    	this.name = this.name || 'Email'
    	this.smtp = new Savory.Mail.SMTP()
    }

    Public.getName = function() {
		return this.name
	}

    Public.send = function(from, to, notice) {
		Savory.Notification.logger.info('Sending email from {0} to {1}', this.from || from, to)
		this.smtp.send({from: this.from || from, to: to, replyTo: from}, notice)
	}
	
    Public.sendDigest = function(from, to, entries, mode) {
		var text = []
		for (var e in entries) {
			var entry = entries[e]
			text.push('{channel} on {timestamp}\nRe: {subject}\n\n{text}'.cast({
				timestamp: entry.timestamp.format(Savory.Localization.getDateTimeFormat()),
				channel: entry.channel.capitalize(),
				subject: entry.notice.subject,
				text: entry.notice.text
			}))
		}
		
		var notice = {
			subject: '{mode} digest from {siteName}'.cast({mode: mode.capitalize(), siteName: this.site}),
			text: text.join('\n\n+++\n\n')
		}
		
		Savory.Notification.logger.info('Sending {0} digest email from {1} to {2}', mode, this.from || from, to)
		this.smtp.send({from: this.from || from, to: to, replyTo: from}, notice)
	}
	
    Public.getAddress = function(reference, type) {
		switch (String(type)) {
			case 'user':
				return reference.getEmail()
			
			default:
				Savory.Notification.logger.warning('Unsupported reference type: ' + type)
				return null
		}
	}
	
	return Public
}())
