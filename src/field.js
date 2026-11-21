import { TILE_SIZE } from './terrain.js';
import { pose, sprite } from './pilot.js';
import sheetUrl from './assets/pilot-walk.png';

function drawRelay(ctx, x, y) {
  ctx.fillStyle = '#303649';
  ctx.fillRect(x - 6, y - 3, 13, 3);
  ctx.fillRect(x - 3, y - 12, 7, 10);
  ctx.fillRect(x - 7, y - 20, 15, 11);
  ctx.fillStyle = '#9da6ae';
  ctx.fillRect(x - 5, y - 19, 11, 8);
  ctx.fillRect(x - 2, y - 9, 3, 6);
  ctx.fillStyle = '#174755';
  ctx.fillRect(x - 4, y - 18, 9, 5);
  ctx.fillStyle = '#83efed';
  ctx.fillRect(x - 3, y - 17, 5, 1);
  ctx.fillRect(x - 3, y - 15, 3, 1);
  ctx.fillStyle = '#fb4a8a';
  ctx.fillRect(x + 3, y - 11, 2, 1);
}

const renderObject = { relay: drawRelay };

export async function createField(canvas, overview, area, map) {
  const sheet = new Image();
  sheet.src = sheetUrl;
  await sheet.decode();
  const ctx = canvas.getContext('2d', { alpha: false });
  const ground = document.createElement('canvas');
  ground.width = map.width * TILE_SIZE;
  ground.height = map.height * TILE_SIZE;
  area.paint(ground.getContext('2d'), map);
  const mini = overview.getContext('2d');
  overview.width = map.width * 2;
  overview.height = map.height * 2;
  const overviewTerrain = document.createElement('canvas');
  overviewTerrain.width = overview.width;
  overviewTerrain.height = overview.height;
  overviewTerrain.getContext('2d').drawImage(ground, 0, 0, overview.width, overview.height);
  const objects = [...area.objects].sort((a, b) => a.y - b.y);

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const zoom = bounds.width > 460 ? 3 : 2;
    canvas.width = Math.max(1, Math.round(bounds.width / zoom));
    canvas.height = Math.max(1, Math.round(bounds.height / zoom));
  }

  function draw(pilot) {
    const p = pose(pilot);
    const footX = Math.round((p.x + 0.5) * TILE_SIZE);
    const footY = Math.round((p.y + 0.8) * TILE_SIZE);
    const camera = (v, screen, limit) => Math.max(0, Math.min(v - Math.floor(screen / 2), limit - screen));
    const left = camera(footX, canvas.width, ground.width);
    const top = camera(footY - 12, canvas.height, ground.height);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#83b960';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(ground, -left, -top);
    const drawProp = o => renderObject[o.kind](ctx, (o.x + 0.5) * TILE_SIZE - left, Math.round((o.y + 0.8) * TILE_SIZE) - top);
    for (const o of objects) if (o.y <= p.y) drawProp(o);
    ctx.drawImage(sheet, p.frame * sprite.width, sprite.rows.indexOf(pilot.facing) * sprite.height,
      sprite.width, sprite.height, footX - left - sprite.anchor[0], footY - top - sprite.anchor[1], sprite.width, sprite.height);
    for (const o of objects) if (o.y > p.y) drawProp(o);
    mini.drawImage(overviewTerrain, 0, 0);
    mini.fillStyle = '#232032';
    mini.fillRect(pilot.x * 2 - 2, pilot.y * 2 - 2, 6, 6);
    mini.fillStyle = '#ff3982';
    mini.fillRect(pilot.x * 2 - 1, pilot.y * 2 - 1, 4, 4);
  }
  return { resize, draw };
}
