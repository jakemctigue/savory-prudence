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
 * SVG rendering library. The library also includes a resource that allows for clients (such as AJAX)
 * to use the server an SVG transcoder: a client can POST and SVG source, and get a raster in return.
 * <p>
 * Note: JPEG transcoding is currently supported only on Oracle JDK, not on OpenJDK.
 * (As of Batik 1.7).
 * 
 * @namespace
 * @requires org.apache.batik.anim.jar, org.apache.batik.css.jar, org.apache.batik.dom.jar, org.apache.batik.dom.svg.jar,
 * org.apache.batik.ext.awt.jar, org.apache.batik.ext.awt.image.codec.jar, org.apache.batik.parser.jar, org.apache.batik.transcoder.jar,
 * org.apache.batik.bridge.jar, org.apache.batik.gvt.jar, org.apache.batik.xml.jar,
 * org.apache.batik.script.jar, org.apache.batik.util.jar, org.apache.fop.svg.jar, org.w3c.dom.jar, org.w3c.dom.svg.jar
 * @see Visit <a href="http://xmlgraphics.apache.org/batik/">Batik</a>
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.SVG = Savory.SVG || function() {
	/** @exports Public as Savory.SVG */
    var Public = {}

	/**
	 * Installs the library's pass-throughs.
	 * <p>
	 * Can only be called from Prudence configuration scripts!
	 */
	Public.settings = function() {
		resourcesPassThrough.push('/savory/foundation/svg/raster/')
	}
		
	/**
	 * Converts SVG source into a binary raster image.
	 * 
	 * @param {String} svg The SVG source
	 * @param {String} mediaType The MIME type ('image/jpeg', 'image/png' or 'application/pdf')
	 * @returns {byte[]}
	 */
	Public.toRaster = function(svg, mediaType) {
		var transcoder
		switch (String(mediaType)) {
			case 'image/jpeg':
				transcoder = new org.apache.batik.transcoder.image.JPEGTranscoder()
				transcoder.addTranscodingHint(org.apache.batik.transcoder.image.JPEGTranscoder.KEY_QUALITY, new java.lang.Float(0.8))
				break

			case 'image/png':
				transcoder = new org.apache.batik.transcoder.image.PNGTranscoder()
				break
				
			case 'application/pdf':
				transcoder = new org.apache.fop.svg.PDFTranscoder()
				break
		}

		if (transcoder) {
			var input = new org.apache.batik.transcoder.TranscoderInput(new java.io.StringReader(svg))
			var stream = new java.io.ByteArrayOutputStream()
			var output = new org.apache.batik.transcoder.TranscoderOutput(stream)
			transcoder.transcode(input, output)
			return stream.toByteArray()
		}
		
		return null
	}
    
    return Public
}()
