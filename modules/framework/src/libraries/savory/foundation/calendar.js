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

var Savory = Savory || {}

/**
 * Date utilities.
 * <p>
 * Note: This library modifies the Date prototype.
 * 
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Calendar = Savory.Calendar || function() {
	/** @exports Public as Savory.Calendar */
    var Public = {}

	/**
	 * True if the date is today.
	 * 
	 * @param {Date} date
	 * @param {Date} [now=new Date()]
	 * @returns {Boolean}
	 */ 
	Public.isToday = function(date, now) {
		now = now || new Date()
		return (date.getFullYear() == now.getFullYear()) && (date.getMonth() == now.getMonth()) && (date.getDate() == now.getDate())
	}
	
	/**
	 * True if the date is yesterday.
	 * 
	 * @param {Date} date
	 * @param {Date} [now=new Date()]
	 * @returns {Boolean}
	 */ 
	Public.isYesterday = function(date, now) {
		now = now || new Date()
		now = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
		return Public.isToday(date, now)
	}
	
	/**
	 * True if the date is tomorrow.
	 * 
	 * @param {Date} date
	 * @param {Date} [now=new Date()]
	 * @returns {Boolean}
	 */ 
	Public.isTomorrow = function(date, now) {
		now = now || new Date()
		now = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
		return Public.isToday(date, now)
	}
	
	/**
	 * True if the date is this year.
	 * 
	 * @param {Date} date
	 * @param {Date} [now=new Date()]
	 * @returns {Boolean}
	 */ 
	Public.isThisYear = function(date, now) {
		now = now || new Date()
		return date.getFullYear() == now.getFullYear()
	}

	/**
	 * Creates a date in either this month or next month with the required day of month.
	 * 
	 * @param {Number} dayOfMonth The day of the month to look for
	 * @param {Date} time The time of day to use
	 * @param {Date} [now=new Date()]
	 * @returns {Date}
	 */ 
	Public.closestDayOfMonth = function(dayOfMonth, time, now) {
		now = now || new Date()
		
		var date = new Date(
			now.getFullYear(),
			now.getMonth(),
			dayOfMonth,
			time.getHours(),
			time.getMinutes(),
			time.getSeconds(),
			time.getMilliseconds()
		)
		
		if (date < now) {
			date = new Date(
				now.getFullYear(),
				now.getMonth() + 1,
				dayOfMonth,
				time.getHours(),
				time.getMinutes(),
				time.getSeconds(),
				time.getMilliseconds()
			)
		}
		
		return date
	}
    
    return Public
}()

/**
 * True if the date is today.
 * 
 * @methodOf Date#
 * @param {Date} [now=new Date()]
 * @returns {Boolean}
 * @see Savory.Calendar#isToday
 */ 
Date.prototype.isToday = Date.prototype.isToday || function(now) {
	return Savory.Calendar.isToday(this, now)
}

/**
 * True if the date is yesterday.
 * 
 * @methodOf Date#
 * @param {Date} [now=new Date()]
 * @returns {Boolean}
 * @see Savory.Calendar#isYesterday
 */ 
Date.prototype.isYesterday = Date.prototype.isYesterday || function(now) {
	return Savory.Calendar.isYesterday(this, now)
}

/**
 * True if the date is tomorrow.
 * 
 * @methodOf Date#
 * @param {Date} [now=new Date()]
 * @returns {Boolean}
 * @see Savory.Calendar#isTomorrow
 */ 
Date.prototype.isTomorrow = Date.prototype.isTomorrow || function(now) {
	return Savory.Calendar.isTomorrow(this, now)
}

/**
 * True if the date is this year.
 * 
 * @methodOf Date#
 * @param {Date} [now=new Date()]
 * @returns {Boolean}
 * @see Savory.Calendar#isThisYear
 */ 
Date.prototype.isThisYear = Date.prototype.isThisYear || function(now) {
	return Savory.Calendar.isThisYear(this, now)
}
