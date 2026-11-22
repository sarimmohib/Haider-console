import { ENGINE_REGISTRY } from '../core.js';
import action from './action.js';
import puzzle from './puzzle.js';
import reflex from './reflex.js';
import mind from './mind.js';
import enhanced from './enhanced.js';

for (const [key, cls] of Object.entries({ ...action, ...puzzle, ...reflex, ...mind, ...enhanced })) {
  ENGINE_REGISTRY[key] = cls;
}
export { ENGINE_REGISTRY };
