import { STORE } from '../constants';
import type { StoreContext } from '../context';
import { drawShelfBay } from '../products/fixtures';
import { createRng } from '../random';
import { softShadow } from './common';
import { fillBoxShelf, fillCupShelf, type CupTheme } from './cupShelf';

/** Centros (z) de los cinco módulos de la pared izquierda; cada uno mide 2 m de ancho. */
const BAY_Z: readonly number[] = [-7.3, -5.2, -3.1, -1.0, 1.1];
/** Superficie superior de cada balda: la primera guarda sets en caja; las demás, tazas. */
const LEVELS: readonly number[] = [0.32, 0.8, 1.28, 1.76, 2.24, 2.72];

/** Tema de color por módulo y balda (de abajo hacia arriba, sin contar la balda de cajas). */
const THEMES: readonly (readonly CupTheme[])[] = [
  ['classic', 'classic', 'tall', 'classic', 'espresso'],
  ['earth', 'earth', 'earth', 'classic', 'tall'],
  ['espresso', 'classic', 'dark', 'dark', 'classic'],
  ['classic', 'tall', 'earth', 'espresso', 'classic'],
  ['dark', 'classic', 'classic', 'earth', 'classic'],
];

/**
 * A (1/3). Pared de tazas: cinco módulos de estantería del suelo al techo con tazas agrupadas
 * por color y forma (clásicas, térmicas, espresso, tonos tierra y oscuras), luz LED bajo cada
 * balda y un rótulo corrido.
 */
export function buildCupWall(ctx: StoreContext): void {
  const { batch: b, mats: m, signage } = ctx;
  b.label = 'cupWall';
  const rng = createRng(101);

  BAY_Z.forEach((z, bay) => {
    b.group(-STORE.halfW + 0.18, 0, z, Math.PI / 2, () => {
      drawShelfBay(b, m, { w: 2.0, h: 3.0, d: 0.36, levels: LEVELS });
      fillBoxShelf(ctx, rng, { w: 1.94, d: 0.36, y: LEVELS[0] as number, maxH: 0.42 });
      for (let level = 1; level < LEVELS.length; level += 1) {
        fillCupShelf(ctx, rng, {
          w: 1.94,
          d: 0.36,
          y: LEVELS[level] as number,
          maxH: 0.44,
          theme: (THEMES[bay] as readonly CupTheme[])[level - 1] as CupTheme,
          seg: 8,
        });
      }
    });
  });

  softShadow(ctx, -6.55, -3.1, 0.5, 10.4);
  signage.board('TAZAS', -6.9, 3.27, -3.1, 3.6, 0.36, Math.PI / 2, 'navy');
}

/**
 * A (2/3). Vitrina de colección premium en el fondo, a la izquierda: tazas y platillos con
 * borde dorado sobre baldas iluminadas.
 */
export function buildCupNiche(ctx: StoreContext): void {
  const { batch: b, mats: m, signage } = ctx;
  b.label = 'cupNiche';
  const rng = createRng(202);
  const levels = [0.5, 1.0, 1.5, 2.0, 2.5];
  const themes: readonly CupTheme[] = ['espresso', 'dark', 'espresso', 'classic'];

  b.group(-3.7, 0, -STORE.halfD + 0.2, 0, () => {
    drawShelfBay(b, m, { w: 2.2, h: 2.7, d: 0.32, levels });
    fillBoxShelf(ctx, rng, { w: 2.14, d: 0.32, y: levels[0] as number, maxH: 0.42 });
    themes.forEach((theme, i) => {
      fillCupShelf(ctx, rng, { w: 2.14, d: 0.32, y: levels[i + 1] as number, maxH: 0.42, theme, seg: 10 });
    });
  });
  signage.board('COLECCIÓN PREMIUM', -3.7, 3.0, -STORE.halfD + 0.1, 2.2, 0.3, 0, 'navy');
}
