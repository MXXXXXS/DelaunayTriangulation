const { ProvidePlugin } = require('webpack')
const { resolve } = require('path')

const workspace = resolve(__dirname, '..')
const public = resolve(workspace, 'src/public')

const entry = resolve(workspace, 'src/app.tsx')

//HTMLWebpackPlugin's options
const HTMLWebpackPlugin = require('html-webpack-plugin')
const htmlTemplate = resolve(public, 'index.html')
const favicon = resolve(public, 'favicon.ico')

const config = (isProduction, outputDir) => ({
  // target: 'electron-renderer',
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? undefined : 'source-map',
  // devServer: {
  //   port: '3003',
  //   static: './src/app/public',
  // },
  module: {
    rules: [
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              typescript: true,
            },
          },
        ],
      },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.html?$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              minimize: isProduction,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    alias: {
      '~': resolve(workspace, 'src'),
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
  entry: {
    app: entry,
  },
  output: {
    filename: '[name].js',
    path: resolve(outputDir, 'app'),
    // publicPath: '/'
  },
  plugins: [
    // new HTMLWebpackPlugin({
    //   template: htmlTemplate,
    //   // favicon: favicon,
    //   filename: 'index.html',
    // }),
    new ProvidePlugin({
      styled: [
        resolve(
          workspace,
          'node_modules/styled-components/dist/styled-components.cjs.js'
        ),
        'default',
      ],
      React: 'react',
    }),
  ],
})

module.exports = config
