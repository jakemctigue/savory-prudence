
document.executeOnce('/sincerity/objects/')
document.executeOnce('/sincerity/classes/')

var OrientDB = OrientDB || function() {
	var Public = {}

	Public.open = function(params) {
		importClass(
			com.orientechnologies.orient.core.db.document.ODatabaseDocumentPool,
			com.orientechnologies.orient.core.db.document.ODatabaseDocumentTx)

		params = params || {}
		params.pool = Sincerity.Objects.ensure(params.pool, true)
		params.username = params.username || 'admin'
		params.password = params.password || 'admin'
		if (params.pool) {
			try {
				return new Public.Database(ODatabaseDocumentPool.global().acquire(params.uri, params.username, params.password))
			}
			catch (x) {
				new ODatabaseDocumentTx(params.uri).create().close()
				return new Public.Database(ODatabaseDocumentPool.global().acquire(params.uri, params.username, params.password))
			}
		}
		else {
			var db = new ODatabaseDocumentTx(params.uri)
			try {
				db.open(params.username, params.password)
			} catch (x) {
				db.create()
			}
			return new Public.Database(db)
		}
	}

	Public.Database = Sincerity.Classes.define(function(Module) {
		var Public = {}

		Public._construct = function(db) {
			this.db = db
		}

		Public.close = function() {
			this.db.close()
		}

		Public.getClass = function(className) {
			return this.db.metadata.schema.getClass(className)
		}

		Public.newDocument = function(className, doc) {
			var instance = this.db.newInstance(className)
			instance.merge(doc, true, true)
			return instance			
		}

		Public.begin = function(type) {
			if (type) {
				type = com.orientechnologies.orient.core.tx.OTransaction.TXTYPE.valueOf(type)
				this.db.begin(type)
			}
			else {
				this.db.begin()
			}
			return this
		}

		Public.commit = function() {
			this.db.commit()
			return this
		}

		Public.rollback = function() {
			this.db.rollback()
			return this
		}

		Public.query = function(sql, params) {
			params = params || {}

			var query = new com.orientechnologies.orient.core.sql.query.OSQLSynchQuery(sql)
			if (params.fetchPlan) {
				query.fetchPlan = params.fetchPlan
			}

			return this.db.query(query)
		}

		Public.execute = function(sql) {
			var command = new com.orientechnologies.orient.core.sql.OCommandSQL(sql)
			return this.db.command(command).execute()
		}

		return Public
	}(Public))

	return Public
}()

