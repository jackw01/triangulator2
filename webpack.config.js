const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/triangulator.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
