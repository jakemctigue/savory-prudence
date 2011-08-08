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

Ext.namespace('Savory', 'Savory.ExtendedJSON', 'Savory.data');

/**
 * Deep cloning.
 */
Savory.clone = function(o) {
	if ((o === null) || Ext.isPrimitive(o) || Ext.isFunction(o)) {
		return o;
	}
	else if (Ext.isDate(o)) {
		var c = new Date();
		c.setTime(o.getTime());
		return c;
	}
	else if (Ext.isArray(o)) {
		var c = [];
		for (var i = 0, l = o.length; i < l; i++) {
			c.push(Savory.clone(o[i]));
		}
		return c;
	}
	else {
		if (o.hasOwnProperty('asIs')) {
			return o.asIs;
		}
		else {
			var c = {};
			for (var k in o) {
				if (o.hasOwnProperty(k)) {
					c[k] = Savory.clone(o[k]);
				}
			}
			return c;
		}
	}
}

/**
 * Recursively unpack MongoDB's extended JSON into JavaScript types.
 * 
 * @param json The packed structure
 * @returns The unpacked structure
 */
Savory.ExtendedJSON.unpack = function(json) {
	if (Ext.isArray(json)) {
		for (var j = 0, length = json.length; j < length; j++) {
			json[j] = Savory.ExtendedJSON.unpack(json[j]);
		}
	}
	else if (Ext.isObject(json)) {
		if (json.$oid !== undefined) {
			// Leave as is
			return json;
		}
		
		if (json.$long !== undefined) {
			// TODO: Is this a good idea? It would probably be best to plug into
			// a JavaScript BigNumber library
			return Number(json.$long);
		}
		
		if (json.$date !== undefined) {
			var timestamp = json.$date.$long !== undefined ? json.$date.$long : json.$date;
			return new Date(Number(timestamp));
		}
		
		if (json.$regex !== undefined) {
			return json.$options ? new RegExp(json.$regex, json.$options) : new RegExp(json.$regex)
		}
		
		for (var k in json) {
			json[k] = Savory.ExtendedJSON.unpack(json[k]);
		}
	}

	return json;
};

/**
 * Recursively pack JavaScript types into MongoDB's extended JSON notation.
 * 
 * @param data The unpacked structure
 * @returns The packed structure
 */
Savory.ExtendedJSON.pack = function(data) {
	if (Ext.isArray(data)) {
		for (var d = 0, length = data.length; d < length; d++) {
			data[d] = Savory.ExtendedJSON.pack(data[d]);
		}
	}
	else if (Ext.isObject(data)) {
		if (Ext.isDate(data)) {
			return {$date: data.getTime()};
		}	
		
		if (data instanceof RegExp) {
			var options = '';
			if (data.global) {
				options += 'g'
			}
			if (data.ignoreCase) {
				options += 'i'
			}
			if (data.multiline) {
				options += 'm'
			}
			return options.length ? {$regex: data.source, $options: options} : {$regex: data.source};
		}

		for (var d in data) {
			data[d] = Savory.ExtendedJSON.pack(data[d]);
		}
	}

	return data;
};

/**
 * A reader that unpacks MongoDB's extended JSON notation.
 * <p>
 * Additionally, it fixes a few bugs with Sencha Touch.
 * <p>
 * Registers the reader type 'extended-json'.
 */
Savory.data.ExtendedJsonReader = Ext.extend(Ext.data.JsonReader, {
	constructor: function(config) {
		config = Ext.apply({
			root: 'records'
		}, config);
		Savory.data.ExtendedJsonReader.superclass.constructor.call(this, config);
	},
	
	readRecords: function(data) {
		data = Savory.ExtendedJSON.unpack(data);
		return Savory.data.ExtendedJsonReader.superclass.readRecords.call(this, data);
	},
	
	// This is necessary because Sencha Touch 1.1.0 does not create the implicit model correctly
	// (store.remove won't work without a correct idProperty)
	onMetaChange: function(meta) {
		var fields = meta.fields, idProperty = meta.idProperty, newModel;
		
		Ext.apply(this, meta);
		
		if (fields) {
			newModel = {
				fields: fields
			};
			if (idProperty) {
				newModel.idProperty = idProperty; // This is what was missing from Sencha Touch 1.1.0!
			}
			newModel = new Ext.regModel('Savory.data.ImplicitModel-' + Ext.id(), newModel);
			this.setModel(newModel, true);
		}
		else {
			this.buildExtractors(true);
		}
	}	
});

Ext.data.ReaderMgr.registerType('extended-json', Savory.data.ExtendedJsonReader);

/**
 * A writer that packs JavaScript types into MongoDB's extended JSON notation.
 * <p>
 * Registers the writer type 'extended-json'.
 */
Savory.data.ExtendedJsonWriter = Ext.extend(Ext.data.JsonWriter, {
	getRecordData: function(record) {
		data = Savory.data.ExtendedJsonWriter.superclass.getRecordData.call(this, record);
		data = Savory.ExtendedJSON.pack(data);
		return data;
	}
});

Ext.data.WriterMgr.registerType('extended-json', Savory.data.ExtendedJsonWriter);

/**
 * A REST proxy that uses a {@link Savory.data.ExtendedJsonReader} and a
 * {@link Savory.data.ExtendedJsonWriter}.
 * <p>
 * Sencha Touch's RESTful actions are changed: POST is used for 'update' and
 * PUT is used for 'create'. This adheres more correctly to REST principles
 * (POST is the only non-idempotent HTTP action). 
 * <p>
 * Registers the proxy type 'savory'.
 */
