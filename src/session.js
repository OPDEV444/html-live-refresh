import { canEnter, garden } from './world.js';
import { directions } from './pilot.js';

const saveKey = 'verdant-vale.garden.v1';
export function readSave(storage, map) {
  const raw = storage.getItem(saveKey);
  if (raw === null) return null;
  const s = JSON.parse(raw);
  if (s?.version !== 1 || s.area !== garden.id || !canEnter(garden, map, s.x, s.y) ||
      !Object.hasOwn(directions, s.facing) || typeof s.hasPass !== 'boolean' ||
      !['Standard', 'Fast', 'Instant'].includes(s.textSpeed)) {
    throw new Error('Unsupported save');
  }
  return s;
}
export function writeSave(storage, pilot, state) {
  storage.setItem(saveKey, JSON.stringify({
    version: 1, area: garden.id, x: pilot.x, y: pilot.y, facing: pilot.facing,
    hasPass: state.hasPass, textSpeed: state.textSpeed,
  }));
}
