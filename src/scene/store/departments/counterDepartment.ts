import { STORE } from '../constants';
import type { StoreContext } from '../context';
import { drawCounter, drawPos, drawShelfBay, drawStool } from '../products/fixtures';
import { createRng } from '../random';
import { softShadow, zonePatch } from './common';
import { fillBoxShelf, fillCupShelf, type CupTheme } from './cupShelf';

/**
 * C. Caja y atención al cliente: mostrador a lo largo de la pared derecha con terminal de
 * cobro, bolsas y regalos; vitrina de cristal; estanterías posteriores con tazas premium y
 * sets; suelo de madera y rótulo colgante.
 */
export function buildCounterDepartment(ctx: StoreContext): void {
  const { batch: b, mats: m, products: p, signage } = ctx;
  b.label = 'counter';
  const rng = createRng(303);

  zonePatch(ctx, m.floorWood, 4.8, 6.5, 4.2, 4.9);

  // Mostrador (cara frontal hacia -X, hacia el pasillo; el eje local X corre a lo largo de Z).
  const counterX = 3.5;
  const counterZ = 6.6;
  const top = 1.05;
  b.group(counterX, 0, counterZ, -Math.PI / 2, () => {
    drawCounter(b, m, { len: 4.0, depth: 0.7, h: top });

    // Terminal de cobro en el centro, mirando al cliente.
    b.group(0, top, -0.05, 0, () => drawPos(b, m));
    // Campanilla dorada.
    b.sphere(m.gold, 0.035, 0.022, 0.035, 0.62, top + 0.02, 0.12, undefined, 10, 6);
    b.cyl(m.gold, 0.04, 0.04, 0.008, 0.62, top + 0.004, 0.12, undefined, 10);
    // Bolsas de compra.
    p.place('bag', { x: 1.45, y: top, z: -0.05 }, { navy: true });
    p.place('bag', { x: 1.75, y: top, z: 0.02, ry: 0.2 }, { navy: false });
    // Muestra de tazas junto a la caja.
    p.place('cupStack', { x: -1.5, y: top, z: 0.05 }, { shape: 'cappuccino', color: 'white', count: 4, accent: { kind: 'rim', color: 'gold' }, seg: 12 });
    p.place('cup', { x: -1.1, y: top, z: 0.1 }, { shape: 'mug', color: 'navy', accent: { kind: 'stripe', color: 'gold' }, scale: 1.1, seg: 12 });
    p.place('cup', { x: -0.85, y: top, z: -0.05 }, { shape: 'tall', color: 'white', accent: { kind: 'dip', color: 'navy' }, scale: 1.1, seg: 12, turn: 0.4 });
    p.place('giftBox', { x: -1.95, y: top, z: -0.1 }, { w: 0.24, h: 0.14, d: 0.2, kind: 'set' });
  });
  softShadow(ctx, counterX, counterZ, 0.9, 4.0);

  // Vitrina de cristal en el extremo del mostrador.
  b.group(3.5, 0, 4.0, 0, () => {
    b.box(m.navyLifted, 0.62, 0.78, 0.6, 0, 0.39, 0);
    b.box(m.goldMatte, 0.64, 0.012, 0.62, 0, 0.78, 0);
    b.box(m.glass, 0.6, 0.46, 0.58, 0, 1.02, 0);
    b.box(m.goldMatte, 0.64, 0.02, 0.64, 0, 1.26, 0);
    p.place('cup', { x: -0.15, y: 0.79, z: 0.0 }, { shape: 'espresso', color: 'white', accent: { kind: 'rim', color: 'gold' }, saucer: true, scale: 1.2, seg: 12 });
    p.place('cup', { x: 0.15, y: 0.79, z: 0.0 }, { shape: 'espresso', color: 'navy', inner: 'white', accent: { kind: 'rim', color: 'gold' }, saucer: true, scale: 1.2, seg: 12, turn: Math.PI });
    p.place('cup', { x: 0, y: 0.79, z: -0.18 }, { shape: 'cappuccino', color: 'gold', inner: 'white', saucer: true, seg: 12 });
  });
  softShadow(ctx, 3.5, 4.0, 0.62, 0.6);

  // Estanterías posteriores en la pared derecha.
  const levels = [0.45, 0.95, 1.45, 1.95, 2.45];
  const themes: readonly (readonly CupTheme[])[] = [
    ['espresso', 'classic', 'dark', 'espresso'],
    ['classic', 'espresso', 'tall', 'classic'],
  ];
  [5.2, 7.4].forEach((z, bay) => {
    b.group(STORE.halfW - 0.18, 0, z, -Math.PI / 2, () => {
      drawShelfBay(b, m, { w: 2.2, h: 2.6, d: 0.36, levels });
      fillBoxShelf(ctx, rng, { w: 2.14, d: 0.36, y: levels[0] as number, maxH: 0.42 });
      (themes[bay] as readonly CupTheme[]).forEach((theme, i) => {
        fillCupShelf(ctx, rng, { w: 2.14, d: 0.36, y: levels[i + 1] as number, maxH: 0.42, theme, seg: 10 });
      });
    });
  });

  // Taburete del cajero, plantas y rótulo.
  b.group(4.9, 0, counterZ, 0, () => drawStool(b, m));
  p.place('plant', { x: 6.45, z: 8.55 }, { scale: 1.2 });
  p.place('plant', { x: 2.5, z: 8.55 }, { scale: 1.0 });
  signage.hanging('CAJA Y ATENCIÓN', counterX, 3.0, counterZ, 2.6, -Math.PI / 2, 'navy', 0.42, undefined, true);
}
