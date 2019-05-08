// triangulator2 - SVG triangle art generator
// Copyright 2019 jackw01. Released under the MIT License (see LICENSE for details).

const yargs = require('yargs');
const svg = require('svg.js');
const delaunator = require('delaunator');
const chroma = require('chroma-js')
const perlin = require('./perlin.js');

// Utility stuff
// Map value
function map(x, inMin, inMax, outMin, outMax) {
  return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
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
    width: 1920,
    height: 1080,
    useSquareGrid: true,
    cellSize: 35,
    cellRandomness: 0.075,
    color: (x, y) => y,
    colorRandomness: 20,
    overscan: 10,
    colorPalette: ['#efee69', '#21313e'],
  };

  // Generate points
  const points = [];
  const cellRandomnessLimit = options.cellRandomness * options.cellSize;
  for (let x = -options.overscan;
       x < options.width + options.overscan + options.cellSize;
       x += options.cellSize) {
    for (let y = -options.overscan;
         y < options.height + options.overscan + options.cellSize;
         y += options.cellSize) {
      points.push([
        x + Math.floor(Math.random() * (2 * cellRandomnessLimit + 1)) - cellRandomnessLimit,
        y + Math.floor(Math.random() * (2 * cellRandomnessLimit + 1)) - cellRandomnessLimit,
      ]);
    }
  }

  // Triangulate
  const delaunay = delaunator.from(points);
  const trianglePoints = [];
  for (let i = 0; i < delaunay.triangles.length; i += 3) {
    trianglePoints.push([
      points[delaunay.triangles[i]], points[delaunay.triangles[i + 1]],  points[delaunay.triangles[i + 2]],
    ]);
  }
  console.log(trianglePoints);

  // Convert input colors to chroma.js scale
  const scale = chroma.scale(options.colorPalette.map(chroma)).mode('hcl');
  console.log(scale(0));
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

  triangulator.generate();
}
