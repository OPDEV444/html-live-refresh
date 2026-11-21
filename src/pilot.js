export const directions = {
  down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0],
};
export const sprite = {
  width: 32, height: 48, anchor: [16, 46],
  rows: ['down', 'up', 'left', 'right'], cycle: [0, 1, 2, 3],
};

export function createPilot({ x, y, facing = 'down' }) {
  return { x, y, facing, step: null, stride: 0 };
}

export function beginStep(pilot, facing, running, canWalk) {
  if (pilot.step || !Object.hasOwn(directions, facing)) return false;
  pilot.facing = facing;
  const [dx, dy] = directions[facing];
  const x = pilot.x + dx;
  const y = pilot.y + dy;
  if (!canWalk(x, y)) return false;
  pilot.step = { x, y, elapsed: 0, duration: running ? 115 : 215 };
  return true;
}

export function advance(pilot, elapsed) {
  const step = pilot.step;
  if (!step) return;
  step.elapsed = Math.min(step.elapsed + elapsed, step.duration);
  if (step.elapsed === step.duration) {
    pilot.x = step.x;
    pilot.y = step.y;
    pilot.stride = 1 - pilot.stride;
    pilot.step = null;
  }
}

export function pose(pilot) {
  const step = pilot.step;
  if (!step) return { x: pilot.x, y: pilot.y, frame: 0 };
  const t = step.elapsed / step.duration;
  return {
    x: pilot.x + (step.x - pilot.x) * t,
    y: pilot.y + (step.y - pilot.y) * t,
    frame: sprite.cycle[pilot.stride * 2 + Number(t >= 0.35)],
  };
}
