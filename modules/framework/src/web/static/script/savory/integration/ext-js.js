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

Ext.namespace('Savory', 'Savory.ExtendedJSON');

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
 * 
 */
Savory.addDirectProvider = function(params) {
	var url = params.url || (params.baseUrl + '/savory/integration/frontend/sencha/direct/');
	url += '?namespace=' + encodeURIComponent(params.namespace);
	Ext.Ajax.request({
		url: url,
		method: 'GET',
		disableCaching: false,
		success: function(response) {
			var provider = Ext.decode(response.responseText);
			provider.type = 'remoting';
			provider.url = url;
			Ext.Direct.addProvider(provider);
			if (params.success) {
				params.success(params.namespace, provider);
			}
		},
		failure: function(response) {
			if (params.failure) {
				params.failure(params.namespace);
			}
		}
	});
};

/**
 * A reader that unpacks MongoDB's extended JSON notation.
 * <p>
 * Defines the reader alias 'extended-json'.
 */
Ext.define('Savory.data.reader.ExtendedJson', {
	alias: 'reader.extended-json',
	extend: 'Ext.data.reader.Json',
	
	readRecords: function(data) {
		data = Savory.ExtendedJSON.unpack(data);
		return this.callParent([data]);
	},
	
	// This is necessary because Ext JS 4.0.0 does not create the implicit model correctly
	// (store.remove won't work without a correct idProperty)
	onMetaChange : function(meta) {
		var fields = meta.fields, idProperty = meta.idProperty, newModel;
		
		Ext.apply(this, meta);
		
		if (fields) {
			newModel = {
				extend: 'Ext.data.Model',
				fields: fields
			};
			if (idProperty) {
				newModel.idProperty = idProperty; // This is what was missing from Ext JS 4.0.0!
			}
			newModel = Ext.define('Savory.data.ImplicitModel-' + Ext.id(), newModel);
			this.setModel(newModel, true);
		}
		else {
			this.buildExtractors(true);
		}
	}	
});

/**
 * A writer that packs JavaScript types into MongoDB's extended JSON notation.
 * <p>
 * Defines the writer alias 'extended-json'.
 */
Ext.define('Savory.data.writer.ExtendedJson', {
	alias: 'writer.extended-json',
	extend: 'Ext.data.writer.Json',
	
	getRecordData: function(record) {
		var data = this.callParent([record]);
		data = Savory.ExtendedJSON.pack(data);
		return data;
	}
});

/**
 * A REST proxy that uses a {@link Savory.data.reader.ExtendedJson} and a
 * {@link Savory.data.writer.ExtendedJson}.
 * <p>
 * Ext JS's RESTful actions are changed: POST is used for 'update' and
 * PUT is used for 'create'. This adheres more correctly to REST principles
 * (POST is the only non-idempotent HTTP action). 
 * <p>
 * This also correctly handles exception on the server, behavior which is
 * unfortunately broken in Ext JS 4.0.0.
 * <p>
 * Defines the proxy alias 'savory'.
 * 
 * @param {Ext.data.Store} config.metaStore
 */
Ext.define('Savory.data.proxy.Rest', {
	alias: 'proxy.savory',
	extend: 'Ext.data.proxy.Rest',

	constructor: function(config) {
		config = Ext.apply({
			actionMethods: {
				create : 'PUT',
				read   : 'GET',
				update : 'POST',
				destroy: 'DELETE'
			},
			reader: 'extended-json',
			writer: 'extended-json',
			noCache: false,
			appendId: false,
			headers: {
				Accept: 'application/json'
			}
		}, config);
		
		this.callParent([config]);
		
		this.on('exception', function(proxy, response, operation) {
			// Ext JS 4.0.0 does not handle this exception!
			switch (operation.action) {
				case 'create':
					Ext.each(operation.records, function(record) {
						record.store.remove(record);
					});
					break;
					
				case 'destroy':
					Ext.each(operation.records, function(record) {
						if (record.removeStore) {
							record.removeStore.insert(record.removeIndex, record);
						}
					});
					break;
			}
		});
		
		// We need to call these explicitly for when there is no model
		this.setReader(this.reader);
		this.setWriter(this.writer);
	},
	
	setModel: function(model, setOnStore) {
		this.callParent([model, setOnStore]);
		
		// This is a hack for Ext JS 4.0.0 to make sure that an implicit model
		// is available for the store to use (otherwise store.add won't work)
		if (setOnStore) {
			this.metaStore.model = model;
		}
	}
});

/**
 * A store that uses a {@link Savory.data.proxy.Rest}, making sure to hook
 * it up correctly.
 * <p>
 * It also supports getting a grid column structure from the server, a unique
 * Savory feature.
 */
Ext.define('Savory.data.Store', {
	extend: 'Ext.data.Store',
	
	constructor: function(config) {
		config.proxy = Ext.apply({
			type: 'savory',
			metaStore: this
		}, config.proxy);

		this.callParent([config]);

		// See Savory.data.proxy.Rest for the use of these
		this.on('remove', function(store, record, index) {
			record.removeStore = store;
			record.removeIndex = index;
		});
	},
	
	getColumns: function(callback) {
		Ext.Ajax.request({
			url: this.getProxy().url,
			method: 'GET',
			params: {
				columns: true
			},
			disableCaching: false,
			success: Ext.bind(function(response) {
				var columns = Ext.decode(response.responseText);
				callback(this, columns)
			}, this)
		});
	}
});

//See: http://www.sencha.com/forum/showthread.php?136576-extjs-4.0.2
Ext.form.Basic.override({
	getBoundItems: function() {
		var boundItems = this._boundItems;
		if (!boundItems || boundItems.getCount() == 0) {
			boundItems = this._boundItems = Ext.create('Ext.util.MixedCollection');
			boundItems.addAll(this.owner.query('[formBind]'));
		}
		return boundItems;
	}
});
