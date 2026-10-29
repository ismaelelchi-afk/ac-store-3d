import * as THREE from 'three';
import { STORE } from './constants';
import type { StoreContext } from './context';
import { drawPendant } from './products/fixtures';

const PANEL_X: readonly number[] = [-5.8, -3.7, 3.7, 5.8];
const PANEL_Z: readonly number[] = [7.2, 4.2, 1.2, -1.8, -4.8, -7.8];

/** Pendientes: [x, z, radio]. Cuelgan sobre las islas de exposición y el mostrador. */
const PENDANTS: readonly (readonly [number, number, number])[] = [
  [-3.3, 1.8, 0.3],
  [-3.3, -0.9, 0.3],
  [-3.3, -3.6, 0.3],
  [3.3, 1.8, 0.3],
  [3.3, -0.9, 0.3],
  [3.3, -3.6, 0.3],
  [3.7, 4.8, 0.2],
  [3.7, 6.2, 0.2],
  [3.7, 7.6, 0.2],
  [-3.3, 5.6, 0.26],
];

/**
 * Luminarias de techo (geometría emisiva fusionada en el batch): paneles LED, pendientes de
 * latón con difusor cálido y charcos de luz sobre el suelo. No son luces reales, así que no
 * cuestan nada por píxel.
 */
export function buildCeilingFixtures({ batch: b, mats: m }: StoreContext): void {
  b.label = 'iluminacion';

  for (const x of PANEL_X) {
    for (const z of PANEL_Z) {
      b.box(m.graphite, 0.42, 0.04, 1.72, x, STORE.height - 0.02, z);
      b.box(m.lightPanel, 0.34, 0.02, 1.64, x, STORE.height - 0.05, z);
    }
  }

  for (const [x, z, radius] of PENDANTS) {
    const y = 2.55;
    b.group(x, 0, z, 0, () => {
      drawPendant(b, m, { ceilingY: STORE.height, y, radius });
    });
    // Charco de luz cálida bajo cada pendiente.
    const pool = Math.min(3.4, 2 * (STORE.halfD - Math.abs(z)), 2 * (STORE.halfW - Math.abs(x)));
    b.plane(m.lightPool, pool, pool, x, 0.026, z, { rx: -Math.PI / 2 });
  }
}

/**
 * Luces reales: solo 2 (hemisférica cálida + direccional), sin sombras. Es lo más barato
 * posible para un teléfono; la sensación de iluminación comercial viene de las luminarias
 * emisivas, la luz indirecta del sofito, el entorno procedural y el suelo brillante.
 */
export function createStoreLights(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'luces';

  group.add(new THREE.HemisphereLight(0xffffff, 0xd9d0bf, 1.0));

  const sun = new THREE.DirectionalLight(0xfff3dc, 0.6);
  sun.position.set(-3, 10, 8);
  group.add(sun);

  return group;
}
