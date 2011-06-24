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
 * SVG rendering.
 * <p>
 * Note: JPEG transcoding is currenly only supported on Oracle JDK, not on OpenJDK.
 * (As of Batik 1.7).
 * 
 * @namespace
 * @requires
 * <ul>
 * <li>batik-anim.jar</li>
 * <li>batik-awt-util.jar</li>
 * <li>batik-bridge.jar</li>
 * <li>batik-codec.jar</li>
 * <li>batik-css.jar</li>
 * <li>batik-dom.jar</li>
 * <li>batik-ext.jar</li>
 * <li>batik-gvt.jar</li>
 * <li>batik-parser.jar</li>
 * <li>batik-script.jar</li>
 * <li>batik-svg-dom.jar</li>
 * <li>batik-transcoder.jar</li>
 * <li>batik-util.jar</li>
 * <li>batik-xml.jar</li>
 * <li>xml-apis-ext.jar</li>
 * <li>pdf-transcoder.jar</li>
 * </ul>
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
	 * Converts SVG source into a raster.
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
