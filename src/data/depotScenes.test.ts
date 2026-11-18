import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  AUTH_BACKDROP_SCENES,
  DEPOT_SCENES,
  HERO_FEATURED_SCENES,
  SUBSYSTEM_BANNER_SCENES,
} from './depotScenes';

test('DEPOT_SCENES references all 22 existing local 3D depot images with unique IDs', () => {
  assert.equal(DEPOT_SCENES.length, 22);
  const ids = new Set(DEPOT_SCENES.map((s) => s.id));
  assert.equal(ids.size, 22);

  DEPOT_SCENES.forEach((scene) => {
    assert.ok(scene.src.startsWith('/assets/aistudio/'));
    const diskPath = path.resolve(process.cwd(), 'public', scene.src.slice(1));
    assert.ok(fs.existsSync(diskPath), `Missing image asset on disk: ${diskPath}`);
  });

  assert.ok(AUTH_BACKDROP_SCENES.length >= 3);
  assert.ok(HERO_FEATURED_SCENES.length >= 4);
  assert.ok(SUBSYSTEM_BANNER_SCENES.tanks.src.includes('IMG_3585'));
});
