import type { Material } from 'three';
import type { StaticBatch } from '../batch';
import type { Materials } from '../materials';

/**
 * Mobiliario comercial: estanterías, mesas de exposición, mostrador, caja, bancos, plantas y
 * plintos. Origen local = centro de la huella sobre el suelo, frente hacia +Z.
 */

// ---------------------------------------------------------------- estanterías

export interface ShelfBayOptions {
  w: number;
  h: number;
  d: number;
  /** Alturas (y) de la superficie superior de cada balda. */
  levels: readonly number[];
  /** Material del fondo (por defecto azul marino). */
  back?: Material;
  /** Tira LED cálida bajo cada balda. */
  led?: boolean;
}

/** Módulo de estantería: montantes dorados, fondo azul marino, baldas blancas y luz LED. */
export function drawShelfBay(b: StaticBatch, m: Materials, o: ShelfBayOptions): void {
  const inner = o.w - 0.06;
  for (const side of [-1, 1]) {
    b.box(m.goldMatte, 0.03, o.h, o.d, side * (o.w / 2 - 0.015), o.h / 2, 0);
  }
  b.box(o.back ?? m.navyLifted, inner, o.h, 0.02, 0, o.h / 2, -o.d / 2 + 0.01);
  b.box(m.navyDeep, inner, 0.1, o.d - 0.03, 0, 0.05, 0.0);
  for (const y of o.levels) {
    b.box(m.whiteGloss, inner, 0.03, o.d, 0, y - 0.015, 0);
    b.box(m.goldMatte, inner, 0.012, 0.012, 0, y - 0.015, o.d / 2 + 0.002);
    if (o.led ?? true) {
      b.box(m.ledWarm, inner - 0.04, 0.008, 0.012, 0, y - 0.04, o.d / 2 - 0.035);
    }
  }
  b.box(m.navy, o.w, 0.04, o.d, 0, o.h + 0.02, 0);
  b.box(m.goldMatte, o.w, 0.012, 0.012, 0, o.h + 0.003, o.d / 2 + 0.002);
}

/** Etiqueta de precio (sin texto legible) en el canto de una balda. */
export function drawPriceTag(b: StaticBatch, m: Materials): void {
  b.box(m.tag, 0.05, 0.024, 0.003, 0, 0, 0);
  b.box(m.goldMatte, 0.05, 0.004, 0.0035, 0, -0.009, 0);
}

// ---------------------------------------------------------------- mesas y escalones

/** Mesa de exposición: tapa de cuarzo, cuerpo de roble, cenefa dorada y luz LED. */
export function drawDisplayTable(
  b: StaticBatch,
  m: Materials,
  o: { len: number; depth: number; h: number },
): void {
  const { len, depth, h } = o;
  b.box(m.quartz, len, 0.04, depth, 0, h - 0.02, 0);
  b.box(m.goldMatte, len + 0.008, 0.012, depth + 0.008, 0, h - 0.046, 0);
  b.box(m.wood, len - 0.12, h - 0.12, depth - 0.12, 0, 0.06 + (h - 0.12) / 2, 0);
  b.box(m.graphite, len - 0.2, 0.06, depth - 0.2, 0, 0.03, 0);
  b.box(m.ledWarm, len - 0.2, 0.008, 0.008, 0, h - 0.075, (depth - 0.12) / 2 + 0.003);
}

export interface RiserOptions {
  len: number;
  depth: number;
  steps: number;
  /** Altura de cada escalón (m). */
  step: number;
}

/** Escalones de exposición (el más alto atrás). El escalón i queda a (steps - i) · step de altura. */
export function drawRisers(b: StaticBatch, m: Materials, o: RiserOptions): void {
  const each = o.depth / o.steps;
  for (let i = 0; i < o.steps; i += 1) {
    const top = (o.steps - i) * o.step;
    b.box(m.whiteGloss, o.len, top, each, 0, top / 2, -o.depth / 2 + (i + 0.5) * each);
    b.box(m.goldMatte, o.len, 0.008, 0.008, 0, top - 0.004, -o.depth / 2 + (i + 1) * each);
  }
}

