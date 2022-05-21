const path = require('path');
const webpack = require('webpack');

module.exports = {
  // generate source maps
  devtool: 'source-map',

  // bundling mode
  mode: 'production',
  target: 'web',
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
  },

  // entry files
  entry: {
    convexus: path.resolve(__dirname, 'packages/convexus-demo/src/index.ts'),
  },

  // output bundles (location)
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].min.js',
    library: 'Convexus',
    libraryTarget: 'umd',
  },

  // file resolutions
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@convexus/sdk': path.resolve(
        __dirname,
        'packages/sdk/src/index.ts',
      ),
      '@convexus/sdk-core': path.resolve(
        __dirname,
        'packages/sdk-core/src/index.ts',
      ),
      '@convexus/sdk-demo': path.resolve(
        __dirname,
        'packages/sdk-demo/src/index.ts',
      )
    },
    modules: ['node_modules'],
  },

  // loaders
  module: {
    rules: [
      {
        test: /\.ts?/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },

  // plugins
  plugins: [
    new webpack.SourceMapDevToolPlugin({
      filename: '[file].map',
    }),
  ],

  // set watch mode to `true`
  watch: false,
};
