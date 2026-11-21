import { GROUND, TILE_SIZE } from './terrain.js';

// Each logical asset is a distinct image. All paths are relative to Vite's BASE_URL.
export const WORLD_ASSETS = Object.freeze({
  grass: 'grass.svg',
  grassLight: 'grass-light.svg',
  grassTall: 'grass-tall.svg',
  path: 'path.svg',
  pathEdge: 'path-edge.svg',
  flowers: 'flowers.svg',
  paving: 'paving.svg',
  water: 'water.svg',
  plantation: 'plantation-main.png',
  dormitory: 'dormitory.svg',
  clinic: 'clinic.svg',
  lab: 'research-lab.svg',
  sakura: 'sakura-tree.svg',
  pine: 'pine-tree.svg',
  bush: 'bush.svg',
  flowerbed: 'flowerbed.svg',
  rock: 'rock.svg',
  terminal: 'terminal.svg',
  lamp: 'lamp.svg',
  bench: 'bench.svg',
  fence: 'fence.svg',
  banner: 'banner.svg',
  sign: 'sign.svg',
  planter: 'planter.svg',
});

const TILES = {
  [GROUND.GRASS]: 'grass',
  [GROUND.LONG_GRASS]: 'grassTall',
  [GROUND.LIGHT_GRASS]: 'grassLight',
  [GROUND.PATH]: 'path',
  [GROUND.PATH_EDGE]: 'pathEdge',
  [GROUND.FLOWERS]: 'flowers',
};

export async function loadWorldAssets() {
  const root = import.meta.env.BASE_URL + 'assets/world/';
  const pairs = await Promise.all(Object.entries(WORLD_ASSETS).map(([id, file]) =>
    new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve([id, image]);
      image.onerror = () => resolve([id, null]);
      image.src = root + file;
    }),
  ));
  return Object.fromEntries(pairs);
}

// Tiles paint over the procedural fallback when image assets have loaded.
function draw(ctx, assets, key, x, y, width, height) {
  const image = assets[key];
  if (!image) return;
  ctx.drawImage(image, Math.round(x), Math.round(y), width, height);
}

const buildings = [
  ['plantation', 610, 215, 192, 154],
  ['dormitory', 172, 215, 144, 115],
  ['clinic', 1020, 205, 128, 110],
  ['lab', 855, 652, 152, 118],
];

const foliage = [
  ['sakura', 460, 135, 75, 87], ['sakura', 820, 127, 69, 79],
  ['sakura', 335, 355, 66, 76], ['sakura', 1040, 410, 76, 87],
  ['sakura', 165, 695, 74, 87], ['sakura', 1100, 742, 72, 85],
  ['sakura', 548, 765, 69, 78], ['sakura', 915, 860, 75, 86],
  ['pine', 458, 562, 45, 73], ['pine', 720, 696, 47, 73],
  ['pine', 950, 485, 49, 77], ['pine', 95, 264, 50, 76],
  ['pine', 1200, 490, 48, 74], ['pine', 340, 840, 47, 75],
  ['bush', 575, 170, 43, 30], ['bush', 793, 365, 42, 30],
  ['bush', 525, 690, 44, 32], ['bush', 849, 525, 41, 31],
  ['bush', 1100, 350, 45, 32], ['bush', 252, 570, 42, 31],
  ['flowerbed', 550, 390, 50, 28], ['flowerbed', 808, 400, 50, 28],
  ['flowerbed', 418, 475, 50, 28], ['flowerbed', 1038, 580, 50, 28],
  ['flowerbed', 100, 660, 49, 28], ['flowerbed', 700, 816, 50, 28],
  ['rock', 140, 530, 30, 23], ['rock', 348, 710, 30, 23],
  ['rock', 1160, 610, 30, 23], ['rock', 945, 775, 32, 24],
];

const fixtures = [
  ['terminal', 829, 272, 32, 51],
  ['banner', 563, 311, 28, 66], ['banner', 845, 323, 28, 66],
  ['lamp', 585, 430, 23, 63], ['lamp', 844, 475, 23, 63],
  ['bench', 470, 493, 54, 33], ['bench', 917, 492, 53, 33],
  ['sign', 804, 557, 38, 44],
  ['planter', 582, 345, 47, 32], ['planter', 798, 342, 47, 32],
  ['fence', 371, 389, 49, 30], ['fence', 420, 389, 49, 30],
  ['fence', 935, 397, 49, 30], ['fence', 984, 397, 49, 30],
];

export function paintEnvironment(ctx, map, assets) {
  ctx.imageSmoothingEnabled = false;

  // Preserve the original grass/path layout, but replace its texture with distinct images.
  for (let row = 0; row < map.height; row += 1) {
    for (let col = 0; col < map.width; col += 1) {
      const type = map.tiles[row * map.width + col];
      draw(ctx, assets, TILES[type], col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  // A small shoreline and plaza use separate water and paving tiles.
  for (let row = 39; row < 49; row += 1) {
    for (let col = 3; col < 15; col += 1) {
      const inLake = ((col - 9) ** 2 / 37) + ((row - 44) ** 2 / 22) < 1;
      if (inLake) draw(ctx, assets, 'water', col * TILE_SIZE, row * TILE_SIZE, 16, 16);
    }
  }

  for (let row = 23; row < 28; row += 1) {
    for (let col = 39; col < 50; col += 1) {
      draw(ctx, assets, 'paving', col * TILE_SIZE, row * TILE_SIZE, 16, 16);
    }
  }

  // Back-to-front sprite layering avoids smaller decorations looking cut off.
  for (const [key, x, y, w, h] of [...buildings, ...foliage, ...fixtures]
    .sort((a, b) => (a[2] + a[4]) - (b[2] + b[4]))) {
    draw(ctx, assets, key, x, y, w, h);
  }
}
