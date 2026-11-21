// A deterministic, ground-only, top-down tilemap. No player or props.
export const TILE_SIZE = 16;
export const MAP_WIDTH = 84;
export const MAP_HEIGHT = 64;

export const GROUND = Object.freeze({
  GRASS: 0,
  LONG_GRASS: 1,
  LIGHT_GRASS: 2,
  PATH: 3,
  PATH_EDGE: 4,
  FLOWERS: 5,
});

function hash(x, y, salt = 0) {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(salt + 1, 1442695041)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function noise(x, y, salt) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const top = hash(ix, iy, salt) * (1 - sx) + hash(ix + 1, iy, salt) * sx;
  const bottom = hash(ix, iy + 1, salt) * (1 - sx) + hash(ix + 1, iy + 1, salt) * sx;
  return top * (1 - sy) + bottom * sy;
}

export function groundAt(col, row) {
  // Two wandering, intersecting walking paths, made entirely of ground tiles.
  const verticalCenter = 39 + 7.8 * Math.sin(row * 0.09) + 2.1 * Math.sin(row * 0.27);
  const horizontalCenter = 33 + 4.4 * Math.sin(col * 0.11) + 1.7 * Math.sin(col * 0.26);
  const verticalDistance = Math.abs(col - verticalCenter) - (2.1 + noise(col * 0.19, row * 0.19, 9) * 0.9);
  const horizontalDistance = Math.abs(row - horizontalCenter) - (1.65 + noise(col * 0.18, row * 0.18, 10) * 0.6);
  const distanceToPath = Math.min(verticalDistance, horizontalDistance);

  if (distanceToPath < -0.25) return GROUND.PATH;
  if (distanceToPath < 0.55) return GROUND.PATH_EDGE;

  // Broad, irregular meadows avoid a monotonous random-tile checkerboard.
  const meadow = noise(col * 0.115, row * 0.115, 21) * 0.76
    + noise(col * 0.33, row * 0.33, 31) * 0.24;

  if (meadow > 0.61) return GROUND.LONG_GRASS;
  if (meadow < 0.35) return GROUND.LIGHT_GRASS;
  if (hash(col, row, 43) > 0.947) return GROUND.FLOWERS;
  return GROUND.GRASS;
}

export function createGroundMap(width = MAP_WIDTH, height = MAP_HEIGHT) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new RangeError('Map dimensions must be positive integers');
  }

  const tiles = new Uint8Array(width * height);
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      tiles[row * width + col] = groundAt(col, row);
    }
  }
  return { width, height, tiles };
}

export function getTile(map, col, row) {
  if (col < 0 || row < 0 || col >= map.width || row >= map.height) return null;
  return map.tiles[row * map.width + col];
}

const BASE = {
  [GROUND.GRASS]: ['#83b960', '#81b55d', '#88bb64'],
  [GROUND.LONG_GRASS]: ['#659e4c', '#6ba352', '#6da550'],
  [GROUND.LIGHT_GRASS]: ['#9ac66c', '#9dc76d', '#96c269'],
  [GROUND.PATH]: ['#cba576', '#c8a170', '#d0aa79'],
  [GROUND.PATH_EDGE]: ['#bfa16e', '#c5a776', '#bda06f'],
  [GROUND.FLOWERS]: ['#86ba61', '#8abc65', '#83b85e'],
};

const DETAILS = {
  grass: ['#73a854', '#9ac770', '#6da450', '#a4cc75'],
  dark: ['#548a43', '#81b362', '#497f3d', '#94bc6e'],
  light: ['#86b85f', '#b0d57b', '#8fbf61', '#c0da8a'],
  earth: ['#b68d60', '#dbb889', '#ac8960', '#dfbd8d'],
};

function tuft(ctx, x, y, dark = false) {
  ctx.fillStyle = dark ? '#437b3b' : '#599647';
  ctx.fillRect(x, y + 2, 1, 2);
  ctx.fillRect(x - 2, y + 1, 1, 2);
  ctx.fillRect(x + 2, y, 1, 3);
  ctx.fillStyle = dark ? '#80b360' : '#b2d57d';
  ctx.fillRect(x + 1, y + 1, 1, 2);
}

