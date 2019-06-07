const fs = require('fs');
const window = require('svgdom');
const svg2Img = require('svg2img');
const Triangulator = require('../src/index.js');

const svgString = Triangulator.generate({
  isBrowser: false,
  svgInput: window.document.documentElement,
  forceSVGSize: true,
  seed: Math.random(),
  width: 1920,
  height: 1080,
  gridMode: Triangulator.GridMode.Poisson,
  gridOverridde: false,
  cellSize: 100,
  cellRandomness: 0.3,
  colorOverride: false,
  color: Triangulator.ColorFunction.DiagonalFromLeft,
  colorScaleInvert: false,
  colorPalette: ['#efee69', '#21313e'],
  colorRandomness: 0.0,
  quantizeSteps: 0,
  useGradient: false,
  gradient: Triangulator.GradientFunction.Random,
  gradientNegativeFactor: 0.03,
  gradientPositiveFactor: 0.03,
  strokeColor: false,
  strokeWidth: false,
  strokeOnly: false,
  backgroundColor: '#000000',
});

console.log('writing...');

svg2Img(svgString, (err, buffer) => {
  if (err) console.log(err);

  fs.writeFile('out.png', buffer, (err) => {
    if (err) console.log(err);
  });
});

fs.writeFile('out.svg', svgString, (err) => {
  if (err) console.log(err);
});
