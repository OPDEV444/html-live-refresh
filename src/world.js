import { createGroundMap, paintGround } from './terrain.js';

export const route = [
  ['garden', 'The Garden'],
  ['mistilteinn', 'Plantation 13 / Mistilteinn'],
  ['cerasus', 'Cerasus Inner City'],
  ['town', 'Abandoned Town'],
  ['crevasse', 'Gran Crevasse'],
  ['orbit', 'Mars Orbit'],
  ['virm', 'VIRM Homeworld'],
  ['earth', 'New Community / Earth'],
];

export const garden = {
  id: route[0][0],
  name: route[0][1],
  createMap: createGroundMap,
  paint: paintGround,
  spawn: { x: 43, y: 29 },
  objects: [{ kind: 'relay', x: 44, y: 29, solid: true }],
};

export function canEnter(area, map, x, y) {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 &&
    x < map.width && y < map.height && !area.objects.some(o => o.solid && o.x === x && o.y === y);
}

export function adjacentRelay(area, player) {
  return area.objects.some(o => o.kind === 'relay' && Math.abs(o.x - player.x) + Math.abs(o.y - player.y) <= 1);
}
