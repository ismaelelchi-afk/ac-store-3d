import type { Profile, StaticBatch } from '../batch';
import type { Materials } from '../materials';

/**
 * Tazas de café procedurales. Cada taza es una pieza de revolución (exterior + interior)
 * con asa de medio toro; el origen local es el centro de la base sobre la superficie.
 * Las variantes combinan forma, color, acento (borde, franja, "dip"), platillo y tamaño.
 */

export type CupShape = 'mug' | 'tall' | 'cappuccino' | 'espresso' | 'tumbler' | 'bowl';
export type CupColor =
  | 'white'
  | 'ivory'
  | 'navy'
  | 'blue'
  | 'sky'
  | 'black'
  | 'graphite'
  | 'terracotta'
  | 'sage'
  | 'mustard'
  | 'rose'
  | 'gold';

export interface CupAccent {
  kind: 'rim' | 'stripe' | 'dip';
  color: CupColor;
}

export interface CupOptions {
  shape: CupShape;
  color: CupColor;
  /** Color del interior (por defecto el mismo que el exterior). */
  inner?: CupColor;
  accent?: CupAccent;
  /** Platillo debajo (solo tiene sentido en cappuccino / espresso). */
  saucer?: boolean;
  /** Multiplicador de tamaño (1 = tamaño real). */
  scale?: number;
  /** Giro del asa alrededor del eje vertical (radianes). 0 = asa hacia +X local. */
  turn?: number;
  /** Segmentos de la revolución (8 en estantes altos, 10–16 en primer plano). */
  seg?: number;
  /** Dibujar asa (por defecto, la forma decide). */
  handle?: boolean;
}

interface ShapeDef {
  /** Radio y alto reales en metros. */
  r: number;
  h: number;
  outer: Profile;
  inner: Profile;
  handle: boolean;
  handleY: number;
  handleSize: number;
}

const SHAPES: Record<CupShape, ShapeDef> = {
  mug: {
    r: 0.042,
    h: 0.095,
    outer: [[0, 0], [0.9, 0], [1, 0.1], [1, 1]],
    inner: [[1, 1], [0.9, 1], [0.9, 0.12], [0, 0.12]],
    handle: true,
    handleY: 0.55,
    handleSize: 0.3,
  },
  tall: {
    r: 0.038,
    h: 0.125,
    outer: [[0, 0], [0.72, 0], [0.9, 0.08], [1, 1]],
    inner: [[1, 1], [0.92, 1], [0.8, 0.12], [0, 0.12]],
    handle: true,
    handleY: 0.52,
    handleSize: 0.26,
  },
  cappuccino: {
    r: 0.055,
    h: 0.075,
    outer: [[0, 0], [0.5, 0], [0.6, 0.06], [1, 1]],
    inner: [[1, 1], [0.93, 1], [0.55, 0.14], [0, 0.14]],
    handle: true,
    handleY: 0.58,
    handleSize: 0.34,
  },
  espresso: {
    r: 0.033,
    h: 0.058,
    outer: [[0, 0], [0.62, 0], [0.75, 0.1], [1, 1]],
    inner: [[1, 1], [0.9, 1], [0.64, 0.16], [0, 0.16]],
    handle: true,
    handleY: 0.58,
    handleSize: 0.36,
  },
  tumbler: {
    r: 0.04,
    h: 0.19,
    outer: [[0, 0], [0.85, 0], [0.92, 0.04], [1, 0.96], [0.98, 1], [0, 1]],
    inner: [],
    handle: false,
    handleY: 0.5,
    handleSize: 0.2,
  },
  bowl: {
    r: 0.075,
    h: 0.065,
    outer: [[0, 0], [0.5, 0], [0.6, 0.08], [0.95, 0.6], [1, 1]],
    inner: [[1, 1], [0.94, 1], [0.55, 0.16], [0, 0.16]],
    handle: false,
    handleY: 0.5,
    handleSize: 0.2,
  },
};

/** Alto real de cada forma (m), útil para calcular huecos de estante. */
export function cupHeight(shape: CupShape, scale = 1): number {
  return SHAPES[shape].h * scale;
}

/** Radio real de cada forma (m). */
export function cupRadius(shape: CupShape, scale = 1): number {
  return SHAPES[shape].r * scale;
}

/** Radio relativo del perfil exterior a una altura relativa `y` (0–1). */
function radiusAt(profile: Profile, y: number): number {
  for (let i = 1; i < profile.length; i += 1) {
    const [r0, y0] = profile[i - 1] as readonly [number, number];
    const [r1, y1] = profile[i] as readonly [number, number];
    if (y1 > y0 && y >= y0 && y <= y1) {
      return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
    }
  }
  return 1;
}

