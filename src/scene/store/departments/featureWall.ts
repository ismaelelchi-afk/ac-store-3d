import { STORE } from '../constants';
import type { StoreContext } from '../context';
import { drawPlinth } from '../products/fixtures';
import { softShadow } from './common';

/**
 * Pared de marca al final del pasillo: panel azul marino con marco dorado, monograma A/C y
 * dos plintos con las piezas estrella de la tienda (una taza y un garrafón gigantes).
 */
export function buildFeatureWall(ctx: StoreContext): void {
  const { batch: b, mats: m, products: p, signage } = ctx;
  b.label = 'feature';
  const wallZ = -STORE.halfD;

  // Panel y marco.
  b.box(m.navy, 4.8, STORE.height, 0.1, 0, STORE.height / 2, wallZ + 0.05);
  for (const side of [-1, 1]) {
    b.box(m.goldMatte, 0.05, STORE.height, 0.13, side * 2.4, STORE.height / 2, wallZ + 0.065);
    b.box(m.ledWarm, 0.02, 3.0, 0.02, side * 2.31, 1.75, wallZ + 0.11);
  }
  b.box(m.goldMatte, 4.8, 0.03, 0.12, 0, 3.12, wallZ + 0.06);
  b.box(m.goldMatte, 4.8, 0.03, 0.12, 0, 0.12, wallZ + 0.06);

  // Halo cálido detrás del monograma y rótulo.
  b.plane(m.lightPool, 4.6, 2.8, 0, 2.2, wallZ + 0.101);
  signage.textPlane('A/C', 'textGold', 0, 2.2, wallZ + 0.104, 4.4, 2.0, 0, 'TAZAS Y GARRAFAS');

  // Plintos con las piezas estrella.
  for (const side of [-1, 1]) {
    const x = side * 1.55;
    b.group(x, 0, -8.5, 0, () => drawPlinth(b, m, { w: 0.8, d: 0.6, h: 0.5 }));
    softShadow(ctx, x, -8.5, 0.8, 0.6);
  }
  p.place('cup', { x: -1.55, y: 0.5, z: -8.5 }, {
    shape: 'mug',
    color: 'white',
    inner: 'white',
    accent: { kind: 'stripe', color: 'gold' },
    scale: 5,
    seg: 24,
    turn: 0,
  });
  p.place('jug', { x: 1.55, y: 0.5, z: -8.5 }, { capacity: '20', label: 'blue20', cap: 'blue', scale: 1.35, seg: 20 });
}
