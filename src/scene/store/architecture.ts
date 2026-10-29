import { STORE } from './constants';
import type { StoreContext } from './context';

/**
 * Envolvente del local: suelo con alfombra central, muros, fachada acristalada con entrada,
 * techo con vigas y luz perimetral. Todo en metros; la cara interior de los muros queda
 * exactamente en x = ±7 y z = ±9.
 */
export function buildArchitecture(ctx: StoreContext): void {
  ctx.batch.label = 'arquitectura';
  buildFloor(ctx);
  buildSideWalls(ctx);
  buildBackWall(ctx);
  buildFrontWall(ctx);
  buildEntrance(ctx);
  buildCeiling(ctx);
}

const W = STORE.halfW;
const D = STORE.halfD;
const H = STORE.height;
const T = STORE.wallThickness;
/** Los muros sobresalen por encima del techo para cerrar el volumen. */
const WALL_H = H + 0.3;

function buildFloor({ batch: b, mats: m }: StoreContext): void {
  // La textura de porcelanato (2×2 baldosas de 50 cm) se repite cada metro sobre la cara superior.
  b.box(m.floor, W * 2, 0.1, D * 2, 0, -0.05, 0);
  // Alfombra central azul marino con filetes dorados: guía el ojo hasta la pared de marca.
  b.box(m.runner, STORE.runnerHalfWidth * 2, 0.012, 16.4, 0, 0.006, 0.7);
}

function buildSideWalls({ batch: b, mats: m }: StoreContext): void {
  for (const side of [-1, 1]) {
    b.box(m.wall, T, WALL_H, D * 2 + T * 2, side * (W + T / 2), WALL_H / 2, 0);
    // Zócalo azul marino y cenefa dorada corrida.
    b.box(m.navyDeep, 0.03, 0.12, D * 2, side * (W - 0.015), 0.06, 0);
    b.box(m.goldMatte, 0.02, 0.035, D * 2, side * (W - 0.01), 3.12, 0);
    // Sofito perimetral con tira LED cálida (efecto de luz indirecta).
    b.box(m.navy, 0.4, 0.2, D * 2, side * (W - 0.2), H - 0.1, 0);
    b.box(m.goldMatte, 0.02, 0.02, D * 2, side * (W - 0.4), H - 0.2, 0);
    b.box(m.ledWarm, 0.05, 0.01, D * 2 - 0.2, side * (W - 0.36), H - 0.203, 0);
  }
}

function buildBackWall({ batch: b, mats: m }: StoreContext): void {
  b.box(m.wall, W * 2, WALL_H, T, 0, WALL_H / 2, -D - T / 2);
  b.box(m.navyDeep, W * 2, 0.12, 0.03, 0, 0.06, -D + 0.015);
  b.box(m.goldMatte, W * 2, 0.035, 0.02, 0, 3.12, -D + 0.01);

  // Paneles laterales de listones de roble sobre fondo azul marino (a ambos lados de la pared de marca).
  for (const side of [-1, 1]) {
    const x0 = 2.45;
    const x1 = W - 0.05;
    const cx = (x0 + x1) / 2;
    b.box(m.navyLifted, x1 - x0 + 0.1, 3.5, 0.02, side * cx, 1.8, -D + 0.01);
    const pitch = 0.075;
    const count = Math.floor((x1 - x0) / pitch);
    for (let i = 0; i < count; i += 1) {
      b.box(m.wood, 0.045, 3.3, 0.03, side * (x0 + 0.04 + i * pitch), 0.1 + 1.65, -D + 0.035);
    }
  }
}

function buildFrontWall({ batch: b, mats: m }: StoreContext): void {
  const z = D + T / 2;
  const openHalf = 1.4;
  const doorH = 2.9;
  const windowBottom = 0.45;
  const windowTop = 3.0;
  const wingW = W - openHalf;
  const pierW = 0.12;
  const windowW = (wingW - pierW * 4) / 3;

  // Dintel sobre la abertura de entrada.
  b.box(m.wall, openHalf * 2, WALL_H - doorH, T, 0, doorH + (WALL_H - doorH) / 2, z);

  for (const side of [-1, 1]) {
    const centerX = side * (openHalf + wingW / 2);
    b.box(m.navyLifted, wingW, windowBottom, T, centerX, windowBottom / 2, z);
    b.box(m.wall, wingW, WALL_H - windowTop, T, centerX, windowTop + (WALL_H - windowTop) / 2, z);

    const windowH = windowTop - windowBottom;
    const windowY = windowBottom + windowH / 2;
    for (let i = 0; i < 4; i += 1) {
      const px = openHalf + pierW / 2 + i * (windowW + pierW);
      b.box(m.graphite, pierW, windowH, T, side * px, windowY, z);
    }
    for (let i = 0; i < 3; i += 1) {
      const gx = openHalf + pierW + windowW / 2 + i * (windowW + pierW);
      b.box(m.glass, windowW, windowH, 0.03, side * gx, windowY, z);
      b.box(m.goldMatte, windowW, 0.03, 0.18, side * gx, windowBottom + 0.015, z);
    }
  }
}

