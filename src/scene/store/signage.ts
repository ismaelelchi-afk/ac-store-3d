import * as THREE from 'three';
import type { StaticBatch } from './batch';
import { COLORS, STORE, hex } from './constants';
import type { Materials } from './materials';
import { createSignTexture, type SignStyle } from './textures';

const GOLD_TEXT = [hex(COLORS.goldLight), hex(COLORS.goldDeep)] as const;

/** Estilos de rótulo reutilizables (paleta azul marino / dorado / blanco). */
export const SIGN_STYLES = {
  navy: { background: hex(COLORS.navy), foreground: GOLD_TEXT, subtitle: hex(COLORS.goldLight), border: hex(COLORS.gold) } satisfies SignStyle,
  gold: { background: hex(COLORS.gold), foreground: hex(COLORS.navyDeep), subtitle: hex(COLORS.navyDeep) } satisfies SignStyle,
  white: { background: '#ffffff', foreground: hex(COLORS.navy), subtitle: hex(COLORS.goldDeep), border: hex(COLORS.gold) } satisfies SignStyle,
  textGold: { background: null, foreground: GOLD_TEXT, subtitle: hex(COLORS.goldLight) } satisfies SignStyle,
  textWhite: { background: null, foreground: '#ffffff', subtitle: '#ffffff' } satisfies SignStyle,
  textNavy: { background: null, foreground: hex(COLORS.navy), subtitle: hex(COLORS.navy) } satisfies SignStyle,
};

export type SignStyleName = keyof typeof SIGN_STYLES;

/**
 * Carteles geométricos con texto en canvas. Los tableros se fusionan en el batch; solo las
 * caras con texto son mallas sueltas (un plano de 2 triángulos por cartel).
 */
export class Signage {
  /** Planos con texto (se añade a la escena). */
  public readonly group = new THREE.Group();

  private readonly batch: StaticBatch;
  private readonly mats: Materials;
  private readonly plane = new THREE.PlaneGeometry(1, 1);
  private readonly textMaterials: THREE.MeshBasicMaterial[] = [];

  constructor(batch: StaticBatch, mats: Materials) {
    this.batch = batch;
    this.mats = mats;
    this.group.name = 'rotulos';
  }

  /** Plano con texto en la transformación actual + (x, y, z, ry). Mira hacia +Z local. */
  textPlane(
    text: string,
    style: SignStyleName,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    ry = 0,
    subtitle?: string,
  ): void {
    const pxW = 1024;
    const pxH = Math.max(96, Math.min(512, Math.round((pxW * h) / w)));
    const texture = createSignTexture(text, pxW, pxH, SIGN_STYLES[style], subtitle);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: SIGN_STYLES[style].background === null,
      toneMapped: false,
    });
    material.name = `sign:${text}`;
    this.textMaterials.push(material);

    const mesh = new THREE.Mesh(this.plane, material);
    mesh.name = `rotulo:${text}`;
    this.batch.placeObject(mesh, x, y, z, ry, w, h, 1);
    this.group.add(mesh);
  }

  /** Tablero de pared con borde dorado y texto. Mira hacia +Z local (gira con `ry`). */
  board(
    label: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    ry = 0,
    style: SignStyleName = 'navy',
    subtitle?: string,
    both = false,
  ): void {
    const b = this.batch;
    const depth = 0.08;
    b.group(x, y, z, ry, () => {
      b.box(this.mats.navy, w, h, depth, 0, 0, 0);
      b.box(this.mats.gold, w + 0.04, 0.025, depth + 0.01, 0, h / 2, 0);
      b.box(this.mats.gold, w + 0.04, 0.025, depth + 0.01, 0, -h / 2, 0);
      this.textPlane(label, style, 0, 0, depth / 2 + 0.002, w - 0.06, h - 0.05, 0, subtitle);
      if (both) {
        this.textPlane(label, style, 0, 0, -depth / 2 - 0.002, w - 0.06, h - 0.05, Math.PI, subtitle);
      }
    });
  }

  /** Cartel colgante: tablero con dos varillas doradas hasta el techo. */
  hanging(
    label: string,
    x: number,
    y: number,
    z: number,
    w: number,
    ry = 0,
    style: SignStyleName = 'navy',
    h = 0.5,
    subtitle?: string,
    both = false,
  ): void {
    this.board(label, x, y, z, w, h, ry, style, subtitle, both);
    const rodLength = STORE.height - (y + h / 2);
    if (rodLength <= 0.02) {
      return;
    }
    this.batch.group(x, y, z, ry, () => {
      for (const side of [-1, 1]) {
        this.batch.cyl(this.mats.gold, 0.008, 0.008, rodLength, side * w * 0.4, h / 2 + rodLength / 2, 0, undefined, 6);
      }
    });
  }

  dispose(): void {
    this.plane.dispose();
    this.textMaterials.forEach((material) => {
      material.map?.dispose();
      material.dispose();
    });
    this.textMaterials.length = 0;
  }
}
