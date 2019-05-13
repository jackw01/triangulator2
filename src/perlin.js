// 3D Perlin noise implementation
// This code is in the public domain

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

function lerp(t, a, b) { return a + t * (b - a); }

function grad(hash, x, y, z) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

module.exports = class PerlinNoise {
  constructor(rng) {
    this.permutation = [];
    for (let i = 0; i < 256; i++) this.permutation.push(i);

    for (let i = 256; i > 0; i--) {
      const randomIndex = Math.floor(rng() * i);
      const temporaryValue = this.permutation[i - 1];
      this.permutation[i - 1] = this.permutation[randomIndex];
      this.permutation[randomIndex] = temporaryValue;
    }

    for (let i = 0; i < 256; i++) this.permutation.push(this.permutation[i]);
  }

  noise(xi, yi, zi) {
    const X = Math.floor(xi) & 255;
    const Y = Math.floor(yi) & 255;
    const Z = Math.floor(zi) & 255;
    const x = xi - Math.floor(xi);
    const y = yi - Math.floor(yi);
    const z = zi - Math.floor(zi);
    const u = fade(x);
    const v = fade(y);
    const w = fade(z);
    const A = this.permutation[X] + Y;
    const AA = this.permutation[A] + Z;
    const AB = this.permutation[A + 1] + Z;
    const B = this.permutation[X + 1] + Y;
    const BA = this.permutation[B] + Z;
    const BB = this.permutation[B + 1] + Z;
    return (lerp(w, lerp(v, lerp(u, grad(this.permutation[AA], x, y, z),
      grad(this.permutation[BA], x - 1, y, z)),
    lerp(u, grad(this.permutation[AB], x, y - 1, z),
      grad(this.permutation[BB], x - 1, y - 1, z))),
    lerp(v, lerp(u, grad(this.permutation[AA + 1], x, y, z - 1),
      grad(this.permutation[BA + 1], x - 1, y, z - 1)),
    lerp(u, grad(this.permutation[AB + 1], x, y - 1, z - 1),
      grad(this.permutation[BB + 1], x - 1, y - 1, z - 1))))) + 0.5;
  }
};
