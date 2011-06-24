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

document.executeOnce('/savory/foundation/jvm/')
document.executeOnce('/savory/foundation/objects/')

var Savory = Savory || {}

/**
 * Encryption, decryption, hashing, cryptographically-strong randoms,
 * hex and Base64 encoding. Uses the JVM cryptography implementation and
 * Apache Commons Codec.
 * 
 * @namespace
 * @see <a href="http://commons.apache.org/codec/">Apache Commons Code</a>
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Cryptography = Savory.Cryptography || function() {
	/** @exports Public as Savory.Cryptography */
    var Public = {}

	/**
	 * Converts a string into a new JVM byte array, optionally prefixing it with salt.
	 * 
	 * @param {String} string The string
	 * @param {byte[]} [saltBytes] The salt
	 * @returns {byte[]}
	 */    	
	Public.toBytes = function(string, saltBytes) {
		var bytes = String(string).toBytes()
		
		if (Savory.Objects.exists(saltBytes)) {
			// Add salt before the bytes
			var bytesWithSalt = Savory.JVM.newArray(saltBytes.length + bytes.length, 'byte')
			java.lang.System.arraycopy(saltBytes, 0, bytesWithSalt, 0, saltBytes.length)
			java.lang.System.arraycopy(bytes, 0, bytesWithSalt, saltBytes.length, bytes.length)
			bytes = bytesWithSalt
		}
		
		return bytes
	}
	
	/**
	 * Converts a base64-encoded string into a new JVM byte array.
	 * 
	 * @param {String} string The base64-encoded string
	 * @returns {byte[]}
	 */
	Public.toBytesFromBase64 = function(string) {
		return org.apache.commons.codec.binary.Base64.decodeBase64(string)
	}

	/**
	 * Converts a JVM byte array into a base64-encoded string.
	 * 
	 * @param {byte[]} bytes The bytes
	 * @returns {String}
	 */
	Public.toBase64 = function(bytes) {
		bytes = org.apache.commons.codec.binary.Base64.encodeBase64(bytes)
		return Savory.JVM.fromBytes(bytes)
	}
	
	/**
	 * Converts a JVM byte array into a padded hex-encoded string.
	 * 
	 * @param {byte[]} bytes The bytes
	 * @returns {String}
	 */
	Public.toHex = function(bytes) {
		var i = new java.math.BigInteger(1, bytes)
		return String(java.lang.String.format('%1$032x', i))
	}
	
	/**
	 * Converts a JVM byte array into an encoded string.
	 * 
	 * @param {byte[]} bytes The bytes
	 * @param [encoding='base64'] Supported encodings: 'base64', 'hex'
	 * @returns {String}
	 */
	Public.toString = function(bytes, encoding) {
		switch (String(encoding)) {
			case 'hex':
				return Public.toHex(bytes)
			case 'base64':
			default:
				return Public.toBase64(bytes)
		}
	}
	
	/**
	 * Calculates the base64-encoded HMAC (Hash-based Message Authentication Code) for a binary payload.
	 * 
	 * @param {byte[]} payloadBytes The binary payload
	 * @param {byte[]} secretBytes The secret
	 * @param {String} algorithm The HMAC algorithm ('HmacSHA1', 'HmacSHA256', etc.)
	 * @param {String} [secretAlgorithm=algorithm] The secret algorithm, if different from the MAC algorithm
	 * @param {Boolean} [encoding='base64'] The encoding to use for the result
	 * @returns {String} An encoded HMAC or null if failed
	 */
	Public.hmac = function(payloadBytes, secretBytes, algorithm, secretAlgorithm, encoding) {
		var mac = javax.crypto.Mac.getInstance(algorithm)

		if (mac) {
			var key = new javax.crypto.spec.SecretKeySpec(secretBytes, secretAlgorithm || algorithm)
			mac.init(key)
			var digest = mac.doFinal(payloadBytes)
			
			return Public.toString(digest, encoding)
		}

		return null
	}

	/**
	 * Calculates the digest for a textual payload, with support for optionally prefixing it
	 * with salt (before calculating the digest).
	 * 
	 * @param {byte[]} payload The textual payload
	 * @param {byte[]} [saltBytes] The salt
	 * @param {Number} iterations The number of digest iterations to run
	 * @param {String} algorithm The digest algorithm ('SHA-1', 'SHA-256', 'MD5', etc.)
	 * @param {Boolean} [encoding='base64'] The encoding to use for the result
	 * @returns {String} An encoded digest or null if failed
	 */
	Public.digest = function(payload, saltBytes, iterations, algorithm, encoding) {
		var messageDigest = java.security.MessageDigest.getInstance(algorithm)
		if (messageDigest) {
			var digest = Public.toBytes(payload, saltBytes)
			
			for (var i = 0; i < iterations; i++) {
				messageDigest.reset()
				messageDigest.update(digest)
				digest = messageDigest.digest()
			}

			return Public.toString(digest, encoding)
		}
		
		return null
	}
	
	/**
	 * Shortcut to create a hex-encoded MD5 digest of a string
	 * (exactly equivalent to the md5 function in PHP).
	 * 
	 * @param {String} The string
	 * @returns {String} A hex-encoded digest or null if failed
	 */
	Public.md5 = function(string) {
		return Public.digest(string, null, 1, 'MD5', 'hex')
	}

	/**
	 * Extracts the text encrypted in a binary payload. The payload may optionally begin with an
	 * initialization vector for the cipher.
	 * 
	 * @param {byte[]} payloadBytes The binary payload
	 * @param {Number} ivLength Length (in bytes) of the initialization vector
	 * @param {byte[]} secretBytes The secret
	 * @param {String} algorithm The cipher algorithm
	 * @param {String} [secretAlgorithm=algorithm] The secret algorithm, if different from the cipher algorithm
	 * @returns {String} The text 
	 */
	Public.decode = function(payloadBytes, ivLength, secretBytes, algorithm, secretAlgorithm) {
		var cipher = javax.crypto.Cipher.getInstance(algorithm)

		if (cipher) {
			secretAlgorithm = secretAlgorithm || algorithm.split('/')[0]
			var key = new javax.crypto.spec.SecretKeySpec(secretBytes, secretAlgorithm)

			// Extract initialization vector from payload
			var iv = javax.crypto.spec.IvParameterSpec(java.util.Arrays.copyOf(payloadBytes, ivLength))
			payloadBytes = java.util.Arrays.copyOfRange(payloadBytes, ivLength, payloadBytes.length)
			
			cipher.init(javax.crypto.Cipher.DECRYPT_MODE, key, iv)
			var decrypted = cipher.doFinal(payloadBytes)

			return Savory.JVM.fromBytes(decrypted)
		}
		
		return null
	}
	
	/**
	 * Generates a random byte phrase, where randomness is strong enough for most cryptographic purposes.
	 * 
	 * @param {Number} length Length in bytes
	 * @param {String} algorithm The algorithm ('SHA1PRNG', 'NativePRNG', 'AESCounterRNG', etc.) 
	 * @param {Boolean} [encoding='base64'] The encoding to use for the result
	 * @returns {String} An encoded string represented the random phrase
	 */
	Public.random = function(length, algorithm, encoding) {
		// Algorithms:
		//
		// NativePRNG - default on Linux, but slow, as it includes OS entropy
		// SHA1PRNG - default on Windows, implemented in Java, faster than NativePRNG but no entropy
		// AESCounterRNG - 10x faster than SHA1PRNG (from Uncommon Math project)
		
		var secureRandom = algorithm ? java.security.SecureRandom.getInstance(algorithm) : new java.security.SecureRandom()
		var random = Savory.JVM.newArray(length, 'byte')
		secureRandom.nextBytes(random)

		return Public.toString(random, encoding)
	}
	
	return Public
}()
