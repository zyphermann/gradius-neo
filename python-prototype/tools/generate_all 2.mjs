import { execFileSync } from 'node:child_process';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const generator = path.join(import.meta.dirname, 'generate_monolithic_game.mjs');

const targets = [
  [],
  [
    'browser-prototype-ts/src/game/direct/entities/AuxiliaryEntitySystem.ts',
    'src/gradius_neo/auxiliary_entities_generated.py',
  ],
];

for (const arguments_ of targets) {
  execFileSync(process.execPath, [generator, ...arguments_], { cwd: projectRoot, stdio: 'inherit' });
}