Savory.data.Proxy = Ext.extend(Ext.data.RestProxy, {
	constructor: function(config) {
		config = Ext.apply({
			actionMethods: {
				create : 'PUT',
				read   : 'GET',
				update : 'POST',
				destroy: 'DELETE'
			},
			reader: new Savory.data.ExtendedJsonReader(config.reader | {}),
			writer: new Savory.data.ExtendedJsonWriter(config.writer | {}),
			noCache: false,
			appendId: false,
			headers: {
				Accept: 'application/json'
			}
		}, config);
		Savory.data.Proxy.superclass.constructor.call(this, config);
	}
});

Ext.data.ProxyMgr.registerType('savory', Savory.data.Proxy);

/**
 * A store that uses a {@link Savory.data.Proxy}.
 */
Savory.data.Store = Ext.extend(Ext.data.Store, {
	constructor: function(config) {
		config.proxy = Ext.apply({
			type: 'savory'
		}, config.proxy);
		Savory.data.Store.superclass.constructor.call(this, config);
	},
	
	getTotalCount: function() {
		// getTotalCount() does not seem to exist in Sencha Touch 1.1.0, despite being mentioned in the docs :/
		return this.proxy.reader.jsonData.total
	}
});

/**
 * Adds a card to a container using a slide-in animation.
 * 
 * @param {String|Ext.Component} container The container component (must have a card layout)
 * @param {String|Ext.Component} card The component to slide in
 * @param {Boolean} [slideOutOnSwipe=false] True to slide out the card on right-swipe
 * @param {Boolean} [destroyOnSlideOut=false] True to destroy the card on right-swipe slide-out
 */
Savory.slideIn = function(container, card, slideOutOnSwipe, destroyOnSlideOut) {
	container = typeof container == 'string' ? Ext.getCmp(container) : container;
	card = typeof card == 'string' ? Ext.getCmp(card) : card;
	
	if (slideOutOnSwipe) {
		card.on('render', function() {
			this.card.getEl().on('swipe', function(event) {
				if (event.direction == 'right') {
					Savory.slideOut(this.container, this.card, this.destroyOnSlideOut)
				}
			}, this, {single: true});
		}, {
			container: container,
			card: card,
			destroyOnSlideOut: destroyOnSlideOut
		}, {
			single: true
		});
	}

	container.setActiveItem(card, {type: 'slide', direction: 'left'});
}

/**
 * Removes a card from a container using a slide-out animation.
 * 
 * @param {String|Ext.Component} container The container component (must have a card layout)
 * @param {String|Ext.Component} card The component to slide out
 * @param {Boolean} [destroy=false] True to destroy the card after it's removed
 */
Savory.slideOut = function(container, card, destroy) {
	container = typeof container == 'string' ? Ext.getCmp(container) : container;
	card = typeof card == 'string' ? Ext.getCmp(card) : card;
	
	card.on('deactivate', function() {
		this.container.remove(this.card, this.destroy);
	}, {
		container: container,
		card: card,
		destroy: destroy
	}, {
		single: true,
		delay: 50
	});
	container.getLayout().prev({type: 'slide', direction: 'right'});
}


/**
 * A useful {@link Ext.data.Store} paging toolbar. In essence a simpler version of the paging toolbar in Ext JS.
 * <p>
 * Registers the xtype 'paging'.
 * 
 * @see Savory.ListPagingPlugin
 */
Savory.PagingToolbar = Ext.extend(Ext.Toolbar, {
	constructor: function(config) {
		config = Ext.apply({
			layout: {
				pack: 'center'
			},
			items: [{
				iconMask: true,
				iconCls: 'arrow_left',
				handler: Ext.createDelegate(function() {
					this.page(false);
				}, this)
			}, {
				id: 'page',
				xtype: 'box',
				style: {color: 'white'}
			}, {
				iconMask: true,
				iconCls: 'refresh',
				handler: Ext.createDelegate(this.refresh, this)
			}, {
				iconMask: true,
				iconCls: 'arrow_right',
				handler: Ext.createDelegate(function() {
					this.page(true);
				}, this)
			}]
		}, config);
		Savory.PagingToolbar.superclass.constructor.call(this, config);
		
		this.getStore().on('load', Ext.createDelegate(function(store) {
			this.update(store);
		}, this));
	},
	
	page: function(direction) {
		var store = this.getStore();
		if (direction) {
			var pages = Math.ceil(store.getTotalCount() / store.pageSize);
			if (store.currentPage < pages) {
				store.nextPage();
			}
		}
		else {
			if (store.currentPage > 1) {
				store.previousPage();
			}
		}
		this.update(store);
	},
	
	refresh: function() {
		var store = this.getStore();
		store.load({start: (store.currentPage - 1) * store.pageSize});
	},
	
	update: function(store) {
		store = store || this.getStore();
		var pages = Math.ceil(store.getTotalCount() / store.pageSize);
		Ext.getCmp('page').getEl().setHTML('Page ' + store.currentPage + '/' + pages);
	},
	
	getStore: function() {
		return typeof this.store == 'string' ? Ext.getStore(this.store) : this.store;
	}
});

Ext.reg('paging', Savory.PagingToolbar);

/**
 * A paging plugin for Ext.List that works in tandem with the {@link Savory.PagingToolbar}.
 * It detects scrolling far up or far down on the list and responds as if pressing 'previous
 * page' or 'next page' on the paging toolbar.
 */
Savory.ListPagingPlugin = Ext.extend(Ext.util.Observable, {
    init: function(list) {
		list.on('render', function(list) {
			var scroller = list.getTargetEl().getScrollParent();
			
			scroller.on('scroll', function(scroller, pos) {
				if (pos.y != 0) {
					// Remember last direction for 'scrollend' event
					scroller.direction = pos.y > 0;
				}
			});
			
			scroller.on('scrollend', function(scroller, pos) {
				Ext.getCmp(this.pagingToolbar).page(scroller.direction);
			}, this);
		}, this);
	}
});