/** Expositor redondo de varios niveles; devuelve las alturas de cada superficie. */
export function drawRoundTier(b: StaticBatch, m: Materials, o: { levels: readonly { r: number; y: number }[] }): number[] {
  const top = Math.max(...o.levels.map((level) => level.y));
  b.cyl(m.navy, 0.05, 0.05, top, 0, top / 2, 0, undefined, 10);
  const surfaces: number[] = [];
  for (const level of o.levels) {
    b.cyl(m.whiteGloss, level.r, level.r, 0.03, 0, level.y - 0.015, 0, undefined, 24);
    b.cyl(m.goldMatte, level.r + 0.004, level.r + 0.004, 0.012, 0, level.y - 0.015, 0, undefined, 24);
    surfaces.push(level.y);
  }
  return surfaces;
}

// ---------------------------------------------------------------- mostrador y caja

export interface CounterOptions {
  len: number;
  depth: number;
  h: number;
}

/** Mostrador: cuerpo azul marino con listones de roble en el frente, tapa de cuarzo y luz LED. */
export function drawCounter(b: StaticBatch, m: Materials, o: CounterOptions): void {
  const { len, depth, h } = o;
  b.box(m.navyLifted, len, h - 0.04, depth, 0, (h - 0.04) / 2, 0);

  // Listones verticales acanalados en la cara frontal.
  const slatW = 0.03;
  const pitch = 0.055;
  const count = Math.floor((len - 0.1) / pitch);
  const start = -((count - 1) * pitch) / 2;
  for (let i = 0; i < count; i += 1) {
    b.box(m.wood, slatW, h - 0.22, 0.022, start + i * pitch, 0.12 + (h - 0.22) / 2, depth / 2 + 0.011);
  }
  b.box(m.goldMatte, len, 0.02, 0.012, 0, 0.1, depth / 2 + 0.006);
  b.box(m.ledWarm, len - 0.1, 0.012, 0.01, 0, 0.04, depth / 2 - 0.02);

  b.box(m.quartz, len + 0.04, 0.04, depth + 0.12, 0, h - 0.02, 0.04);
  b.box(m.goldMatte, len + 0.04, 0.012, 0.012, 0, h - 0.046, depth / 2 + 0.1);
}

/** Terminal de cobro: tableta con marca, lector de tarjetas e impresora de recibos. */
export function drawPos(b: StaticBatch, m: Materials): void {
  b.cyl(m.graphite, 0.05, 0.06, 0.02, 0, 0.01, 0, undefined, 10);
  b.box(m.graphite, 0.03, 0.12, 0.03, 0, 0.08, 0);
  b.group(
    0,
    0.2,
    0.02,
    0,
    () => {
      b.box(m.graphite, 0.3, 0.2, 0.018, 0, 0, 0);
      b.plane(m.posScreen, 0.27, 0.165, 0, 0, 0.0095);
    },
    -0.22,
  );
  b.group(
    0.3,
    0.02,
    0.06,
    -0.3,
    () => {
      b.box(m.graphite, 0.08, 0.03, 0.13, 0, 0.015, 0);
      b.plane(m.screenOff, 0.05, 0.04, 0, 0.031, -0.02, { rx: -Math.PI / 2 });
    },
    0,
  );
  b.box(m.whiteGloss, 0.12, 0.1, 0.12, -0.34, 0.05, -0.05);
  b.box(m.graphite, 0.1, 0.01, 0.05, -0.34, 0.1, 0.0);
}

/** Bolsa de compra con asas doradas. */
export function drawBag(b: StaticBatch, m: Materials, o: { navy: boolean }): void {
  const material = o.navy ? m.boxNavy : m.boxWhite;
  b.box(material, 0.22, 0.28, 0.1, 0, 0.14, 0);
  b.box(m.goldMatte, 0.22, 0.02, 0.102, 0, 0.1, 0);
  for (const z of [-0.0]) {
    b.torus(m.goldMatte, 0.05, 0, 0.28, z + 0.052, { rz: 0 }, Math.PI);
    b.torus(m.goldMatte, 0.05, 0, 0.28, z - 0.052, { rz: 0 }, Math.PI);
  }
}