export function drawCup(b: StaticBatch, m: Materials, o: CupOptions): void {
  const def = SHAPES[o.shape];
  const s = o.scale ?? 1;
  const r = def.r * s;
  const h = def.h * s;
  const seg = o.seg ?? 10;
  const body = m.cup[o.color];
  const inner = m.cup[o.inner ?? o.color];

  let y0 = 0;
  if (o.saucer) {
    b.cyl(m.cup.white, r * 1.6, r * 1.1, 0.012 * s, 0, 0.006 * s, 0, undefined, seg + 2);
    y0 = 0.012 * s;
  }

  b.lathe(body, `${o.shape}:o`, def.outer, r, h, 0, y0, 0, undefined, seg);
  if (def.inner.length > 0) {
    b.lathe(inner, `${o.shape}:i`, def.inner, r, h, 0, y0, 0, undefined, seg);
  }

  if (o.shape === 'tumbler') {
    // Tapa y boquilla.
    b.cyl(m.cupLid, r * 1.02, r * 1.02, h * 0.07, 0, y0 + h * 1.0, 0, undefined, seg);
    b.cyl(m.cupLid, r * 0.45, r * 0.55, h * 0.05, 0, y0 + h * 1.055, 0, undefined, seg);
  }

  if (o.accent) {
    const accent = m.cup[o.accent.color];
    const grow = 1.012;
    const band = (from: number, to: number): void => {
      b.cyl(
        accent,
        radiusAt(def.outer, to) * r * grow,
        radiusAt(def.outer, from) * r * grow,
        (to - from) * h,
        0,
        y0 + ((from + to) / 2) * h,
        0,
        undefined,
        seg,
      );
    };
    switch (o.accent.kind) {
      case 'rim':
        band(0.92, 1);
        break;
      case 'stripe':
        band(0.42, 0.58);
        break;
      case 'dip':
        band(0.02, 0.34);
        break;
    }
  }

  if ((o.handle ?? def.handle) && def.handle) {
    const hr = h * def.handleSize;
    b.group(
      0,
      0,
      0,
      o.turn ?? 0,
      () => {
        b.torus(body, hr, radiusAt(def.outer, def.handleY) * r * 0.96, y0 + def.handleY * h, 0, { rz: -Math.PI / 2 });
      },
    );
  }
}

export interface CupStackOptions {
  shape: 'cappuccino' | 'espresso' | 'bowl';
  color: CupColor;
  inner?: CupColor;
  count: number;
  scale?: number;
  accent?: CupAccent;
  seg?: number;
}

/** Pila de tazas encajadas (sin asa) con un platillo en la base. */
export function drawCupStack(b: StaticBatch, m: Materials, o: CupStackOptions): void {
  const def = SHAPES[o.shape];
  const s = o.scale ?? 1;
  const step = def.h * s * 0.3;
  for (let i = 0; i < o.count; i += 1) {
    b.group(0, i * step, 0, 0, () => {
      drawCup(b, m, {
        shape: o.shape,
        color: o.color,
        inner: o.inner,
        accent: o.accent,
        scale: s,
        seg: o.seg,
        handle: false,
        saucer: i === 0,
      });
    });
  }
}

/** Pila de platillos blancos. */
export function drawSaucerStack(b: StaticBatch, m: Materials, o: { count: number; scale?: number }): void {
  const s = o.scale ?? 1;
  for (let i = 0; i < o.count; i += 1) {
    b.cyl(m.cup.white, 0.075 * s, 0.05 * s, 0.012 * s, 0, 0.006 * s + i * 0.014 * s, 0, undefined, 12);
  }
}

/** Árbol de tazas: mástil dorado con brazos de los que cuelgan tazas por el asa. */
export function drawMugTree(b: StaticBatch, m: Materials, o: { colors: readonly CupColor[] }): void {
  const poleH = 0.78;
  b.cyl(m.gold, 0.2, 0.22, 0.02, 0, 0.01, 0, undefined, 16);
  b.cyl(m.gold, 0.012, 0.012, poleH, 0, poleH / 2 + 0.02, 0, undefined, 8);
  b.sphere(m.gold, 0.02, 0.02, 0.02, 0, poleH + 0.03, 0, undefined, 8, 6);

  const tiers = [0.3, 0.52];
  let index = 0;
  tiers.forEach((tierY) => {
    for (let k = 0; k < 4; k += 1) {
      const angle = (k / 4) * Math.PI * 2 + (tierY > 0.4 ? Math.PI / 4 : 0);
      const arm = 0.16;
      const cx = Math.cos(angle) * arm;
      const cz = Math.sin(angle) * arm;
      // Brazo horizontal desde el mástil hasta el asa.
      b.group(0, tierY, 0, -angle, () => {
        b.cyl(m.gold, 0.006, 0.006, arm, arm / 2, 0, 0, { rz: Math.PI / 2 }, 6);
      });
      const color = o.colors[index % o.colors.length] as CupColor;
      index += 1;
      b.group(cx * 1.35, tierY - 0.055, cz * 1.35, Math.PI - angle, () => {
        drawCup(b, m, { shape: 'mug', color, seg: 10 });
      });
    }
  });
}

export interface GiftBoxOptions {
  w: number;
  h: number;
  d: number;
  kind: 'navy' | 'white' | 'set';
}

/** Caja de regalo con cinta dorada y moño (la variante "set" lleva la etiqueta de marca). */
export function drawGiftBox(b: StaticBatch, m: Materials, o: GiftBoxOptions): void {
  const material = o.kind === 'navy' ? m.boxNavy : o.kind === 'white' ? m.boxWhite : m.labels.giftBox;
  b.box(material, o.w, o.h, o.d, 0, o.h / 2, 0);
  const t = 0.004;
  b.box(m.gold, o.w * 0.13, o.h + t, o.d + t, 0, o.h / 2, 0);
  if (o.kind !== 'set') {
    b.box(m.gold, o.w + t, o.h + t, o.d * 0.13, 0, o.h / 2, 0);
    for (const side of [-1, 1]) {
      b.sphere(m.gold, o.w * 0.09, o.h * 0.1, o.w * 0.05, side * o.w * 0.07, o.h + 0.012, 0, { rz: side * 0.5 }, 8, 6);
    }
  }
}
