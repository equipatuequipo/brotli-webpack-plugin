// @ts-check
const brotliCompress = require('./compress');
const parsePath = require('path').parse;

/**
 * @typedef {import('zlib').BrotliOptions & Parameters<import('brotli')['compress']>['1']} BrotliLibsOptions
 */

/**
 * @typedef {{
 *	asset: string,
 * 	threshold: number,
 *  minRatio: number,
 *  deleteOriginalAssets: boolean,
 *  test?: RegExp
 * } & BrotliLibsOptions} BrotliPluginOptions
 */

class BrotliPlugin {
	/** @type {BrotliPluginOptions} */
	static defaultOptions = {
		asset: '[base].br',
		threshold: 0,
		minRatio: 0.8,
		deleteOriginalAssets: false,

		// Brotli default options
		mode: 0,
		quality: 11,
		lgwin: 22,
	};

	/**
	 * @param {Partial<BrotliPluginOptions>} options
	 */
	constructor(options = {}) {
		this.options = { ...BrotliPlugin.defaultOptions, ...options };
	}

	/**
	 *
	 * @param {import('webpack').Compiler} compiler
	 */
	apply(compiler) {
		const pluginName = BrotliPlugin.name;

		// webpack module instance can be accessed from the compiler object,
		// this ensures that correct version of the module is used
		// (do not require/import the webpack or any symbols from it directly).
		const { webpack } = compiler;

		// Compilation object gives us reference to some useful constants.
		const { Compilation } = webpack;

		// RawSource is one of the "sources" classes that should be used
		// to represent asset sources in compilation.
		const { RawSource } = webpack.sources;

		// Tapping to the "thisCompilation" hook in order to further tap
		// to the compilation process on an earlier stage.
		compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
			// Tapping to the assets processing pipeline on a specific stage.
			compilation.hooks.processAssets.tap(
				{
					name: pluginName,

					// Using one of the later asset processing stages to ensure
					// that all assets were already added to the compilation by other plugins.
					stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER,
				},
				(assets) => {
					Object.keys(assets).forEach((filename) => {
						if (this.options.test && !this.options.test.test(filename)) return;

						const asset = compilation.getAsset(filename);
						if (!asset) return;

						let rawContent = asset.source.buffer();
						if (!Buffer.isBuffer(rawContent)) return;

						if (rawContent.length < this.options.threshold) return;

						brotliCompress(rawContent, this.options, (err, compressedResult) => {
							if (err) return;

							if (compressedResult.length / rawContent.length > this.options.minRatio)
								return;

							const parsedFilename = parsePath(filename);
							const compressedFileName = this.options.asset.replace(
								/\[(base|name|ext)]/g,
								(_, part) => parsedFilename[part]
							);

							if (this.options.deleteOriginalAssets)
								compilation.deleteAsset(filename);

							compilation.emitAsset(
								compressedFileName,
								new RawSource(compressedResult)
							);
						});
					});
				}
			);
		});
	}
}

module.exports = BrotliPlugin;