function buildEntrance({ batch: b, mats: m, signage }: StoreContext): void {
  const z = D + T / 2;
  const openHalf = 1.4;
  const doorH = 2.9;

  // Jambas, riel superior y umbral dorado.
  for (const side of [-1, 1]) {
    b.box(m.graphite, 0.08, doorH, T, side * (openHalf - 0.04), doorH / 2, z);
  }
  b.box(m.graphite, openHalf * 2, 0.14, 0.3, 0, doorH - 0.07, z);
  b.box(m.goldMatte, openHalf * 2, 0.02, 0.34, 0, 0.01, z);

  // Hojas correderas de vidrio estacionadas a cada lado (abertura libre central).
  const leafW = 1.4;
  const leafH = 2.8;
  const leafBottom = 0.05;
  for (const side of [-1, 1]) {
    [
      { cx: side * 2.1, lz: D - 0.08 },
      { cx: side * 1.95, lz: D - 0.2 },
    ].forEach(({ cx, lz }) => {
      b.box(m.glass, leafW, leafH, 0.012, cx, leafBottom + leafH / 2, lz);
      b.box(m.graphite, leafW, 0.06, 0.05, cx, leafBottom + leafH - 0.03, lz);
      b.box(m.graphite, leafW, 0.1, 0.05, cx, leafBottom + 0.05, lz);
      for (const edge of [-1, 1]) {
        b.box(m.graphite, 0.05, leafH, 0.05, cx + edge * (leafW / 2 - 0.025), leafBottom + leafH / 2, lz);
      }
      b.box(m.chrome, 0.025, 0.7, 0.035, cx - side * (leafW / 2 - 0.15), 1.1, lz - 0.04);
    });
  }

  // Pavimento exterior y felpudo interior.
  b.box(m.floorCarpet, 40, 0.1, 14, 0, -0.05, D + T + 7);
  b.box(m.rubber, 2.4, 0.015, 1.1, 0, 0.0075, D - 0.75);

  // Fachada exterior: banda azul marino con la marca A/C y las dos categorías.
  b.box(m.navy, W * 2 + 0.6, 0.9, 0.12, 0, 3.45, D + T + 0.06);
  b.box(m.goldMatte, W * 2 + 0.6, 0.03, 0.14, 0, 3.9, D + T + 0.06);
  b.box(m.goldMatte, W * 2 + 0.6, 0.03, 0.14, 0, 3.0, D + T + 0.06);
  signage.textPlane('A/C', 'textGold', 0, 3.45, D + T + 0.122, 3.2, 0.78);
  signage.textPlane('TAZAS', 'textGold', -3.6, 3.45, D + T + 0.122, 2.4, 0.4);
  signage.textPlane('GARRAFAS', 'textGold', 3.6, 3.45, D + T + 0.122, 2.8, 0.4);
  // Toldo de entrada.
  b.box(m.navy, 3.2, 0.1, 1.3, 0, 3.0, D + T + 0.65);
  b.box(m.goldMatte, 3.2, 0.04, 0.03, 0, 3.0, D + T + 1.3);

  // Cara interior del dintel (visible al girar hacia la salida) y marca sobre las vidrieras.
  signage.textPlane('GRACIAS POR SU VISITA', 'navy', 0, 3.3, D - 0.003, 2.6, 0.5, Math.PI);
  for (const side of [-1, 1]) {
    signage.textPlane('A/C', 'textGold', side * 4.2, 2.35, D + T / 2 - 0.022, 1.3, 0.5, Math.PI);
  }
}

function buildCeiling({ batch: b, mats: m }: StoreContext): void {
  // Losa del techo.
  b.box(m.ceiling, W * 2, 0.3, D * 2, 0, H + 0.15, 0);

  // Vigas transversales azul marino con tira LED cálida en el canto inferior.
  for (const z of [5.5, 0, -5.5]) {
    b.box(m.navy, W * 2 - 0.8, 0.25, 0.3, 0, H - 0.125, z);
    b.box(m.ledWarm, W * 2 - 1.2, 0.01, 0.04, 0, H - 0.255, z);
    b.box(m.goldMatte, W * 2 - 0.8, 0.02, 0.34, 0, H - 0.26, z);
  }

  // Líneas doradas y LED a lo largo del pasillo central: refuerzan la perspectiva.
  for (const side of [-1, 1]) {
    b.box(m.goldMatte, 0.03, 0.02, D * 2 - 0.6, side * STORE.runnerHalfWidth, H - 0.01, 0);
    b.box(m.ledWarm, 0.06, 0.008, D * 2 - 0.8, side * (STORE.runnerHalfWidth + 0.06), H - 0.006, 0);
  }
}
