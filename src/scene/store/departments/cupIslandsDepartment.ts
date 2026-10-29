import type { StoreContext } from '../context';
import type { CupColor } from '../products/cups';
import { drawDisplayTable, drawRisers, drawRoundTier } from '../products/fixtures';
import { softShadow } from './common';

const ISLAND_X = -3.3;
const TABLE = { len: 1.9, depth: 0.9, h: 0.8 } as const;

/** Reparte `count` piezas centradas con paso `pitch` y llama a `place` con la posición x. */
function row(count: number, pitch: number, place: (x: number, index: number) => void): void {
  const start = -((count - 1) * pitch) / 2;
  for (let i = 0; i < count; i += 1) {
    place(start + i * pitch, i);
  }
}

/**
 * A (3/3). Tres islas de exposición de tazas frente a la pared: escalones con filas de color,
 * expositores redondos con árbol de tazas, y pilas con termos y regalos.
 */
export function buildCupIslands(ctx: StoreContext): void {
  const { batch: b, mats: m } = ctx;
  b.label = 'cupIslands';

  const zA = 1.8;
  const zB = -0.9;
  const zC = -3.6;
  for (const z of [zA, zB, zC]) {
    b.group(ISLAND_X, 0, z, 0, () => drawDisplayTable(b, m, TABLE));
    softShadow(ctx, ISLAND_X, z, TABLE.len, TABLE.depth);
  }

  islandSteps(ctx, zA);
  islandTiers(ctx, zB);
  islandStacks(ctx, zC);
}

/** Isla A: tres escalones con una fila de cada forma. */
function islandSteps(ctx: StoreContext, z: number): void {
  const { batch: b, mats: m, products: p } = ctx;
  b.group(ISLAND_X, TABLE.h, z, 0, () => {
    drawRisers(b, m, { len: 1.7, depth: 0.72, steps: 3, step: 0.07 });
    const rowZ = (i: number): number => -0.36 + (i + 0.5) * 0.24;
    const rowY = (i: number): number => (3 - i) * 0.07;

    // Fila trasera: tazas altas azul marino con borde dorado.
    row(10, 0.15, (x) => {
      p.place('cup', { x, y: rowY(0), z: rowZ(0) }, {
        shape: 'tall',
        color: 'navy',
        inner: 'white',
        accent: { kind: 'rim', color: 'gold' },
        scale: 1.1,
        seg: 12,
      });
    });
    // Fila central: tazas clásicas alternando blanco y marfil, con franja azul o dorada.
    row(11, 0.145, (x, i) => {
      p.place('cup', { x, y: rowY(1), z: rowZ(1) }, {
        shape: 'mug',
        color: i % 2 === 0 ? 'white' : 'ivory',
        accent: { kind: i % 3 === 0 ? 'stripe' : 'dip', color: i % 2 === 0 ? 'navy' : 'gold' },
        scale: 1.15,
        seg: 12,
      });
    });
    // Fila delantera: cappuccino con platillo en azules.
    row(7, 0.235, (x, i) => {
      p.place('cup', { x, y: rowY(2), z: rowZ(2) }, {
        shape: 'cappuccino',
        color: i % 2 === 0 ? 'sky' : 'blue',
        inner: 'white',
        accent: { kind: 'rim', color: 'gold' },
        saucer: true,
        scale: 1.1,
        seg: 12,
      });
    });
  });
}

/** Isla B: dos expositores redondos con coronas de espresso y un árbol de tazas en el centro. */
function islandTiers(ctx: StoreContext, z: number): void {
  const { batch: b, mats: m, products: p } = ctx;
  const treeColors: readonly CupColor[] = ['navy', 'white', 'blue', 'gold'];
  b.group(ISLAND_X, TABLE.h, z, 0, () => {
    p.place('mugTree', {}, { colors: treeColors });

    for (const side of [-1, 1]) {
      const cx = side * 0.62;
      b.group(cx, 0, 0, 0, () => {
        const surfaces = drawRoundTier(b, m, {
          levels: [
            { r: 0.28, y: 0.2 },
            { r: 0.18, y: 0.4 },
          ],
        });
        const ring = (radius: number, count: number, y: number, color: CupColor, accent: CupColor): void => {
          for (let i = 0; i < count; i += 1) {
            const a = (i / count) * Math.PI * 2;
            p.place('cup', { x: Math.cos(a) * radius, y, z: Math.sin(a) * radius, ry: 0 }, {
              shape: 'espresso',
              color,
              inner: 'white',
              accent: { kind: 'rim', color: accent },
              saucer: true,
              scale: 1.1,
              turn: -a,
              seg: 12,
            });
          }
        };
        ring(0.2, 7, surfaces[0] as number, side < 0 ? 'white' : 'navy', 'gold');
        ring(0.11, 4, surfaces[1] as number, side < 0 ? 'navy' : 'white', 'gold');
        p.place('cup', { y: (surfaces[1] as number) + 0.0, z: 0 }, {
          shape: 'tumbler',
          color: side < 0 ? 'gold' : 'blue',
          scale: 0.9,
          seg: 12,
        });
      });
    }
  });
}

/** Isla C: termos al fondo, pilas de tazas y platillos al centro y tazas de tonos tierra delante. */
function islandStacks(ctx: StoreContext, z: number): void {
  const { batch: b, products: p } = ctx;
  const tumblerColors: readonly CupColor[] = ['navy', 'white', 'blue', 'gold', 'graphite', 'sky'];
  const earthColors: readonly CupColor[] = ['terracotta', 'sage', 'mustard', 'rose', 'terracotta', 'sage', 'mustard'];

  b.group(ISLAND_X, TABLE.h, z, 0, () => {
    row(6, 0.3, (x, i) => {
      p.place('cup', { x, z: -0.26 }, { shape: 'tumbler', color: tumblerColors[i] as CupColor, scale: 1.05, seg: 12 });
    });
    p.place('cupStack', { x: -0.62, z: 0.0 }, { shape: 'cappuccino', color: 'navy', inner: 'white', count: 4, accent: { kind: 'rim', color: 'gold' }, seg: 12 });
    p.place('cupStack', { x: -0.2, z: 0.0 }, { shape: 'cappuccino', color: 'white', count: 4, accent: { kind: 'rim', color: 'gold' }, seg: 12 });
    p.place('cupStack', { x: 0.22, z: 0.0 }, { shape: 'espresso', color: 'ivory', count: 5, accent: { kind: 'rim', color: 'navy' }, seg: 12 });
    p.place('saucerStack', { x: 0.62, z: 0.0 }, { count: 6 });
    row(7, 0.24, (x, i) => {
      p.place('cup', { x, z: 0.29 }, { shape: i % 3 === 2 ? 'bowl' : 'mug', color: earthColors[i] as CupColor, scale: 1.1, seg: 12 });
    });
  });
}
