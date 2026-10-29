import { STORE } from '../constants';
import type { StoreContext } from '../context';
import { drawDisplayTable, drawRisers, drawShelfBay } from '../products/fixtures';
import { softShadow, zonePatch } from './common';

const ISLAND_X = 3.3;
const TABLE = { len: 1.9, depth: 0.9, h: 0.8 } as const;

function row(count: number, pitch: number, place: (x: number, index: number) => void): void {
  const start = -((count - 1) * pitch) / 2;
  for (let i = 0; i < count; i += 1) {
    place(start + i * pitch, i);
  }
}

/** Centros (z) de los cuatro módulos de la pared derecha y superficies de sus baldas. */
const RACK_Z: readonly number[] = [-7.3, -5.2, -3.1, -1.0];
const TIER: readonly number[] = [0.14, 0.64, 1.14, 1.64, 2.14];

/**
 * B (1/4). Pared de garrafas: cuatro módulos de estantería con garrafones de 20 L acostados en
 * cuna, garrafas de 10, 5 y 3 L, paquetes de botellas de 1,5 L y cajas de 500 mL.
 */
export function buildWaterRacks(ctx: StoreContext): void {
  const { batch: b, mats: m, products: p, signage } = ctx;
  b.label = 'waterRacks';

  // Suelo azul pálido bajo la zona de agua.
  zonePatch(ctx, m.floorWater, 5.4, -4.4, 3.0, 9.0);

  RACK_Z.forEach((z, bay) => {
    b.group(STORE.halfW - 0.31, 0, z, -Math.PI / 2, () => {
      drawShelfBay(b, m, { w: 2.0, h: 2.5, d: 0.62, levels: TIER });
      const seg = 8;
      switch (bay) {
        case 0:
          // Garrafones de 20 L acostados (cuello hacia el cliente).
          for (let tier = 0; tier < 3; tier += 1) {
            row(6, 0.29, (x) => {
              p.place('jugLying', { x, y: TIER[tier] as number, z: 0 }, { capacity: '20', label: 'blue20', cap: 'blue', seg });
            });
          }
          row(8, 0.235, (x) => {
            p.place('jug', { x, y: TIER[3] as number, z: 0.12 }, { capacity: '10', label: 'blue10', cap: 'blue', seg });
          });
          row(10, 0.19, (x) => {
            p.place('jug', { x, y: TIER[4] as number, z: 0.12 }, { capacity: '5', label: 'white5', cap: 'navy', seg });
          });
          break;
        case 1:
          // Línea premium: garrafas de 10 L con tapa dorada.
          for (let tier = 0; tier < 4; tier += 1) {
            row(8, 0.235, (x) => {
              p.place('jug', { x, y: TIER[tier] as number, z: 0.12 }, { capacity: '10', label: 'gold10', cap: 'gold', seg });
            });
          }
          row(10, 0.19, (x) => {
            p.place('jug', { x, y: TIER[4] as number, z: 0.12 }, { capacity: '5', label: 'white5', cap: 'gold', seg });
          });
          break;
        case 2:
          for (let tier = 0; tier < 2; tier += 1) {
            row(10, 0.19, (x) => {
              p.place('jug', { x, y: TIER[tier] as number, z: 0.12 }, { capacity: '5', label: 'white5', cap: 'blue', seg });
            });
          }
          for (let tier = 2; tier < 4; tier += 1) {
            row(12, 0.16, (x) => {
              p.place('jug', { x, y: TIER[tier] as number, z: 0.12 }, { capacity: '3', label: 'sky3', cap: 'white', seg });
            });
          }
          row(10, 0.19, (x) => {
            p.place('jug', { x, y: TIER[4] as number, z: 0.12 }, { capacity: '5', label: 'white5', cap: 'navy', seg });
          });
          break;
        default:
          for (let tier = 0; tier < 2; tier += 1) {
            row(5, 0.34, (x) => {
              p.place('bottlePack', { x, y: TIER[tier] as number, z: 0.1 }, { cols: 3, rows: 2, size: '15' });
            });
          }
          row(4, 0.46, (x) => {
            p.place('bottleCase', { x, y: TIER[2] as number, z: 0.1 });
          });
          row(12, 0.1, (x) => {
            p.place('bottle', { x, y: TIER[3] as number, z: 0.15 }, { size: '15', label: 'pack15', cap: 'blue' });
          });
          row(4, 0.46, (x) => {
            p.place('bottleCase', { x, y: TIER[4] as number, z: 0.1 });
          });
          break;
      }
    });
  });

  softShadow(ctx, 6.5, -4.15, 0.7, 8.5);
  // Cuadro de marca en el tramo libre de la pared, junto a la caja.
  signage.board('A/C', STORE.halfW - 0.05, 1.95, 1.9, 2.0, 1.2, -Math.PI / 2, 'navy', 'TAZAS Y GARRAFAS');
  signage.board('GARRAFAS DE AGUA', STORE.halfW - 0.05, 3.27, -4.15, 4.2, 0.4, -Math.PI / 2, 'navy');
}

