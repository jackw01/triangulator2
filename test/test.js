const fs = require('fs');
const window = require('svgdom');
const svg2Img = require('svg2img');
const triangulator = require('../src/triangulator.js');

const svgString = triangulator.generate({
  svgInput: window.document.documentElement,
  seed: 4,
  width: 3840,
  height: 2160,
  gridMode: triangulator.GridMode.Poisson,
  gridOverride: false,
  cellSize: 150,
  cellRandomness: 0.2,
  colorOverride: false,
  color: triangulator.ColorFunction.RadialFromBottom,
  colorPalette: ['#e7a71d', '#dc433e', '#9e084b', '#41062f'],
  colorRandomness: 0.15,
  quantizeSteps: 0,
  useGradient: true,
  gradient: triangulator.GradientFunction.Random,
  gradientNegativeFactor: 0.03,
  gradientPositiveFactor: 0.03,
  strokeColor: false,
  strokeWidth: 1,
});

svg2Img(svgString, (err, buffer) => {
  if (err) throw err;
  fs.writeFile('out.png', buffer, (err) => {
    if (err) throw err;
  });
});

fs.writeFile('out.svg', svgString, (err) => {
  if (err) throw err;
});
