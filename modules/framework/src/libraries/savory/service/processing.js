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

// 1. user-friendly status pages/resources for asynchronous processes, allows for polling, too
// 2. can show current stage of process
// 3. can also send emails when status changes
// 4. can collect all status for a user (for notifications)
// 5. a status can belong to many users
// 6. subscribe?

// "searching... searching... done"
// "you order has been shipped! here is your tracking #"

// uses subscription module: broadcasts on a channel when a status changes

// process: user, description, uri to redirect to when done
// milestones: [{event:.., timestamp:...}, ...] 

// can create a process (REST) on an external server

document.executeOnce('/savory/service/events/')
document.executeOnce('/savory/foundation/classes/')
document.executeOnce('/savory/foundation/prudence/tasks/')
document.executeOnce('/savory/foundation/prudence/logging/')
document.executeOnce('/mongo-db/')

var Savory = Savory || {}

/**
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Processing = Savory.Processing || function() {
	/** @exports Public as Savory.Processing */
    var Public = {}

	/**
	 * The library's logger.
	 *
	 * @field
	 * @returns {Savory.Logging.Logger}
	 */
	Public.logger = Savory.Logging.getLogger('processing')
	
	/**
	 * Installs the library's pass-throughs.
	 * <p>
	 * Can only be called from Prudence configuration scripts!
	 */
	Public.settings = function() {
		dynamicWebPassThrough.push('/savory/service/processing/wait/')
	}

	/**
	 * Installs the library's captures.
	 * <p>
	 * Can only be called from Prudence configuration scripts!
	 */
	Public.routing = function() {
		router.captureAndHide('/wait/{process}/', '/savory/service/processing/wait/')
	}
	
	/**
	 * @returns {Savory.Processing.Process}
	 */
	Public.getProcess = function(key) {
		var context
		if (!key) {
			context = Savory.Tasks.getContext()
			if (context) {
				var processContext = context['savory.process']
				if (processContext) {
					key = processContext.key
				}
			}
		}

		key = MongoDB.id(key)
		var process = Savory.Objects.exists(key) ? processesCollection.findOne({_id: key}) : null
		return process ? new Public.Process(process, context) : null
	}
	
	/**
	 * @returns {Savory.Processing.Process}
	 */
	Public.startProcess = function(params, now) {
		now = now || new Date()

		var process = {
			_id: MongoDB.newId(),
			description: params.description,
			started: now,
			milestones: [{
				name: 'started',
				timestamp: now
			}]
		}

		if (Savory.Objects.exists(params.redirect)) {
			process.redirect = String(params.redirect)
		}

		if (Savory.Objects.exists(params.redirectSuccess)) {
			process.redirectSuccess = String(params.redirectSuccess)
		}

		if (Savory.Objects.exists(params.redirectFailure)) {
			process.redirectFailure = String(params.redirectFailure)
		}

		if (Savory.Objects.exists(params.redirectCancelled)) {
			process.redirectCancelled = String(params.redirectCancelled)
		}

		if (params.maxDuration) {
			process.expiration = new Date(now.getTime()).setMilliseconds(now.getMilliseconds() + params.maxDuration)
		}

		processesCollection.insert(process, 1)
		
		var context
		if (params.task) {
			context = {
				'savory.process': {
					key: String(process._id)
				}
			}
			params.task.context = params.task.context || {}
			Savory.Objects.merge(params.task.context, context)
			Savory.Tasks.task(params.task)
			Savory.Objects.merge(context, {
				'savory.task': params.task
			})
		}
		
		return new Public.Process(process, context)
	}
	
	Public.notifySubscribers = function() {
		// TODO: should be in notification service?
	}
	
	/**
	 * @class
	 * @see Savory.Processing#getProcess
	 * @see Savory.Processing#startProcess
	 */
	Public.Process = Savory.Classes.define(function() {
		/** @exports Public as Savory.Processing.Process */
	    var Public = {}
	    
	    /** @ignore */
	    Public._construct = function(process, context) {
			this.milestones = null
			this.process = process
			this.events = new Savory.Events.MongoDbDocumentStore(processesCollection, process._id, process)
	    }

	    Public.getKey = function() {
			return String(this.process._id)
		}
		
	    Public.getDescription = function() {
			return this.process.description
		}
		
	    Public.getStarted = function() {
			return this.process.started
		}
		
	    Public.getDuration = function(now) {
			now = now || new Date()
			return now - this.process.started				
		}
		
	    Public.getProgress = function(now) {
			if (!this.process.expiration) {
				return null
			}
			
			var max = this.process.expiration - this.process.started
			if (max < 0) {
				return null
			}
			now = now || new Date()
			var duration = Math.min(now - this.process.started, max)
			return duration / max					
		}
		
	    Public.getContext = function() {
			return context
		}
		
	    Public.isActive = function(now) {
			var last = this.getLastMilestone(now)
			if (!last) {
				return false
			}
			return (last.name != 'done') && (last.name != 'failed') && (last.name != 'expired') && (last.name != 'cancelled')
		}
		
	    Public.isSuccess = function(now) {
			var last = this.getLastMilestone(now)
			if (!last) {
				return false
			}
			return last.name == 'done'
		}

		Public.isFailure = function(now) {
			var last = this.getLastMilestone(now)
			if (!last) {
				return false
			}
			return (last.name == 'failed') || (last.name == 'expired')
		}

		Public.isCancelled = function(now) {
			var last = this.getLastMilestone(now)
			if (!last) {
				return false
			}
			return last.name == 'cancelled'
		}

		Public.getMilestones = function(now) {
			if (!this.milestones) {
				this.milestones = this.process.milestones
				this.milestones.sort(compareTimestamps)
			
				if (this.process.expiration) {
					var last = this.milestones.length ? this.milestones[0] : null
					if (last && (last.name != 'expired')) {
						now = now || new Date()
						if (now >= this.process.expiration) {
							Public.logger.info('Process {0} has expired', String(this.process._id))
							this.addMilestone({name: 'expired'})
						}
					}
				}
			}
				
			return milestones
		}
		
		Public.getLastMilestone = function(now) {
			var milestones = this.getMilestones(now)
			return milestones.length ? milestones[0] : null
		}
		
		Public.addMilestone = function(milestone) {
			milestone.timestamp = milestone.timestamp || new Date()
			processesCollection.update({_id: this.process._id}, {
				$addToSet: {
					milestones: milestone
				}
			})

			if (this.milestones) {
				this.milestones.unshift(milestone)
			}

			Public.logger.info('Milestone "{0}" added to {1}', milestone.name, String(this.process._id))

			// TODO: broadcast
		}
		
		Public.remove = function() {
			processesCollection.remove({_id: this.process._id})
		}

		Public.redirectWait = function(conversation) {
			fire.call(this, 'wait', conversation)
			conversation.response.redirectSeeOther('/savory/wait/' + this.getKey() + '/')
			conversation.stop()
		}

		Public.redirectSuccess = function(conversation) {
			fire.call(this, 'success', conversation)
			conversation.response.redirectSeeOther(this.process.redirectSuccess || this.process.redirect || conversation.reference.baseRef)
			conversation.stop()
		}

		Public.redirectFailure = function(conversation) {
			fire.call(this, 'failure', conversation)
			conversation.response.redirectSeeOther(this.process.redirectFailure || this.process.redirect || conversation.reference.baseRef)
			conversation.stop()
		}

		Public.redirectCancelled = function(conversation) {
			fire.call(this, 'cancelled', conversation)
			conversation.response.redirectSeeOther(this.process.redirectCancelled || this.process.redirect || conversation.reference.baseRef)
			conversation.stop()
		}
		
		Public.subscribeRedirect = function(name, fn, scope) {
			Savory.Events.subscribe({
				name: name,
				fn: fn,
				scope: scope,
				stores: this.events
			})
		}
		
		Public.attempt = function(fn) {
			if (!this.isActive()) {
				return
			}

			var context = this.getContext()
			var task = context['savory.task']
			task.attempt = task.attempt == undefined ? 1 : task.attempt

			this.addMilestone({name: 'attempt #' + task.attempt})
			
			if (fn(this, task)) {
				Public.logger.info('Attempt #{0} succeeded for {1} in {2}', task.attempt, String(this.process._id), task.name)
				this.addMilestone({name: 'done'})
			}
			else {
				if (task.attempt < task.maxAttempts) {
					Public.logger.info('Attempt #{0} failed for {1} in {2}, will try again', task.attempt, String(this.process._id), task.name)
					task.attempt++
					task.distributed = false
					Tasks.task(task)
				}
				else {
					Public.logger.info('Attempt #{0} failed for {1} in {2}', task.attempt, String(this.process._id), task.name)
					this.addMilestone({name: 'failed'})
				}
			}
		}
		
		//
		// Private
		//
		
		function fire(name, conversation) {
			Savory.Events.fire({
				name: name,
				context: {
					process: this,
					conversation: conversation
				},
				stores: this.events
			})
		}
		
		return Public
	}())
	
	//
	// Private
	//
	
	function compareTimestamps(m1, m2) {
		return m2.timestamp - m1.timestamp
	}
	
	//
	// Initialization
	//
	
    var processesCollection = new MongoDB.Collection('processes')
	
	return Public
}()
