// triangulator2 - SVG triangle art generator
// Copyright 2019 jackw01. Released under the MIT License (see LICENSE for details).

import seedrandom from 'seedrandom';
import Delaunator from 'delaunator';
import hash from 'object-hash';
import chroma from 'chroma-js';
import svgjs from 'svg.js';
import IterativePoissonDiscSampler from './poissondisc';
import PerlinNoise from './perlin';

// Utility stuff
// Distance to closest edge of image, for x and y values normalized to (0, 1)
function edgeDist(x, y) {
  return Math.min(Math.min(x, 1 - x), Math.min(y, 1 - y)) * 2;
}

let rng = Math.random;
let noiseGenerator = new PerlinNoise(rng);

// triangulator2
const triangulator = {
  pointCache: [],
  lastPointOptionsHash: '',
  GridMode: { Square: 1, Triangle: 2, Poisson: 3, Override: 4 },
  // Must return a scalar from 0 to 1
  ColorFunction: {
    Horizontal: (x, y) => x,
    Vertical: (x, y) => y,
    DiagonalFromLeft: (x, y) => (x + y) / 2,
    DiagonalFromRight: (x, y) => (1 - x + y) / 2,
    RadialFromCenter: (x, y) => Math.hypot(x - 0.5, y - 0.5) * Math.sqrt(2) * 1.1,
    RadialFromBottom: (x, y) => Math.hypot(x - 0.5, y - 1.5) - 0.5,
    FromEdges: (x, y) => edgeDist(x, y) * 0.3 + (1 - Math.hypot(x - 0.5, y - 0.5) * Math.sqrt(2)) * 0.7,
    Noise: (sx, sy) => (x, y) => noiseGenerator.noise(x * sx, y * sy, 0),
  },
  // Must return a vector with x and y from 0 to 1 as an array and a direction value (-1 or 1)
  GradientFunction: {
    Random: (triangle, x, y) => {
      const i = Math.floor(rng() * 3);
      const p2 = triangle[(i + 1 + Math.floor(rng() * 2)) % 3];
      const vector = [p2[0] - triangle[i][0], p2[1] - triangle[i][1]];
      const vectorAbs = [Math.abs(vector[0]), Math.abs(vector[1])];
      const max = Math.max(...vectorAbs);
      return {
        gradientVector: [vectorAbs[0] / max, vectorAbs[1] / max],
        gradientDirection: Math.sign(vector[0] * vector[1]),
      };
    },
  },
  generate: function generate(input, perfTest = false, c = console) {
    if (perfTest) c.time('total');
    if (perfTest) c.time('setup');
    const options = input || {
      isBrowser: false,
      svgInput: false,
      forceSVGSize: true,
      seed: Math.random(),
      width: 1920,
      height: 1080,
      gridMode: this.GridMode.Poisson,
      gridOverridde: false,
      cellSize: 100,
      cellRandomness: 0.3,
      color: this.ColorFunction.DiagonalFromLeft,
      colorScaleInvert: false,
      colorPalette: ['#efee69', '#21313e'],
      colorRandomness: 0.0,
      quantizeSteps: 0,
      colorOverride: false,
      useGradient: false,
      gradient: this.GradientFunction.Random,
      gradientNegativeFactor: 0.03,
      gradientPositiveFactor: 0.03,
      strokeColor: false,
      strokeWidth: false,
      strokeOnly: false,
      backgroundColor: '#000000',
    };

    // Non-global require is a bad practice but necessary here
    const svg = options.isBrowser ? svgjs : svgjs(require('svgdom'));

    const gridOverdraw = 100;

    // Set up RNG
    rng = seedrandom(`${options.seed}`);
    noiseGenerator = new PerlinNoise(rng);

    if (perfTest) c.timeEnd('setup');
    if (perfTest) c.time('points');

    // Generate points
    const points = [];
    let tris = [];
    const pointOptionsHash = hash([options.seed, options.width, options.height, options.gridMode,
      options.gridOverride, options.cellSize, options.cellRandomness]);
    if (pointOptionsHash !== this.lastPointOptionsHash) {
      this.lastPointOptionsHash = pointOptionsHash;

      const cellRandomnessLimit = options.cellRandomness * options.cellSize;
      if (options.gridMode === triangulator.GridMode.Square) {
        for (let y = -gridOverdraw;
          y < options.height + gridOverdraw + options.cellSize;
          y += options.cellSize) {
          for (let x = -gridOverdraw;
            x < options.width + gridOverdraw + options.cellSize;
            x += options.cellSize) {
            points.push([
              x + Math.floor(rng() * (2 * cellRandomnessLimit + 1)) - cellRandomnessLimit,
              y + Math.floor(rng() * (2 * cellRandomnessLimit + 1)) - cellRandomnessLimit,
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
              x + Math.floor(rng() * (2 * cellRandomnessLimit + 1)) - cellRandomnessLimit,
              y + Math.floor(rng() * (2 * cellRandomnessLimit + 1)) - cellRandomnessLimit,
            ]);
          }
          r++;
        }
      } else if (options.gridMode === triangulator.GridMode.Poisson) {
        const sample = IterativePoissonDiscSampler(1.5 * options.width, 1.5 * options.height,
          options.cellSize, rng);
        let nextPoint = sample();
        while (nextPoint) {
          points.push([nextPoint[0] - 0.25 * options.width, nextPoint[1] - 0.25 * options.height]);
          nextPoint = sample();
        }
      } else if (options.gridMode === triangulator.GridMode.Override) {
        points.push(...options.gridOverride);
      }

      // Triangulate
      const delaunay = Delaunator.from(points);
      for (let i = 0; i < delaunay.triangles.length; i += 3) {
        tris.push([
          points[delaunay.triangles[i]], points[delaunay.triangles[i + 1]], points[delaunay.triangles[i + 2]],
        ]);
      }

      this.pointCache = tris;
    } else {
      tris = this.pointCache;
    }

    if (perfTest) c.timeEnd('points');

    // Convert input colors to chroma.js scale
    const scale = chroma.scale(options.colorPalette).mode('hcl');

    // Create SVG context and draw
    const draw = svg(options.svgInput);
    if (options.forceSVGSize) draw.size(options.width, options.height);
    //draw.rect(options.width, options.height).fill(options.backgroundColor);

    // Reset rng after drawing points
    rng = seedrandom(`${options.seed}`);

    if (perfTest) c.time('draw');

    for (let i = 0; i < tris.length; i++) {
      // Find where the triangle's centroid lies on the gradient
      const normX = (tris[i][0][0] + tris[i][1][0] + tris[i][2][0]) / 3 / options.width;
      const normY = (tris[i][0][1] + tris[i][1][1] + tris[i][2][1]) / 3 / options.height;

      // Get color/gradient for triangle
      let color;

      if (!options.colorOverride) {
        // Determine where the color lies on the scale - quantize if necessary
        let colorIndex = options.color(normX, normY) + (rng() - 0.5) * options.colorRandomness;
        if (options.quantizeSteps) {
          colorIndex = Math.round(colorIndex * options.quantizeSteps) / (options.quantizeSteps - 1);
        }

        if (options.colorScaleInvert) colorIndex = 1 - colorIndex;

        if (!options.useGradient) { // Use solid color
          color = scale(colorIndex).hex();
        } else { // Generate gradient vector and direction
          const { gradientVector, gradientDirection } = options.gradient(tris[i], normX, normY);
          color = draw.gradient('linear', (stop) => {
            stop.at(0, scale(colorIndex - options.gradientNegativeFactor * gradientDirection).hex());
            stop.at(1, scale(colorIndex + options.gradientPositiveFactor * gradientDirection).hex());
          }).from(0.0, 0.0).to(...gradientVector);
        }
      } else {
        color = options.colorOverride(normX, normY);
      }

      draw.polygon(tris[i].map(p => p.join(',')).join(' '))
        .fill(options.strokeOnly ? options.backgroundColor : color)
        .stroke({ color: options.strokeColor || color, width: options.strokeWidth || 1 });
    }

    if (perfTest) c.timeEnd('draw');
    if (perfTest) c.timeEnd('total');
    return draw.svg();
  },
};

export default triangulator;
