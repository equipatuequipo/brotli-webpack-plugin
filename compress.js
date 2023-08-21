// @ts-check

const zlib = require('zlib');
const brotli = require('brotli');

/**
 *
 * @param {Buffer} buffer
 * @param {import('./index').BrotliLibsOptions} options
 * @returns {Promise<Buffer>}
 */
function compress(buffer, options) {
	return new Promise((resolve, reject) => {
		if (zlib.hasOwnProperty('brotliCompress')) {
			zlib.brotliCompress(buffer, options, (error, result) => {
				if (error) reject(error);

				resolve(result);
			});
		}

		try {
			const result = brotli.compress(buffer, options);

			if (!result) reject('Invalid compression result');

			resolve(Buffer.from(result));
		} catch (err) {
			reject(err);
			throw err;
		}
	});
}

/**
 *
 * @type {(buf: Buffer, options: import('./index').BrotliLibsOptions, callback: zlib.CompressCallback) => void}
 */
const decompress = (function createDecompressor() {
	if (zlib.hasOwnProperty('brotliDecompress')) {
		return zlib.brotliDecompress;
	}

	try {
		const brotli = require('brotli');

		return function (content, options, callback) {
			const result = brotli.decompress(content);

			callback(null, Buffer.from(result));
		};
	} catch (err) {
		throw new Error(
			'brotli not found. See https://github.com/mynameiswhm/brotli-webpack-plugin for details.'
		);
	}
})();

module.exports = {
	compress,
	decompress,
};
