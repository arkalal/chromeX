const path = require('path');
const Dotenv = require('dotenv-webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './background.js',
    content: './content.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'production',
  plugins: [
    new Dotenv({
      safe: true, // load '.env.example' to verify the '.env' variables are all set
      systemvars: true, // load all system variables as well
      silent: true, // hide any errors
    }),
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '' },
        { from: 'popup.html', to: '' },
        { from: 'popup.js', to: '' },
        { from: 'content.css', to: '' },
        { from: 'popup.css', to: '' },
        { from: 'icons', to: 'icons' },
        { from: 'images', to: 'images', noErrorOnMissing: true },
        { from: 'styles', to: 'styles', noErrorOnMissing: true },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
