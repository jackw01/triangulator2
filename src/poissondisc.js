// Iterative Poisson disc sampler
// Based on this implementation: https://www.jasondavies.com/poisson-disc/
// This code is in the public domain

module.exports = function IterativePoissonDiscSampler(width, height, radius) {
  const k = 30; // Maximum number of samples before rejection
  const radius2 = radius * radius;
  const R = 3 * radius2;
  const cellSize = radius * Math.SQRT1_2;
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);
  const grid = new Array(gridWidth * gridHeight);
  const queue = [];
  let queueSize = 0;
  let sampleSize = 0;

  function far(x, y) {
    let i = Math.floor(x / cellSize);
    let j = Math.floor(y / cellSize);
    const i0 = Math.max(i - 2, 0);
    const j0 = Math.max(j - 2, 0);
    const i1 = Math.min(i + 3, gridWidth);
    const j1 = Math.min(j + 3, gridHeight);

    for (j = j0; j < j1; ++j) {
      const o = j * gridWidth;
      for (i = i0; i < i1; ++i) {
        if (grid[o + i]) {
          const dx = grid[o + i][0] - x;
          const dy = grid[o + i][1] - y;
          if (dx * dx + dy * dy < radius2) return false;
        }
      }
    }

    return true;
  }

  function sample(x, y) {
    const s = [x, y];
    queue.push(s);
    grid[gridWidth * Math.floor(y / cellSize) + Math.floor(x / cellSize)] = s;
    sampleSize++;
    queueSize++;
    return s;
  }

  return function iterate() {
    // Pick a random point for the first sample
    if (!sampleSize) return sample(Math.random() * width, Math.random() * height);

    // Pick a random existing sample and remove it from the queue.
    while (queueSize) {
      const i = Math.floor(Math.random() * queueSize);

      // Make a new candidate between [radius, 2 * radius] from the existing sample.
      for (let j = 0; j < k; ++j) {
        const a = 2 * Math.PI * Math.random();
        const r = Math.sqrt(Math.random() * R + radius2);
        const x = queue[i][0] + r * Math.cos(a);
        const y = queue[i][1] + r * Math.sin(a);

        // Reject candidates that are outside the allowed extent,
        // or closer than 2 * radius to any existing sample.
        if (x >= 0 && x < width && y >= 0 && y < height && far(x, y)) return sample(x, y);
      }

      queue[i] = queue[--queueSize];
      queue.length = queueSize;
    }
    return false;
  };
};
