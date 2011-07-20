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

document.executeOnce('/savory/foundation/xml/')
document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/rhino/')
document.executeOnce('/savory/foundation/json/')
document.executeOnce('/savory/foundation/jvm/')
document.executeOnce('/savory/foundation/validation/')
document.executeOnce('/savory/foundation/prudence/logging/')

var Savory = Savory || {}

/**
 * Flexible, JavaScript-friendly wrapper over Prudence's Restlet-based
 * RESTful client, with support for external and internal resources, parsing and
 * packing of JSON, XML, property sheet and web-form formats, as well as direct
 * passing of JVM objects to internal resources with no serialization.
 * 
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.3
 */
Savory.Resources = Savory.Resources || function() {
	/** @exports Public as Savory.Resources */
    var Public = {}

	/**
	 * The library's logger.
	 *
	 * @field
	 * @returns {Savory.Logging.Logger}
	 */
	Public.logger = Savory.Logging.getLogger('resources')
	
	/**
	 * HTTP status codes.
	 * 
	 * @namespace
	 */
	Public.Status = {
		/** @namespace */
		Information: {
			/** @constant */
			Continue: 100,
			/** @constant */
			SwitchingProtocols: 101
		},
		/** @namespace */
		Success: {
			/** @constant */
			OK: 200,
			/** @constant */
			Created: 201,
			/** @constant */
			Accepted: 202,
			/** @constant */
			NonAuthorative: 203,
			/** @constant */
			NoContent: 204,
			/** @constant */
			ResetContent: 205,
			/** @constant */
			PartialContent: 206
		},
		/** @namespace */
		Redirect: {
			/** @constant */
			Multiple: 300,
			/** @constant */
			Permanent: 301,
			/** @constant */
			Found: 302,
			/** @constant */
			SeeOther: 303,
			/** @constant */
			NotModified: 304,
			/** @constant */
			UseProxy: 305,
			/** @constant */
			Temporary: 307
		},
		/** @namespace */
		ClientError: {
			/** @constant */
			BadRequest: 400,
			/** @constant */
			Unauthorized: 401,
			/** @constant */
			PaymentRequired: 402,
			/** @constant */
			Forbidden: 403,
			/** @constant */
			NotFound: 404,
			/** @constant */
			MethodNotAllowed: 405,
			/** @constant */
			NotAcceptable: 406,
			/** @constant */
			ProxyAuthenticationRequired: 407,
			/** @constant */
			RequestTimeout: 408,
			/** @constant */
			Conflict: 409,
			/** @constant */
			Gone: 410,
			/** @constant */
			LengthRequired: 411,
			/** @constant */
			PreconditionFailed: 412,
			/** @constant */
			EntityTooLarge: 413,
			/** @constant */
			UriTooShort: 414,
			/** @constant */
			UnsupportedMediaType: 415,
			/** @constant */
			RangeNotSatisfiable: 416,
			/** @constant */
			ExpectationFailed: 417
		},
		/** @namespace */
		ServerError: {
			/** @constant */
			Internal: 500,
			/** @constant */
			NotImplemented: 501,
			/** @constant */
			BadGateway: 502,
			/** @constant */
			ServiceUnavailable: 503,
			/** @constant */
			GatewayTimeout: 504,
			/** @constant */
			HttpVersionNotSupported: 505
		}
	}

    /**
     * True if the client is mobile (likely a phone or a tablet).
     * <p>
     * The client can set the mode explicitly via mode=mobile or mode=desktop query params.
     * 
     * @param conversation The Prudence conversation
     * @returns {Boolean}
     */
    Public.isMobileClient = function(conversation) {
    	var mode = conversation.query.get('mode')
    	switch (String(mode)) {
    		case 'mobile':
    			return true
    		case 'desktop':
    			return false
    	}
    	
    	var agent = conversation.request.clientInfo.agent
    	return Savory.Objects.exists(agent) && (agent.toLowerCase().indexOf('mobile') != -1)
    }

	/**
	 * Encodes a URL component. Note that JavaScript's standard encodeURIComponent will not encode !'()*~.
	 * 
	 * @returns {String}
	 */
	Public.encodeUrlComponent = function(string) {
		return encodeURIComponent(string).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/~/g, '%7E')
	}
	
	/**
	 * Gets the client's IP address (upstream of any filters, proxies or gateways).
	 * 
	 * @param conversation The Prudence conversation
	 * @returns Dict in the form of {ip: 'ip address', hostName: 'host name'}
	 */
	Public.getClientAddress = function(conversation) {
		var address = {}
		address.ip = String(conversation.resource.request.clientInfo.upstreamAddress)
		var inetAddress = java.net.InetAddress.getByName(address.ip)
		if (inetAddress) {
			address.hostName = String(inetAddress.hostName)
		}
		return address
	}
	
	/**
	 * Extracts query parameters, treating them as specific types.
	 * 
	 * @param conversation The Prudence conversation
	 * @param [keys] See {@link Savory.Resources#fromAttributeMap}
	 * @returns A dict of query parameters
	 * @see Visit <a href="http://threecrickets.com/prudence/manual/api/#toc-Paragraph-108">the Prudence API documentation for conversation.query</a>
	 */
	Public.getQuery = function(conversation, keys) {
		return Public.fromAttributeMap(conversation.query, conversation.queryAll, keys)
	}

	/**
	 * Extracts form parameters, treating them as specific types.
	 * The form data is submitted by the client as an "application/x-www-form-urlencoded" entity.
	 * <p>
	 * See {@link Savory.Resources.Form} for a more comprehensive solution to handling forms.
	 * 
	 * @param conversation The Prudence conversation
	 * @param [keys] See {@link Savory.Resources#fromAttributeMap}
	 * @returns A dict of form parameters
	 * @see Visit <a href="http://threecrickets.com/prudence/manual/api/#toc-Paragraph-107">the Prudence API documentation for conversation.form</a>
	 */
	Public.getForm = function(conversation, keys) {
		return Public.fromAttributeMap(conversation.form, conversation.formAll, keys)
	}
	
	/**
	 * Extracts the entity, treating it as a specific type.
	 * 
	 * @param conversation The Prudence conversation
	 * @param {String} type See {@link Savory.Resources#fromRepresentation}
	 * @param [params] Optional params for some conversions
	 * @returns The entity
	 */
	Public.getEntity = function(conversation, type, params) {
		return conversation.entity ? Public.fromRepresentation(conversation.entity, type, params) : null
	}
	
	/**
	 * True if the reference's relative path starts with any of the prefixes. 
	 * 
	 * @param conversation The Prudence conversation
	 * @param {String[]} prefixes An array of prefixes
	 * @returns {Boolean}
	 */
	Public.hasRelativePrefix = function(conversation, prefixes) {
		if (prefixes) {
			var relative = conversation.reference.relativeRef.toString()
			if (relative.length && (relative.charAt(0) != '/')) {
				relative = '/' + relative
			}
			prefixes = Savory.Objects.array(prefixes)
			for (var p in prefixes) {
				if (relative.startsWith(prefixes[p])) {
					return true
				}
			}
		}
		
		return false
	}

	/**
	 * Sends a request to a resource, with support for various types of representation and payload conversions.
	 * 
	 * @param params
	 * @param {String} params.uri
	 * @param [params.query] The query parameters to add to the URI (see {@link Savory.Resources#buildUri})
	 * @param {String} [params.method='get'] The HTTP method: 'get', 'post', 'put', 'delete' or 'head'
	 * @param {Boolean} [params.internal=false] True to use Prudence's document.internal API
	 * @param {String} [params.mediaType] Defaults to 'application/java' for internal=true, otherwise 'text/plain'
	 * @param [params.payload] A dict in the form of {type: 'type', value: object}. Supported payload types:
	 *        <ul>
	 *        <li>'object': as is (only for internal=true)</li>
	 *        <li>'text': converted to string if not one already</li>
	 *        <li>'json': see {@link Savory.JSON#to}</li>
	 *        <li>'xml': see {@link Savory.XML#to}</li>
	 *        <li>'web': see {@link Savory.Resource#toWebPayload}</li>
	 *        </ul>
	 * @param {String|Object} [params.result]
	 *        Defaults to 'json' for JSON media types, 'xml' for XML media types, 'object' for 'application/java'
	 *        and 'text' for everything else. Supported types:
	 *        <ul>
	 *        <li>'text': the default (for non-'head' methods)</li>
	 *        <li>'entity': the Restlet Representation instance (make sure to release it!)</li>
	 *        <li>'date': the Date from the response header</li>
	 *        <li>'object': an arbitrary object (only useful for internal conversations)</li>
	 *        <li>'json': see {@link Savory.JSON#from}</li>
	 *        <li>'extendedJson': see {@link Savory.JSON#from}</li>
	 *        <li>'xml': see {@link Savory.XML#from}</li>
	 *        <li>'web': see {@link Savory.Resources#fromQueryString}</li>
	 *        <li>'properties': see {@link Savory.Resources#fromPropertySheet} (using params.separator)</li>
	 *        </ul>
	 * @param {Boolean} [params.headers] If true, the result will be in the form of {headers:{},representation:...}
	 *        where 'headers' is a dict of HTTP responses; param.headers defaults to true if params.method is 'head',
	 *        otherwise it defaults to false
	 * @param [params.authorization] A dict in the form of {scheme: 'scheme name', ...}.
	 *        For example: {scheme: 'oauth', rawValue: 'oauth authorization'}
	 * @param {Number} [params.retry=0] Number of retries in case of failed requests
	 * @param [params.logLevel='fine'] The log level to use for failed requests
	 */
	Public.request = function(params) {
		params = Savory.Objects.clone(params)
		params.logLevel = params.logLevel || 'fine'
		params.method = params.method || 'get'
		params.mediaType = params.mediaType || (params.internal ? 'application/java' : 'text/plain')
		params.headers = Savory.Objects.exists(params.headers) ? params.headers : (params.method == 'head' ? true : false)
		
		if (!params.result) {
			if (params.mediaType.endsWith('/json') || params.mediaType.endsWith('+json')) {
				params.result = 'json'
			}
			else if (params.mediaType.endsWith('/xml') || params.mediaType.endsWith('+xml')) {
				params.result = 'xml'
			}
			else if (params.mediaType == 'application/java') {
				params.result = 'object'
			}
			else {
				params.result = 'text'
			}
		}
		
		if (params.payload && params.payload.type) {
			switch (String(params.payload.type)) {
				case 'text':
					// Payload is as is
					break
					
				case 'json':
					params.payload = Savory.JSON.to(params.payload.value)
					break
					
				case 'xml':
					params.payload = Savory.XML.to(params.payload.value)
					break

				case 'web':
					params.payload = Public.toWebPayload(params.payload.value)
					break
					
				case 'object':
					params.payload = new org.restlet.representation.ObjectRepresentation(params.payload.value)
					break
					
				default:
					Public.logger.warning('Unsupported payload type: ' + params.payload.type)
					params.payload = null
					break
			}
		}

		var resource
		
		while (params.file || params.uri) {
			if (params.file) {
				params.uri = new java.io.File(params.file).toURI()
				resource = document.external(params.uri, params.mediaType)
				if (!params.retry) {
					resource.retryOnError = false
					resource.retryAttempts = 0
				}
				else {
					resource.retryOnError = true
					resource.retryAttempts = params.retry
				}
				delete params.file
				delete params.uri
			}
			else {
				params.uri = params.query ? Savory.Resources.buildUri(params.uri, params.query) : params.uri
				resource = params.internal ? document.internal(params.uri, params.mediaType) : document.external(params.uri, params.mediaType)
				delete params.uri
			}
			
			if (params.headers) {
				resource.request.attributes.put('org.restlet.http.headers', Public.toForm(params.headers))
			}
			
			if (params.authorization) {
				var challengeResponse
				switch (String(params.authorization.scheme)) {
					case 'oauth':
						challengeResponse = new org.restlet.data.ChallengeResponse(org.restlet.data.ChallengeScheme.HTTP_OAUTH)
						challengeResponse.rawValue = params.authorization.value
						break
						
					default:
						Public.logger.warning('Unsupported authorization scheme: ' + params.authorization.scheme)
						break
				}
				if (challengeResponse) {
					resource.challengeResponse = challengeResponse
				}
			}

			try {
				var representation
				var resultType = params.result.type || params.result
				switch (params.method) {
					case 'head':
						representation = resource.head()
						break
						
					case 'get':
						representation = resource.get()
						break
						
					case 'delete':
						representation = resource['delete']()
						break
						
					case 'post':
						representation = resource.post(params.payload ? params.payload : '')
						break
						
					case 'put':
						representation = resource.put(params.payload ? params.payload : '')
						break
						
					default:
						Public.logger.warning('Unsupported method: ' + params.method)
						break
				}
				
				if (Savory.Objects.exists(resource.response.locationRef)) {
					params.uri = String(resource.response.locationRef)
					Public.logger.fine('Following redirect: ' + params.uri)
					continue
				}

				if (resultType == 'entity') {
					return representation
				}

				try {
					if (resultType == 'date') {
						return new Date(resource.response.date.time)
					}
					
					var result = Public.fromRepresentation(representation, resultType, params.result)
					if (params.headers) {
						result = {
							representation: result
						}
						var headers = resource.response.attributes.get('org.restlet.http.headers')
						if (Savory.Objects.exists(headers)) {
							result.headers = Public.fromParameterList(headers)
						}
					}
					return result
				}
				finally {
					if (Savory.Objects.exists(representation)) {
						representation.release()
					}
				}
			}
			catch (x if x.javaException instanceof org.restlet.resource.ResourceException) {
				Public.logger.log(params.logLevel, function() {
					var text = resource.response.entity ? String(resource.response.entity.text).trim() : null
					return String(x.javaException) + (text ? ': ' + text : '') + '\n' + Savory.Rhino.getStackTrace() + '\nRequest params: ' + Savory.JSON.to(params, true) 
				})
				
				if (resultType == 'date') {
					return new Date(resource.response.date.time)
				}
				
				if (params.headers) {
					var headers = resource.response.attributes.get('org.restlet.http.headers')
					if (Savory.Objects.exists(headers)) {
						return {
							headers: Public.fromParameterList(headers)
						}
					}
				}
			}
			finally {
				resource.response.release()
			}
		}
		
		return null
	}
	
	/**
	 * Shortcut to internally request a /web/dynamic/ or /web/static/ URI.
	 * Can also work on /resources/ if they support the 'text/html' media type.
	 * 
	 * @returns {String} The raw HTML
	 */
	Public.generateHtml = function(uri, payload) {
		if (payload) {
			return Public.request({
				uri: uri,
				internal: true,
				mediaType: 'text/html',
				method: 'post',
				payload: {
					type: 'object',
					value: payload
				}
			})
		}
		else {
			return Public.request({
				uri: uri,
				internal: true,
				mediaType: 'text/html'
			})
		}
	}
	
	/**
	 * Shortcut to internally request a /web/dynamic/ or /web/static/ URI.
	 * Can also work on /resources/ if they support the 'application/xml' media type.
	 * 
	 * @returns {String} The raw XML
	 */
	Public.generateXML = function(uri, payload) {
		if (payload) {
			return Public.request({
				uri: uri,
				internal: true,
				mediaType: 'application/xml',
				method: 'post',
				payload: {
					type: 'object',
					value: payload
				},
				result: 'text'
			})
		}
		else {
			return Public.request({
				uri: uri,
				internal: true,
				mediaType: 'application/xml',
				result: 'text'
			})
		}
	}

	/**
	 * Adds query parameters to a URI, after properly encoding them.
	 * The URI may already have query parameters.
	 * 
	 * @param {String} uri A URI (with or without a query)
	 * @param {Object} query A dict of query parameters 
	 * @returns {String} The URI with the additional query parameters
	 */
	Public.buildUri = function(uri, query) {
		var reference = new org.restlet.data.Reference(uri)
		reference.query = Public.toForm(query).queryString
		return String(reference)
	}
	
	/**
	 * Converts a query string into a dict.
	 * 
	 * @param query The query string
	 * @param [keys] See {@link Savory.Resources#fromAttributeMap}
	 */
	Public.fromQueryString = function(query, keys) {
		var form = new org.restlet.data.Form(query)
		return Public.fromAttributeMap(form.valuesMap, form, keys)
	}

	/**
	 * Converts a Restlet Parameter list into a dict.
	 * 
	 * @param list The Parameter list
	 * @returns A dict
	 */
	Public.fromParameterList = function(list) {
		var parameters = {}
		for (var i = list.iterator(); i.hasNext(); ) {
			var parameter = i.next()
			parameters[parameter.name] = String(parameter.value)
		}
		return parameters
	}
	
	/**
	 * Converts a multi-line property sheet into a dict.
	 * 
	 * @param {String} text The property sheet
	 * @param {String} separator The separator between property name and value
	 * @returns A dict
	 */
	Public.fromPropertySheet = function(text, separator) {
		text = String(text).split('\n')
		var properties = {}
		for (var t in text) {
			var line = text[t].split(separator)
			if (line.length == 2) {
				properties[line[0]] = line[1]
			}
		}
		return properties
	}
	
	/**
	 * Converts a Restlet Representation into the desired type.
	 * 
	 * @param representation The Restlet Representation
	 * @param {String} type Supported types:
	 * <ul>
	 * <li>'object': an arbitrary object (only useful for internal conversations)</li>
	 * <li>'text'</li>
	 * <li>'json': see {@link Savory.JSON#from}</li>
	 * <li>'extendedJson': see {@link Savory.JSON#from}</li>
	 * <li>'xml': see {@link Savory.XML#from}</li>
	 * <li>'web': see {@link Savory.Resources#fromQueryString}</li>
	 * <li>'properties': see {@link Savory.Resources#fromPropertySheet} (using params.separator)</li>
	 * </ul>
	 * @param [params] Optional params for some conversions
	 * @returns The representation
	 */
	Public.fromRepresentation = function(representation, type, params) {
		switch (String(type)) {
			case 'object':
				var object = representation.object
				if (Savory.Objects.exists(object)) {
					return object
				}
				break
				
			case 'text':
				var text = representation.text
				if (Savory.Objects.exists(text)) {
					return String(text)
				}
				return ''
				
			case 'json':
				var text = representation.text
				if (Savory.Objects.exists(text)) {
					try {
						return Savory.JSON.from(text)
					} 
					catch (x) {
						Public.logger.warning('Malformed JSON representation: ' + text)
					}
				}
				return {} 
				
			case 'extendedJson':
				var text = representation.text
				if (Savory.Objects.exists(text)) {
					try {
						return Savory.JSON.from(text, true)
					} 
					catch (x) {
						Public.logger.warning('Malformed JSON representation: ' + text)
					}
				}
				return {}
				
			case 'xml':
				var text = representation.text
				if (Savory.Objects.exists(text)) {
					try {
						return Savory.XML.from(text)
					} 
					catch (x) {
						Public.logger.warning('Malformed XML representation: ' + text)
					}
				}
				return null
				
			case 'web':
				var text = representation.text
				if (Savory.Objects.exists(text)) {
					return Public.fromQueryString(text, params ? params.keys : null)
				}
				return {}
				
			case 'properties':
				var text = representation.text
				if (Savory.Objects.exists(text)) {
					return Public.fromPropertySheet(text, params.separator || ':')
				}
				return {}
				
			default:
				Public.logger.warning('Unsupported representation type: ' + type)
				break
		}
		
		return null
	},

	/**
	 * Converts an attribute map into a dict.
	 *
	 * @param {java.util.Map} map The map
	 * @param {org.restlet.util.Series} [series] The series (in order to support arrays)
	 * @param [keys] A dict where keys are attribute names and values are types. Supported types:
	 *        <ul>
	 *        <li>'string': no conversion</li>
	 *        <li>'int': parseInt</li>
	 *        <li>'float': parseFloat</li>
	 *        <li>'bool': must be 'true' or 'false'</li>
	 *        <li>'date': Unix timestamp</li>
	 *        <li>'json': see {@link Savory.JSON#from}</li>
	 *        <li>'extendedJson': see {@link Savory.JSON#from}</li>
	 *        <li>'xml': see {@link Savory.XML#from}</li>
	 *        </ul>
	 *        Add '[]' to any type to signify that you want an array of all values.
	 *        When no keys are supplied, the entire map is converted to a dict of strings.
	 * @returns A dict
	 */
	Public.fromAttributeMap = function(map, series, keys) {
		var attributes = {}

		if (keys) {
			for (var k in keys) {
				var type = keys[k]
				var values
				
				var isArray = false
				if (type.endsWith('[]')) {
					type = type.substring(0, type.length - 2)
					values = Savory.JVM.fromArray(series.getValuesArray(k))
					isArray = true
				}
				else {
					var value = map.get(k)
					values = Savory.Objects.exists(value) ? [value] : []
				}

				for (var v in values) {
					var value = values[v]
					switch (type) {
						case 'int':
							value = parseInt(value)
							if (isNaN(value)) {
								value = null
							}
							break
							
						case 'float':
							value = parseFloat(value)
							if (isNaN(value)) {
								value = null
							}
							break
							
						case 'bool':
							if (value == 'true') {
								value = true
							}
							else 
								if (value == 'false') {
									value = false
								}
								else {
									value = null
								}
							break
							
						case 'date':
							value = parseFloat(value)
							if (isNaN(value)) {
								value = null
							}
							else {
								value = new Date(value)
							}
							break
							
						case 'json':
							try {
								value = Savory.JSON.from(value)
							}
							catch (x) {
								Public.logger.warning('Malformed JSON attribute: ' + value)
							}
							break
							
						case 'extendedJson':
							try {
								value = Savory.JSON.from(value, true)
							}
							catch (x) {
								Public.logger.warning('Malformed JSON attribute: ' + value)
							}
							break
							
						case 'xml':
							try {
								value = Savory.XML.from(value)
							}
							catch (x) {
								Public.logger.warning('Malformed XML attribute: ' + value)
							}
							break
							
						case 'string':
						default:
							value = Savory.Objects.exists(value) ? String(value) : null
							break
					}
				}
				
				if (Savory.Objects.exists(value)) {
					if (isArray) {
						if (!attributes[k]) {
							attributes[k] = []
						}
						attributes[k].push(value)
					}
					else {
						attributes[k] = value
					}
				}
			}
		}
		else {
			for (var i = map.entrySet().iterator(); i.hasNext(); ) {
				var entry = i.next()
				attributes[entry.key] = String(entry.value)
			}
		}
		
		return attributes
	}

	/**
	 * Converts a dict into a Restlet Form.
	 * 
	 * @param dict
	 * @returns {org.restlet.data.Form}
	 */
	Public.toForm = function(dict) {
		var form = new org.restlet.data.Form()
		for (var d in dict) {
			var value = dict[d]
			if (value !== null) {
				form.add(d, String(value))
			}
		}
		return form
	}

	/**
	 * Converts a dict into an HTML form payload.
	 * 
	 * @returns {org.restlet.representation.Representation}
	 */
	Public.toWebPayload = function(dict) {
		return Public.toForm(dict).webRepresentation
	}

	/**
	 * Represents a standard HTML form.
	 * The form data is submitted by the client as an "application/x-www-form-urlencoded" entity.
	 * <p>
	 * See {@link Savory.Resources#getForm} for a more rudimentary solution to handling forms.
	 * 
	 * @class
	 * @name Savory.Resources.Form
	 * 
	 * @param config
	 * @param config.fields A dict of field names mapped to this format:
	 *        {label: '', type: '', validator: '', mask: ''} or a plain string, which will considered as the 'type';
	 *        'label' will default to the field name; 'type' defaults to 'string' and is used with the {@link Savory.Validation}
	 *        library; 'validator' and 'mask' will both override options provided by the validation library  
	 * @param {Boolean} [config.serverValidation=true] True to enable server-side validation for all fields
	 * @param {Boolean} [config.clientValidation=true] True to enable client-side validation for all fields (this value is not
	 *        handled directly by this class, but is defined and stored as a convenience for client implementations)
	 */
    Public.Form = Savory.Classes.define(function(Module) {
    	/** @exports Public as Savory.Resources.Form */
    	var Public = {}
    	
        /** @ignore */
    	Public._construct = function(config) {
    		this.serverValidation = Savory.Objects.ensure(config.serverValidation, true)
    		this.clientValidation = Savory.Objects.ensure(config.clientValidation, true)
    		this.fields = {}
    		for (var name in config.fields) {
    			var field = config.fields[name]
    			
    			field = Savory.Objects.isString(field) ? {type: String(field)} : Savory.Objects.clone(field)
    			field.label = field.label || name
    			
    			this.fields[name] = field
    		}
    	}
    	
    	/**
    	 * Performs server-side validation of values according to the form's defined fields.
    	 * 
    	 * @param values A dict of field names mapped to values; all values will be treated as strings;
    	 *        unrecognized field names will be ignored
    	 * @returns A structure in the format: {success: true, values: {...}} or {success: false, values: {...}, errors: {...}};
    	 *          values are copied over from the arg (always as strings), and errors are all texts that can be displayed
    	 *          to users
    	 */
    	Public.validate = function(values) {
    		var results = {success: true}

    		// Check that all required fields are provided
    		if (this.serverValidation) {
	    		for (var name in this.fields) {
	    			var field = this.fields[name]
	    			if (field.required) {
	    				var value = values[name]
	    				if (!Savory.Objects.exists(value) || (value == '')) {
	    					results.success = false
	    					if (results.errors === undefined) {
	    						results.errors = {}
	    					}
	    					results.errors[name] = error
	    				}
	    			}
	    		}
    		}
    		
    		// Check remaining values
    		for (var name in values) {
    			if (!results.success && Savory.Objects.exists(results.errors[name])) {
    				// We've already validated this value
    				continue
    			}

    			var value = values[name]
    			var field = this.fields[name]
    			
    			// Only include defined fields
    			if (Savory.Objects.exists(field) && Savory.Objects.exists(value)) {
    				var error = null
    				
    				if (this.serverValidation) {
        				var validator = field.validator
						var validation = Savory.Validation[field.type || 'string']
        				if (!validator) {
    						if (validation && validation.fn) {
    							validator = validation.fn
    						}
        				}
        				
        				if (validator) {
	    					var validity = validator.call(this, value, field)
	    					if (validity !== true) {
	    						if (validation && validation.errors) {
	    							error = validation.errors[validity]
	    						}
	    						error = error ? error.cast({name: name}) : 'Wrong'
	    					}
	    				}
    				}
    				
    				if(Savory.Objects.exists(value)) {
    					if (results.values === undefined) {
    						results.values = {}
    					}
    					results.values[name] = String(value)
    				}
    				
    				if (error) {
    					results.success = false
    					if (results.errors === undefined) {
    						results.errors = {}
    					}
    					results.errors[name] = error
    				}
    			}
    		}
    		
    		return results
    	}
    	
    	/**
    	 * 
    	 * @param conversation The Prudence conversation
    	 * @param [params]
    	 * @param {String} [params.mode='raw'] Set this to override the query param
    	 * @param {String} [params.successDocumentName=this.successDocumentName] Set this to override the form's value 
    	 * @param {String} [params.failureDocumentName=this.failureDocumentName] Set this to override the form's value 
    	 * @param {String} [params.documentName=this.documentName] Set this to override the form's value 
    	 * @returns False is the form was not handled, otherwise the raw results (see {@link #validate})
    	 */
    	Public.handle = function(conversation, params) {
    		params = params || {}
    		var mode = params.mode || conversation.query.get('mode') || 'raw'
    		mode = String(mode)
    		
    		if (conversation.request.method == 'POST') {
	    		var values = Module.getForm(conversation)
	    		
	    		var results = this.validate(values)
	    		this.process(results)
	    		
	    		switch (mode) {
	    			case 'json':
	    	    		conversation.mediaTypeName = 'application/json'
	    	    		var printResults = results
    		    		if (printResults.success) {
    		    			printResults = Savory.Objects.clone(printResults)
    		    			delete printResults.values
    		    		}
    		    		print(Savory.JSON.to(printResults))
    		    		break
    		    		
	    			case 'include':
	    				var documentName
	    				if (results.success) {
	    					documentName = params.successDocumentName || this.successDocumentName
	    				}
	    				else {
	    					documentName = params.failureDocumentName || this.failureDocumentName
	    				}
    					documentName = documentName || this.documentName

    					conversation.locals.put('savory.resources.form', results)
	    				document.include(documentName)
	    				break
	    		}
	    		
	    		results.mode = mode
	    		return results
    		}
    		
    		return false
    	}
    	
    	Public.process = function(results) {
    	}
    	
    	return Public
    }(Public))
    
    return Public
}()