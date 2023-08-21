// @ts-check

const BrotliPlugin = require('../index.js').default;
const webpack = require('webpack');
const rmRf = require('rimraf').rimrafSync;
const brotliDecompress = require('../compress.js').default.decompress;

const OUTPUT_DIR = __dirname + '/tmp/';

/** @param {webpack.Configuration} options */
function createCompiler(options = {}) {
	/** @type {webpack.Configuration} */
	const defaultOptions = {
		bail: true,
		cache: false,
		stats: {
			all: true,
		},
		devtool: 'eval',
		entry: __dirname + '/fixtures/entry.js',
		output: {
			path: OUTPUT_DIR,
			filename: '[name].js',
			chunkFilename: '[id].[name].js',
		},
		plugins: [new BrotliPlugin()],
	};

	if (!Array.isArray(options)) {
		options = Object.assign({}, defaultOptions, options);
	}

	return webpack(options);
}

/** @param {webpack.Compiler} compiler */
function compile(compiler) {
	return new Promise(function (resolve, reject) {
		compiler.run(function (err, stats) {
			if (err) return reject(err);

			compiler.close(() => resolve(stats));
		});
	});
}

describe('when applied with default settings', function () {
	beforeEach(function () {
		rmRf(OUTPUT_DIR);
	});

	afterEach(function () {
		rmRf(OUTPUT_DIR);
	});

	it('compresses and decompresses', async function () {
		const compiler = createCompiler();
		const stats = await compile(compiler);

		expect(stats.compilation.assets).toHaveProperty(['main.js']);
		expect(stats.compilation.assets).toHaveProperty(['main.js.br']);

		// FIXME: Test fails because the source is not included in the asset
		const compressedResult = stats.compilation.getAsset('main.js.br').source.buffer();

		brotliDecompress(compressedResult, {}, (err, result) => {
			const decompressedResult = result.toString();

			expect(decompressedResult).toContain('Succesful result');
		});
	});
});
