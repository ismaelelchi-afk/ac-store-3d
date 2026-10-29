import type { Profile, StaticBatch } from '../batch';
import type { Materials } from '../materials';
import type { LabelId } from '../textures';

/**
 * Garrafas y botellas de agua procedurales: garrafón de 20 L, garrafas de 10, 5 y 3 L,
 * botellas de 1,5 L y 500 mL en paquetes, tarimas y dispensadores. El origen local es el
 * centro de la base sobre la superficie.
 */

export type JugCapacity = '20' | '10' | '5' | '3';
export type CapColor = 'blue' | 'gold' | 'white' | 'navy';

const JUG_PROFILE: Profile = [[0, 0], [0.95, 0], [1, 0.06], [1, 0.62], [0.82, 0.78], [0.5, 0.9], [0.25, 1]];
const BOTTLE_PROFILE: Profile = [[0, 0], [0.9, 0], [1, 0.05], [1, 0.66], [0.4, 0.86], [0.26, 1]];
const LABEL_PROFILE: Profile = [[1.014, 0.2], [1.014, 0.62]];

const JUG_SIZES: Record<JugCapacity, { r: number; h: number }> = {
  '20': { r: 0.135, h: 0.49 },
  '10': { r: 0.115, h: 0.36 },
  '5': { r: 0.09, h: 0.3 },
  '3': { r: 0.075, h: 0.27 },
};

export function jugSize(capacity: JugCapacity, scale = 1): { r: number; h: number } {
  const s = JUG_SIZES[capacity];
  return { r: s.r * scale, h: s.h * scale };
}

export interface JugOptions {
  capacity: JugCapacity;
  label: LabelId;
  cap?: CapColor;
  /** Versión ligera (sin agua interior ni etiqueta curva) para tarimas con muchas unidades. */
  lite?: boolean;
  scale?: number;
  /** Ángulo (rad) hacia donde mira la etiqueta; 0 = +Z local. */
  labelAt?: number;
  seg?: number;
}

function capMaterial(m: Materials, cap: CapColor) {
  switch (cap) {
    case 'gold':
      return m.capGold;
    case 'white':
      return m.capWhite;
    case 'navy':
      return m.capNavy;
    default:
      return m.capBlue;
  }
}

/** Garrafa: carcasa translúcida + agua + tapa + etiqueta curva. */
export function drawJug(b: StaticBatch, m: Materials, o: JugOptions): void {
  const { r, h } = jugSize(o.capacity, o.scale);
  const seg = o.seg ?? 12;
  const cap = capMaterial(m, o.cap ?? 'blue');

  if (o.lite) {
    b.lathe(m.jugWater, 'jug', JUG_PROFILE, r, h, 0, 0, 0, undefined, Math.min(seg, 8));
  } else {
    b.lathe(m.jugShell, 'jug', JUG_PROFILE, r, h, 0, 0, 0, undefined, seg);
    b.cyl(m.jugWater, r * 0.55, r * 0.93, h * 0.7, 0, h * 0.05 + h * 0.35, 0, undefined, Math.min(seg, 10));
    const labelAt = o.labelAt ?? 0;
    b.lathe(m.labels[o.label], 'label', LABEL_PROFILE, r, h, 0, 0, 0, undefined, 6, labelAt - 1.1, 2.2);
  }

  // Cuello, tapa y asa de transporte.
  const neckR = r * 0.26;
  b.cyl(cap, neckR * 1.18, neckR * 1.18, h * 0.07, 0, h + h * 0.03, 0, undefined, 8);
  if (o.capacity === '10' || o.capacity === '5') {
    b.box(cap, r * 1.1, h * 0.04, h * 0.05, 0, h + h * 0.085, 0);
  }
}

/** Garrafa acostada con el cuello hacia +Z (para estantes tipo cuna). Apoya sobre el plano y = 0. */
export function drawJugLying(b: StaticBatch, m: Materials, o: JugOptions): void {
  const { r, h } = jugSize(o.capacity, o.scale);
  b.group(
    0,
    r,
    -h / 2,
    0,
    () => {
      drawJug(b, m, { ...o, labelAt: Math.PI });
    },
    Math.PI / 2,
  );
}

export interface BottleOptions {
  size: '15' | '05';
  cap?: CapColor;
  /** Etiqueta curva (se omite en la versión ligera). */
  label?: LabelId;
  seg?: number;
}

const BOTTLE_SIZES = { '15': { r: 0.045, h: 0.31 }, '05': { r: 0.03, h: 0.2 } };

export function drawBottle(b: StaticBatch, m: Materials, o: BottleOptions): void {
  const { r, h } = BOTTLE_SIZES[o.size];
  const seg = o.seg ?? 8;
  b.lathe(m.bottleBody, 'bottle', BOTTLE_PROFILE, r, h, 0, 0, 0, undefined, seg);
  if (o.label) {
    b.lathe(m.labels[o.label], 'label', LABEL_PROFILE, r, h, 0, 0, 0, undefined, 4, -1.1, 2.2);
  }
  b.cyl(capMaterial(m, o.cap ?? 'white'), r * 0.3, r * 0.3, h * 0.05, 0, h + h * 0.02, 0, undefined, 6);
}

