// @ts-check

const zlib = require('zlib');

/**
 *
 * @returns {(buf: Buffer, options: import('./index').BrotliLibsOptions, callback: zlib.CompressCallback) => void}
 */
function adapter() {
	if (zlib.hasOwnProperty('brotliCompress')) {
		return zlib.brotliCompress;
	}

	try {
		const brotli = require('brotli');

		return function (content, options, callback) {
			const result = brotli.compress(content, options);

			callback(null, Buffer.from(result));
		};
	} catch (err) {
		throw new Error(
			'brotli not found. See https://github.com/mynameiswhm/brotli-webpack-plugin for details.'
		);
	}
}

module.exports = adapter();
