import type { StoreContext } from '../context';
import { cupHeight, cupRadius, type CupAccent, type CupColor, type CupShape } from '../products/cups';
import { pick, range, type Rng } from '../random';

/**
 * Relleno de estantes: reparte tazas por colores (bloques de 3–5 piezas del mismo color) y
 * cajas de regalo a lo largo de una balda. Se llama dentro del sistema de coordenadas local
 * del módulo de estantería (origen en el centro de la huella; el frente mira hacia +Z).
 */

export type CupTheme = 'classic' | 'earth' | 'dark' | 'espresso' | 'tall';

interface ThemeDef {
  shapes: readonly CupShape[];
  colors: readonly CupColor[];
  inners: readonly (CupColor | undefined)[];
}

const THEMES: Record<CupTheme, ThemeDef> = {
  classic: {
    shapes: ['mug', 'mug', 'tall', 'cappuccino'],
    colors: ['white', 'navy', 'blue', 'sky', 'ivory', 'white'],
    inners: [undefined, 'white', 'ivory'],
  },
  earth: {
    shapes: ['mug', 'mug', 'bowl', 'tall'],
    colors: ['terracotta', 'sage', 'mustard', 'rose', 'ivory'],
    inners: [undefined, 'ivory', 'white'],
  },
  dark: {
    shapes: ['mug', 'tall', 'mug', 'espresso'],
    colors: ['black', 'graphite', 'navy', 'black', 'gold'],
    inners: [undefined, 'white', 'gold'],
  },
  espresso: {
    shapes: ['espresso', 'cappuccino', 'espresso', 'cappuccino'],
    colors: ['white', 'white', 'ivory', 'navy', 'gold', 'sky'],
    inners: [undefined, 'white'],
  },
  tall: {
    shapes: ['tumbler', 'tall', 'tumbler', 'tall'],
    colors: ['navy', 'white', 'blue', 'graphite', 'gold', 'sky'],
    inners: [undefined, 'white'],
  },
};

const LIGHT_BODIES: readonly CupColor[] = ['white', 'ivory', 'sky', 'rose', 'sage', 'mustard'];

/** Acento que contrasta con el color del cuerpo. */
function accentFor(rng: Rng, color: CupColor): CupAccent | undefined {
  if (color === 'gold') {
    return undefined;
  }
  const light = LIGHT_BODIES.includes(color);
  const options: readonly CupAccent[] = light
    ? [
        { kind: 'rim', color: 'gold' },
        { kind: 'dip', color: 'navy' },
        { kind: 'stripe', color: 'navy' },
        { kind: 'stripe', color: 'gold' },
      ]
    : [
        { kind: 'rim', color: 'gold' },
        { kind: 'dip', color: 'white' },
        { kind: 'stripe', color: 'gold' },
      ];
  return pick(rng, options);
}

export interface ShelfFillOptions {
  /** Ancho útil y fondo de la balda. */
  w: number;
  d: number;
  /** Altura (y) de la superficie de la balda. */
  y: number;
  /** Altura libre máxima sobre la balda. */
  maxH: number;
  theme: CupTheme;
  seg?: number;
  /** Una etiqueta de precio cada N piezas. */
  tagEvery?: number;
}

export function fillCupShelf(ctx: StoreContext, rng: Rng, o: ShelfFillOptions): void {
  const { products: p } = ctx;
  const theme = THEMES[o.theme];
  const limit = o.w / 2 - 0.08;
  const frontZ = o.d / 2 - 0.1;
  let x = -o.w / 2 + 0.08;
  let runLeft = 0;
  let color: CupColor = 'white';
  let inner: CupColor | undefined;
  let accent: CupAccent | undefined;
  let count = 0;

  for (;;) {
    if (runLeft <= 0) {
      color = pick(rng, theme.colors);
      inner = rng() < 0.4 ? pick(rng, theme.inners) : undefined;
      accent = rng() < 0.55 ? accentFor(rng, color) : undefined;
      runLeft = 3 + Math.floor(rng() * 3);
    }
    runLeft -= 1;

    let shape = pick(rng, theme.shapes);
    const scale = range(rng, 0.96, 1.14);
    if (cupHeight(shape, scale) + 0.012 > o.maxH) {
      shape = 'mug';
    }
    const r = cupRadius(shape, scale);
    const hasHandle = shape !== 'tumbler' && shape !== 'bowl';
    const saucer = shape === 'cappuccino' || shape === 'espresso';
    const half = saucer ? r * 1.6 : r;
    const extra = hasHandle ? cupHeight(shape, scale) * 0.3 + 0.01 : 0;
    const width = half * 2 + extra + 0.012;
    if (x + width > limit) {
      break;
    }
    const cx = x + half;

    if (saucer && rng() < 0.18) {
      p.place(
        'cupStack',
        { x: cx, y: o.y, z: frontZ },
        {
          shape: shape === 'cappuccino' ? 'cappuccino' : 'espresso',
          color,
          inner,
          count: 3,
          scale,
          accent,
          seg: o.seg,
        },
      );
    } else {
      p.place(
        'cup',
        { x: cx, y: o.y, z: frontZ },
        { shape, color, inner, accent, saucer, scale, seg: o.seg, turn: rng() < 0.9 ? 0 : Math.PI },
      );
    }

    count += 1;
    if (count % (o.tagEvery ?? 5) === 1) {
      p.place('priceTag', { x: cx, y: o.y - 0.02, z: o.d / 2 + 0.004 });
    }
    x += width;
  }
}

/** Cajas de regalo (sets de tazas y cajas con cinta) a lo largo de una balda. */
export function fillBoxShelf(ctx: StoreContext, rng: Rng, o: { w: number; d: number; y: number; maxH: number }): void {
  const { products: p } = ctx;
  let x = -o.w / 2 + 0.1;
  const limit = o.w / 2 - 0.1;
  for (;;) {
    const w = range(rng, 0.2, 0.34);
    const h = Math.min(o.maxH - 0.02, range(rng, 0.13, 0.26));
    const d = Math.min(o.d - 0.08, range(rng, 0.17, 0.24));
    if (x + w > limit) {
      break;
    }
    const kind = pick(rng, ['set', 'set', 'navy', 'white'] as const);
    p.place('giftBox', { x: x + w / 2, y: o.y, z: o.d / 2 - 0.04 - d / 2 }, { w, h, d, kind });
    x += w + range(rng, 0.015, 0.04);
  }
}