// ---------------------------------------------------------------- varios

export function drawBench(b: StaticBatch, m: Materials, o: { len: number }): void {
  b.box(m.wood, o.len, 0.05, 0.4, 0, 0.42, 0);
  b.box(m.cushion, o.len - 0.16, 0.07, 0.34, 0, 0.485, 0);
  for (const side of [-1, 1]) {
    b.box(m.goldMatte, 0.04, 0.4, 0.34, side * (o.len / 2 - 0.1), 0.2, 0);
  }
}

export function drawStool(b: StaticBatch, m: Materials): void {
  b.cyl(m.cushion, 0.17, 0.17, 0.06, 0, 0.66, 0, undefined, 14);
  b.cyl(m.goldMatte, 0.02, 0.02, 0.6, 0, 0.33, 0, undefined, 8);
  b.cyl(m.goldMatte, 0.19, 0.19, 0.02, 0, 0.01, 0, undefined, 14);
  b.cyl(m.goldMatte, 0.14, 0.14, 0.012, 0, 0.26, 0, { rx: 0 }, 14);
}

/** Planta decorativa en maceta blanca con borde dorado. */
export function drawPlant(b: StaticBatch, m: Materials, o: { scale: number }): void {
  const s = o.scale;
  b.cyl(m.potWhite, 0.2 * s, 0.14 * s, 0.34 * s, 0, 0.17 * s, 0, undefined, 14);
  b.cyl(m.goldMatte, 0.205 * s, 0.205 * s, 0.025 * s, 0, 0.33 * s, 0, undefined, 14);
  b.cyl(m.soil, 0.18 * s, 0.18 * s, 0.02 * s, 0, 0.34 * s, 0, undefined, 12);
  const leaves: readonly [number, number, number, number, number][] = [
    [0, 0.72, 0, 0.3, 0.38],
    [0.14, 0.58, 0.06, 0.24, 0.3],
    [-0.15, 0.62, -0.04, 0.25, 0.32],
    [0.04, 0.5, -0.15, 0.22, 0.26],
    [-0.05, 0.9, 0.04, 0.2, 0.26],
  ];
  leaves.forEach(([x, y, z, rx, ry], i) => {
    b.sphere(i % 2 === 0 ? m.leaf : m.leafDark, rx * s, ry * s, rx * s, x * s, y * s, z * s, undefined, 8, 6);
  });
}

/** Plinto de exposición de roble con tapa de cuarzo y luz LED en la base. */
export function drawPlinth(b: StaticBatch, m: Materials, o: { w: number; d: number; h: number }): void {
  b.box(m.wood, o.w, o.h - 0.04, o.d, 0, (o.h - 0.04) / 2, 0);
  b.box(m.quartz, o.w + 0.04, 0.04, o.d + 0.04, 0, o.h - 0.02, 0);
  b.box(m.goldMatte, o.w + 0.044, 0.012, o.d + 0.044, 0, o.h - 0.046, 0);
  b.box(m.ledWarm, o.w - 0.06, 0.01, 0.01, 0, 0.05, o.d / 2 + 0.003);
}

/** Pendiente de latón con difusor cálido; `drop` = largo del cable desde el techo. */
export function drawPendant(b: StaticBatch, m: Materials, o: { ceilingY: number; y: number; radius: number }): void {
  const cord = o.ceilingY - (o.y + 0.12);
  b.cyl(m.graphite, 0.004, 0.004, cord, 0, o.y + 0.12 + cord / 2, 0, undefined, 4);
  b.cyl(m.goldMatte, o.radius * 0.28, o.radius * 0.28, 0.04, 0, o.y + 0.14, 0, undefined, 8);
  b.cyl(m.gold, o.radius * 0.3, o.radius, 0.2, 0, o.y + 0.02, 0, undefined, 16);
  b.cyl(m.ledWarm, o.radius * 0.96, o.radius * 0.96, 0.01, 0, o.y - 0.085, 0, undefined, 16);
}