function flower(ctx, x, y, seed) {
  ctx.fillStyle = seed > 0.5 ? '#f7e9d0' : '#f6bdd0';
  ctx.fillRect(x + 1, y, 1, 1);
  ctx.fillRect(x, y + 1, 1, 1);
  ctx.fillRect(x + 2, y + 1, 1, 1);
  ctx.fillRect(x + 1, y + 2, 1, 1);
  ctx.fillStyle = '#f4ce67';
  ctx.fillRect(x + 1, y + 1, 1, 1);
}

function drawTile(ctx, col, row, type) {
  const x = col * TILE_SIZE;
  const y = row * TILE_SIZE;
  const variant = Math.floor(hash(col, row, 2) * 3);
  ctx.fillStyle = BASE[type][variant];
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  const isPath = type === GROUND.PATH || type === GROUND.PATH_EDGE;
  const detail = isPath ? DETAILS.earth
    : type === GROUND.LONG_GRASS ? DETAILS.dark
      : type === GROUND.LIGHT_GRASS ? DETAILS.light : DETAILS.grass;

  // Tiny, deliberately blocky texture so every tile reads as pixel art.
  for (let i = 0; i < 11; i += 1) {
    const px = Math.floor(hash(col * 31 + i, row, 3) * 15);
    const py = Math.floor(hash(col, row * 29 + i, 4) * 16);
    ctx.fillStyle = detail[Math.floor(hash(col, row, i + 100) * detail.length)];
    ctx.fillRect(x + px, y + py, i % 4 === 0 ? 2 : 1, 1);
  }

  if (isPath) {
    // Dust, compacted soil, and tiny embedded stones (not raised objects).
    for (let i = 0; i < 3; i += 1) {
      const px = 2 + Math.floor(hash(col, row, i + 50) * 12);
      const py = 2 + Math.floor(hash(col, row, i + 60) * 12);
      ctx.fillStyle = i === 1 ? '#e7c99b' : '#af865c';
      ctx.fillRect(x + px, y + py, i === 1 ? 2 : 1, 1);
    }
    return;
  }

  const blades = type === GROUND.LONG_GRASS ? 5 : 2;
  for (let i = 0; i < blades; i += 1) {
    const tx = x + 3 + Math.floor(hash(col, row, 200 + i) * 10);
    const ty = y + 2 + Math.floor(hash(col, row, 210 + i) * 10);
    tuft(ctx, tx, ty, type === GROUND.LONG_GRASS);
  }

  if (type === GROUND.FLOWERS) {
    flower(ctx, x + 4, y + 3, hash(col, row, 301));
    flower(ctx, x + 10, y + 10, hash(col, row, 302));
  }
}

function featherEdges(ctx, map, col, row, type) {
  if (type !== GROUND.PATH && type !== GROUND.PATH_EDGE) return;
  const x = col * TILE_SIZE;
  const y = row * TILE_SIZE;
  const sides = [
    { dx: -1, dy: 0, side: 'left' },
    { dx: 1, dy: 0, side: 'right' },
    { dx: 0, dy: -1, side: 'top' },
    { dx: 0, dy: 1, side: 'bottom' },
  ];

  for (const { dx, dy, side } of sides) {
    const neighbor = getTile(map, col + dx, row + dy);
    if (neighbor === null || neighbor === GROUND.PATH || neighbor === GROUND.PATH_EDGE) continue;
    for (let i = 0; i < 4; i += 1) {
      const depth = 1 + Math.floor(hash(col * 5 + i, row * 5 + i, 401) * 3);
      const along = i * 4 + Math.floor(hash(col, row, 420 + i) * 3);
      ctx.fillStyle = i % 2 ? '#83b960' : '#76ae57';
      if (side === 'left') ctx.fillRect(x, y + along, depth, 2);
      if (side === 'right') ctx.fillRect(x + TILE_SIZE - depth, y + along, depth, 2);
      if (side === 'top') ctx.fillRect(x + along, y, 2, depth);
      if (side === 'bottom') ctx.fillRect(x + along, y + TILE_SIZE - depth, 2, depth);
    }
  }
}

export function paintGround(ctx, map) {
  ctx.imageSmoothingEnabled = false;
  for (let row = 0; row < map.height; row += 1) {
    for (let col = 0; col < map.width; col += 1) {
      drawTile(ctx, col, row, getTile(map, col, row));
    }
  }
  for (let row = 0; row < map.height; row += 1) {
    for (let col = 0; col < map.width; col += 1) {
      featherEdges(ctx, map, col, row, getTile(map, col, row));
    }
  }
}