/** B (2/4). Tarimas de garrafones de 20 L apilados al fondo, junto a los estantes. */
export function buildWaterFloor(ctx: StoreContext): void {
  const { batch: b, products: p } = ctx;
  b.label = 'waterFloor';
  p.place('palletJugs', { x: 5.1, z: -7.6 }, { layers: 3, label: 'blue20', cap: 'blue' });
  p.place('palletJugs', { x: 5.1, z: -5.7 }, { layers: 2, label: 'blue20', cap: 'white' });
  softShadow(ctx, 5.1, -7.6, 0.8, 1.2);
  softShadow(ctx, 5.1, -5.7, 0.8, 1.2);
  void b;
}

/** B (3/4). Tres islas: dispensadores de piso, botellas y garrafas sobre escalones, y paquetes. */
export function buildWaterIslands(ctx: StoreContext): void {
  const { batch: b, mats: m, products: p } = ctx;
  b.label = 'waterIslands';

  const zA = 1.8;
  const zB = -0.9;
  const zC = -3.6;

  // Isla A: tarima baja con tres dispensadores de piso.
  b.group(ISLAND_X, 0, zA, 0, () => drawRisers(b, m, { len: 1.9, depth: 0.9, steps: 1, step: 0.1 }));
  softShadow(ctx, ISLAND_X, zA, 1.9, 0.9);
  b.group(ISLAND_X, 0.1, zA, 0, () => {
    row(3, 0.62, (x) => {
      p.place('dispenser', { x, z: 0 }, { variant: 'floor' });
    });
  });

  // Isla B: dispensador de mesa y escalones con garrafas de 5 y 3 L.
  b.group(ISLAND_X, 0, zB, 0, () => drawDisplayTable(b, m, TABLE));
  softShadow(ctx, ISLAND_X, zB, TABLE.len, TABLE.depth);
  b.group(ISLAND_X, TABLE.h, zB, 0, () => {
    p.place('dispenser', { x: -0.66, z: 0 }, { variant: 'table' });
    b.group(0.3, 0, 0, 0, () => {
      drawRisers(b, m, { len: 1.2, depth: 0.6, steps: 2, step: 0.08 });
      row(6, 0.19, (x) => {
        p.place('jug', { x, y: 0.16, z: -0.15 }, { capacity: '5', label: 'white5', cap: 'navy', seg: 10 });
      });
      row(7, 0.16, (x) => {
        p.place('jug', { x, y: 0.08, z: 0.15 }, { capacity: '3', label: 'sky3', cap: 'white', seg: 10 });
      });
    });
  });

  // Isla C: paquetes de 1,5 L, cajas de 500 mL y garrafas premium.
  b.group(ISLAND_X, 0, zC, 0, () => drawDisplayTable(b, m, TABLE));
  softShadow(ctx, ISLAND_X, zC, TABLE.len, TABLE.depth);
  b.group(ISLAND_X, TABLE.h, zC, 0, () => {
    row(3, 0.55, (x) => {
      p.place('bottleCase', { x, z: -0.15 });
    });
    p.place('bottleCase', { x: 0, y: 0.21, z: -0.15 });
    row(4, 0.34, (x) => {
      p.place('bottlePack', { x: x - 0.1, z: 0.22 }, { cols: 3, rows: 2, size: '15' });
    });
    for (const side of [-1, 1]) {
      p.place('jug', { x: side * 0.82, z: 0.2 }, { capacity: '10', label: 'gold10', cap: 'gold', seg: 10 });
    }
  });
}

/** B (4/4). Vitrina de agua premium en el fondo, a la derecha. */
export function buildWaterNiche(ctx: StoreContext): void {
  const { batch: b, mats: m, products: p, signage } = ctx;
  b.label = 'waterNiche';
  const levels = [0.5, 1.0, 1.5, 2.0, 2.5];

  b.group(3.7, 0, -STORE.halfD + 0.2, 0, () => {
    drawShelfBay(b, m, { w: 2.2, h: 2.7, d: 0.32, levels });
    row(7, 0.285, (x) => {
      p.place('jug', { x, y: levels[0] as number, z: 0.04 }, { capacity: '10', label: 'gold10', cap: 'gold', seg: 10 });
    });
    row(9, 0.22, (x) => {
      p.place('jug', { x, y: levels[1] as number, z: 0.04 }, { capacity: '5', label: 'white5', cap: 'gold', seg: 10 });
    });
    row(11, 0.18, (x) => {
      p.place('jug', { x, y: levels[2] as number, z: 0.04 }, { capacity: '3', label: 'sky3', cap: 'navy', seg: 10 });
    });
    row(14, 0.145, (x) => {
      p.place('bottle', { x, y: levels[3] as number, z: 0.06 }, { size: '15', label: 'pack15', cap: 'gold', seg: 8 });
    });
  });
  signage.board('AGUA PREMIUM', 3.7, 3.0, -STORE.halfD + 0.1, 2.2, 0.3, 0, 'navy');
}
