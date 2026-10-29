import { STORE } from '../constants';
import type { StoreContext } from '../context';
import { drawBench, drawRoundTier, drawShelfBay } from '../products/fixtures';
import { createRng } from '../random';
import { softShadow, zonePatch } from './common';
import { fillBoxShelf, fillCupShelf } from './cupShelf';

/**
 * D. Regalos y ediciones especiales (zona delantera izquierda): estanterías de sets en caja,
 * expositor redondo de tres niveles con regalos y tazas, banco bajo la vidriera y plantas.
 */
export function buildGiftsDepartment(ctx: StoreContext): void {
  const { batch: b, mats: m, products: p, signage } = ctx;
  b.label = 'gifts';
  const rng = createRng(404);

  zonePatch(ctx, m.floorWood, -4.4, 6.1, 5.0, 5.6);

  // Estanterías de sets de regalo en la pared izquierda.
  const levels = [0.5, 1.0, 1.5, 2.0, 2.5];
  [4.4, 6.4].forEach((z) => {
    b.group(-STORE.halfW + 0.18, 0, z, Math.PI / 2, () => {
      drawShelfBay(b, m, { w: 2.0, h: 2.64, d: 0.36, levels });
      for (let i = 0; i < 4; i += 1) {
        fillBoxShelf(ctx, rng, { w: 1.94, d: 0.36, y: levels[i] as number, maxH: 0.46 });
      }
      fillCupShelf(ctx, rng, { w: 1.94, d: 0.36, y: levels[4] as number, maxH: 0.4, theme: 'espresso', seg: 10 });
    });
  });
  softShadow(ctx, -6.55, 5.4, 0.5, 4.2);

  // Expositor redondo central de tres niveles.
  const cx = -3.3;
  const cz = 5.6;
  b.group(cx, 0, cz, 0, () => {
    const surfaces = drawRoundTier(b, m, {
      levels: [
        { r: 0.62, y: 0.5 },
        { r: 0.42, y: 0.9 },
        { r: 0.24, y: 1.25 },
      ],
    });
    // Corona inferior de cajas de regalo orientadas tangencialmente.
    const lower = 8;
    for (let i = 0; i < lower; i += 1) {
      const a = (i / lower) * Math.PI * 2;
      p.place(
        'giftBox',
        { x: Math.cos(a) * 0.45, y: surfaces[0] as number, z: Math.sin(a) * 0.45, ry: -a + Math.PI / 2 },
        { w: 0.2, h: i % 2 === 0 ? 0.2 : 0.14, d: 0.15, kind: (['set', 'navy', 'white', 'set'] as const)[i % 4] as 'set' | 'navy' | 'white' },
      );
    }
    // Corona media de cappuccino con platillo.
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      p.place('cup', { x: Math.cos(a) * 0.29, y: surfaces[1] as number, z: Math.sin(a) * 0.29 }, {
        shape: 'cappuccino',
        color: i % 2 === 0 ? 'white' : 'navy',
        inner: 'white',
        accent: { kind: 'rim', color: 'gold' },
        saucer: true,
        turn: -a,
        seg: 12,
      });
    }
    // Pieza estrella en la cima.
    p.place('cup', { y: surfaces[2] as number }, {
      shape: 'mug',
      color: 'navy',
      accent: { kind: 'stripe', color: 'gold' },
      scale: 1.9,
      seg: 16,
      turn: 0.5,
    });
  });
  softShadow(ctx, cx, cz, 1.4, 1.4);

  // Banco bajo la vidriera, plantas y rótulo de doble cara.
  b.group(-4.4, 0, 8.55, 0, () => drawBench(b, m, { len: 2.4 }));
  softShadow(ctx, -4.4, 8.55, 2.4, 0.5);
  p.place('plant', { x: -6.4, z: 8.45 }, { scale: 1.2 });
  p.place('plant', { x: -2.0, z: 8.45 }, { scale: 1.0 });
  signage.hanging('REGALOS', cx, 3.0, 7.0, 2.2, 0, 'navy', 0.42, undefined, true);
}
