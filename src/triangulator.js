// triangulator2 - SVG triangle art generator
// Copyright 2019 jackw01. Released under the MIT License (see LICENSE for details).

const yargs = require('yargs');
const fs = require('fs');
const window = require('svgdom');
const svg = require('svg.js')(window);
const delaunator = require('delaunator');
const chroma = require('chroma-js');
const perlin = require('./perlin.js');

// Utility stuff
// Map value
function map(x, inMin, inMax, outMin, outMax) {
  return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
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
    colorRandomness: 0.0,
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
      points[delaunay.triangles[i]], points[delaunay.triangles[i + 1]], points[delaunay.triangles[i + 2]],
    ]);
  }

  // Convert input colors to chroma.js scale
  const scale = chroma.scale(options.colorPalette).mode('hcl');

  // Create SVG context and draw
  const draw = svg(window.document.documentElement);
  draw.size(options.width, options.height);

  trianglePoints.forEach((tri) => {
    // Find where the triangle's centroid lies on the gradient
    const normX = map(tri.reduce((a, b) => a + b[0], 0) / 3, 0, options.width, 0, 1);
    const normY = map(tri.reduce((a, b) => a + b[1], 0) / 3, 0, options.height, 0, 1);

    // Get color of triangle and make path
    const color = scale(options.color(normX, normY) + Math.random() * options.colorRandomness);
    const path = draw.polygon(tri.map(p => p.join(',')).join(' ')).fill(color.hex())//.stroke({ width: 1 });
  });

  fs.writeFile('out.svg', draw.svg(), (err) => {
    if (err) throw err;
  });
};

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
