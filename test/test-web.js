const triangulator = require('../src/triangulator.js');

window.onload = () => {
  const svgString = triangulator.generate({
    svgInput: 'drawing',
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

  console.log(svgString);
};
