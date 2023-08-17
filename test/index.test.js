var BrotliPlugin = require('../index.js');
var webpack = require('webpack');
var rmRf = require('rimraf').rimrafSync;

var OUTPUT_DIR = __dirname + '/tmp/';

/** @param {webpack.Configuration} options */
function createCompiler(options) {
	/** @type {webpack.Configuration} */
	var defaultOptions = {
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
			resolve(stats);
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

	it('compresses and decompresses', function () {
		var compiler = createCompiler();

		new BrotliPlugin().apply(compiler);

		return compile(compiler).then(function (stats) {
			expect(stats.compilation.assets).toHaveProperty(['main.js']);
			expect(stats.compilation.assets).toHaveProperty(['main.js.br']);

			var source = stats.compilation.assets['main.js'].source();
			expect(source).toContain('console.log');
		});
	});
});
