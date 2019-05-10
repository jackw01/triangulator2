// triangulator2 - SVG triangle art generator
// Copyright 2019 jackw01. Released under the MIT License (see LICENSE for details).

const yargs = require('yargs');
const fs = require('fs');
const window = require('svgdom');
const svg = require('svg.js')(window);
const svg2Img = require('svg2img');
const delaunator = require('delaunator');
const chroma = require('chroma-js');
const IterativePoissonDiscSampler = require('./poissondisc.js');
const PerlinNoise = require('./perlin.js');

// Utility stuff
// Map value
function map(x, inMin, inMax, outMin, outMax) {
  return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

// triangulator2
const triangulator = {
  GridMode: { Square: 1, Triangle: 2, Poisson: 3 },
};

triangulator.generate = function generate(input) {
  const options = input || {
    width: 1920,
    height: 1080,
    gridMode: triangulator.GridMode.Poisson,
    cellSize: 100,
    cellRandomness: 0.3,
    color: (x, y) => y,
    colorRandomness: 0.0,
    useGradientFill: true,
    gradientNegativeFactor: 0.03,
    gradientPositiveFactor: 0.03,
    colorPalette: ['#efee69', '#21313e'],
  };

  const gridOverdraw = 10;

  // Generate points
  const points = [];
  const cellRandomnessLimit = options.cellRandomness * options.cellSize;
  if (options.gridMode === triangulator.GridMode.Square) {
    for (let y = -gridOverdraw;
      y < options.height + gridOverdraw + options.cellSize;
      y += options.cellSize) {
      for (let x = -gridOverdraw;
        x < options.width + gridOverdraw + options.cellSize;
        x += options.cellSize) {
        points.push([
          x + Math.floor(Math.random() * (2 * cellRandomnessLimit + 1)) - cellRandomnessLimit,
          y + Math.floor(Math.random() * (2 * cellRandomnessLimit + 1)) - cellRandomnessLimit,
        ]);
      }
    }
  } else if (options.gridMode === triangulator.GridMode.Triangle) {
    let r = 0;
    for (let x = -gridOverdraw;
      x < options.width + gridOverdraw + options.cellSize;
      x += options.cellSize) {
      for (let y = -gridOverdraw + options.cellSize / Math.sqrt(3) * (r % 2);
        y < options.height + gridOverdraw + options.cellSize;
        y += options.cellSize) {
        points.push([
          x + Math.floor(Math.random() * (2 * cellRandomnessLimit + 1)) - cellRandomnessLimit,
          y + Math.floor(Math.random() * (2 * cellRandomnessLimit + 1)) - cellRandomnessLimit,
        ]);
      }
      r++;
    }
  } else if (options.gridMode === triangulator.GridMode.Poisson) {
    const sample = IterativePoissonDiscSampler(1.5 * options.width, 1.5 * options.height, options.cellSize);
    let nextPoint = sample();
    while (nextPoint) {
      points.push([nextPoint[0] - 0.25 * options.width, nextPoint[1] - 0.25 * options.height]);
      nextPoint = sample();
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

    // Get color/gradient for triangle and make path
    const colorIndex = options.color(normX, normY) + Math.random() * options.colorRandomness;
    let color;
    if (!options.useGradient) {
      // Use solid color
      color = scale(colorIndex);
    } else {
      // Generate gradient keypoints
      const i = Math.floor(Math.random() * 3);
      const p1 = tri[i];
      const p2 = tri[(i + 1 + Math.floor(Math.random() * 2)) % 3];
      const vector = [p2[0] - p1[0], p2[1] - p1[1]];
      const sign = Math.sign(vector[0] * vector[1]);
      let gradientNormPoint1 = vector.map(a => Math.abs(a));
      gradientNormPoint1 = gradientNormPoint1.map(a => a / Math.max(...gradientNormPoint1));

      color = draw.gradient('linear', (stop) => {
        stop.at(0, scale(colorIndex - options.gradientNegativeFactor * sign).hex());
        stop.at(1, scale(colorIndex + options.gradientPositiveFactor * sign).hex());
      }).from(0.0, 0.0).to(...gradientNormPoint1);
    }

    draw.polygon(tri.map(p => p.join(',')).join(' '))
      .fill(color).stroke({ color, width: 1 });
  });

  const svgString = draw.svg();

  svg2Img(svgString, (err, buffer) => {
    if (err) throw err;
    fs.writeFile('out.png', buffer, (err) => {
      if (err) throw err;
    });
  });

  fs.writeFile('out.svg', svgString, (err) => {
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
