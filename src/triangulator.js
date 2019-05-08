// triangulator2 - SVG triangle art generator
// Copyright 2019 jackw01. Released under the MIT License (see LICENSE for details).

const yargs = require('yargs');
const svg = require('svg.js');
const chroma = require('chroma-js')
const perlin = require('perlin.js');

// Utility stuff
// Map value
function map(x, inMin, inMax, outMin, outMax) {
  return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

// Random int
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Finds the centroid of a group of points
function centroid(points) {
  return [
    points.reduce((a, b) => a[0] + b[0], 0) / points.length,
    points.reduce((a, b) => a[1] + b[1], 0) / points.length
  ];
}

// triangulator2
const triangulator = {};

triangulator.generate = function generate(input) {
  const options = input || {
    cellSize = 35,
    randomness = 0.075,
    colorMode = 1,
    noiseScale = { x: 1, y: 1 },
    colorRandomness = 20,
    overscan = 10,
    colors = [chroma("#efee69").hsl(), chroma("#21313e").hsl()],
  };

  
}

// Run the bot automatically if module is run instead of imported
if (!module.parent) {
  const args = yargs.usage('Usage: triangulator2 [options]')
    .alias('c', 'configDir')
    .nargs('c', 1)
    .describe('c', 'Config directory (defaults to ~/.liora-bot/)')
    .boolean('openConfig')
    .describe('openConfig', 'Open config.json in the default text editor')
    .boolean('generateDocs')
    .describe('generateDocs', 'Generate Markdown file containing command documenation.')
    .help('h')
    .alias('h', 'help')
    .epilog('Liora Discord bot copyright 2018 jackw01. Released under the MIT license.')
    .argv;

}