/** Paquete de botellas en bandeja de cartón con asa. */
export function drawBottlePack(b: StaticBatch, m: Materials, o: { cols: number; rows: number; size: '15' | '05' }): void {
  const { r, h } = BOTTLE_SIZES[o.size];
  const pitch = r * 2.12;
  const w = o.cols * pitch;
  const d = o.rows * pitch;
  b.box(m.cardboard, w, 0.02, d, 0, 0.01, 0);
  for (let i = 0; i < o.cols; i += 1) {
    for (let j = 0; j < o.rows; j += 1) {
      b.group(-w / 2 + pitch * (i + 0.5), 0.02, -d / 2 + pitch * (j + 0.5), 0, () => {
        drawBottle(b, m, { size: o.size, label: i === 0 || j === 0 ? 'pack15' : undefined, cap: 'blue' });
      });
    }
  }
  // Asa y zuncho superior.
  b.box(m.strap, w * 0.8, 0.012, 0.03, 0, h + 0.07, 0);
  b.box(m.strap, 0.012, 0.05, 0.03, -w * 0.4, h + 0.045, 0);
  b.box(m.strap, 0.012, 0.05, 0.03, w * 0.4, h + 0.045, 0);
}

/** Caja de botellas de 500 mL (24 uds.) con película y etiqueta de marca. */
export function drawBottleCase(b: StaticBatch, m: Materials): void {
  b.box(m.labels.case05, 0.4, 0.2, 0.28, 0, 0.1, 0);
  b.box(m.strap, 0.4, 0.012, 0.03, 0, 0.206, 0);
}

export function drawPallet(b: StaticBatch, m: Materials): void {
  const w = 0.8;
  const d = 1.2;
  for (const z of [-0.5, 0, 0.5]) {
    b.box(m.palletWood, w, 0.09, 0.1, 0, 0.045, z);
  }
  for (let i = 0; i < 5; i += 1) {
    b.box(m.palletWood, w, 0.02, 0.18, 0, 0.1, -d / 2 + 0.09 + i * 0.255);
  }
  b.box(m.palletWood, w, 0.02, d, 0, 0.12, 0);
}

export interface PalletJugsOptions {
  layers: number;
  label: LabelId;
  cap?: CapColor;
}

/** Tarima de garrafones de 20 L apilados (2 × 4 por capa), con zunchos azules. */
export function drawPalletJugs(b: StaticBatch, m: Materials, o: PalletJugsOptions): void {
  drawPallet(b, m);
  const layerH = 0.52;
  const base = 0.13;
  for (let layer = 0; layer < o.layers; layer += 1) {
    for (const x of [-0.2, 0.2]) {
      for (const z of [-0.45, -0.15, 0.15, 0.45]) {
        b.group(x, base + layer * layerH, z, 0, () => {
          drawJug(b, m, { capacity: '20', label: o.label, cap: o.cap, lite: true });
        });
      }
    }
  }
  const top = base + o.layers * layerH;
  for (const y of [base + 0.2, top - 0.2]) {
    b.box(m.strap, 0.62, 0.025, 1.0, 0, y, 0);
  }
}

export interface DispenserOptions {
  variant: 'floor' | 'table';
  label?: LabelId;
}

/** Dispensador de agua con garrafón invertido (de piso o de mesa). */
export function drawDispenser(b: StaticBatch, m: Materials, o: DispenserOptions): void {
  const floor = o.variant === 'floor';
  const bodyH = floor ? 0.95 : 0.46;
  const w = floor ? 0.32 : 0.26;
  const d = floor ? 0.34 : 0.28;

  b.box(m.whiteGloss, w, bodyH, d, 0, bodyH / 2, 0);
  b.box(m.navy, w + 0.01, 0.04, d + 0.01, 0, bodyH - 0.02, 0);
  b.cyl(m.navy, 0.07, 0.08, 0.035, 0, bodyH + 0.0175, 0, undefined, 10);
  b.box(m.graphite, w * 0.78, bodyH * 0.22, 0.012, 0, bodyH * 0.62, d / 2 + 0.002);
  // Grifos frío (azul) y caliente (dorado).
  const tapY = bodyH * 0.62;
  b.cyl(m.tapBlue, 0.016, 0.016, 0.05, -w * 0.18, tapY, d / 2 + 0.03, { rx: Math.PI / 2 }, 8);
  b.cyl(m.goldMatte, 0.016, 0.016, 0.05, w * 0.18, tapY, d / 2 + 0.03, { rx: Math.PI / 2 }, 8);
  // Bandeja y zócalo.
  b.box(m.steel, w * 0.7, 0.02, 0.1, 0, bodyH * 0.38, d / 2 + 0.03);
  b.box(m.graphite, w * 0.7, 0.01, 0.01, 0, bodyH * 0.38 + 0.012, d / 2 + 0.07);
  if (floor) {
    b.box(m.graphite, w + 0.02, 0.05, d + 0.02, 0, 0.025, 0);
  }

  // Garrafón invertido sobre la tapa del dispensador.
  const capacity: JugCapacity = floor ? '20' : '5';
  const { h } = jugSize(capacity);
  const jugBase = bodyH + h * 1.05;
  b.group(
    0,
    jugBase,
    0,
    0,
    () => {
      // Garrafón invertido: la etiqueta mira de lado para que el texto no quede al revés de frente.
      drawJug(b, m, { capacity, label: o.label ?? (floor ? 'blue20' : 'white5'), cap: 'blue', labelAt: Math.PI / 2 });
    },
    Math.PI,
  );
}
