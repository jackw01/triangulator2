require('@babel/register')({
  presets: ['@babel/preset-env'],
});

module.exports = require('./triangulator.js').default;
