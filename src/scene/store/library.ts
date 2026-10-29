import * as THREE from 'three';
import type { StaticBatch } from './batch';
import type { Materials } from './materials';
import {
  drawCup,
  drawCupStack,
  drawGiftBox,
  drawMugTree,
  drawSaucerStack,
  type CupColor,
  type CupOptions,
  type CupStackOptions,
  type GiftBoxOptions,
} from './products/cups';
import { drawBag, drawPlant, drawPriceTag } from './products/fixtures';
import {
  drawBottle,
  drawBottleCase,
  drawBottlePack,
  drawDispenser,
  drawJug,
  drawJugLying,
  drawPalletJugs,
  type BottleOptions,
  type DispenserOptions,
  type JugOptions,
  type PalletJugsOptions,
} from './products/water';

/**
 * Catálogo de productos provisionales.
 *
 * Cada tipo de producto se dibuja con geometría procedural, pero el resto de la tienda solo
 * conoce `ProductLibrary.place(kind, ...)`. Para sustituir un producto por un modelo GLB en el
 * futuro basta con registrar una fábrica:
 *
 *   library.registerOverride('cup', (options) => cloneDelModeloGlb(options));
 *
 * y todas las tazas de la tienda pasan a usar el modelo, sin tocar los departamentos. Los
 * objetos sustituidos viven en `library.overrides` (no se fusionan).
 */

export interface ProductOptionsMap {
  cup: CupOptions;
  cupStack: CupStackOptions;
  saucerStack: { count: number; scale?: number };
  mugTree: { colors: readonly CupColor[] };
  giftBox: GiftBoxOptions;
  jug: JugOptions;
  jugLying: JugOptions;
  bottle: BottleOptions;
  bottlePack: { cols: number; rows: number; size: '15' | '05' };
  bottleCase: undefined;
  palletJugs: PalletJugsOptions;
  dispenser: DispenserOptions;
  plant: { scale: number };
  bag: { navy: boolean };
  priceTag: undefined;
}

export type ProductKind = keyof ProductOptionsMap;

export interface Placement {
  x?: number;
  y?: number;
  z?: number;
  /** Giro alrededor de Y (radianes). */
  ry?: number;
}

type Drawers = {
  [K in ProductKind]: (b: StaticBatch, m: Materials, options: ProductOptionsMap[K]) => void;
};

const DRAWERS: Drawers = {
  cup: drawCup,
  cupStack: drawCupStack,
  saucerStack: drawSaucerStack,
  mugTree: drawMugTree,
  giftBox: drawGiftBox,
  jug: drawJug,
  jugLying: drawJugLying,
  bottle: drawBottle,
  bottlePack: drawBottlePack,
  bottleCase: (b, m) => drawBottleCase(b, m),
  palletJugs: drawPalletJugs,
  dispenser: drawDispenser,
  plant: drawPlant,
  bag: drawBag,
  priceTag: (b, m) => drawPriceTag(b, m),
};

type OptionsArgs<K extends ProductKind> = ProductOptionsMap[K] extends undefined
  ? []
  : [options: ProductOptionsMap[K]];

export class ProductLibrary {
  /** Objetos sueltos que sustituyen a productos geométricos (p. ej. modelos GLB). */
  public readonly overrides = new THREE.Group();

  private readonly batch: StaticBatch;
  private readonly materials: Materials;
  private readonly factories = new Map<ProductKind, (options: unknown) => THREE.Object3D>();

  constructor(batch: StaticBatch, materials: Materials) {
    this.batch = batch;
    this.materials = materials;
    this.overrides.name = 'productos-sustituidos';
  }

  /** Registra una fábrica que reemplaza el dibujo geométrico de `kind`. */
  registerOverride<K extends ProductKind>(
    kind: K,
    factory: (options: ProductOptionsMap[K]) => THREE.Object3D,
  ): void {
    this.factories.set(kind, factory as (options: unknown) => THREE.Object3D);
  }

  /** Coloca un producto en la transformación actual del batch + `at`. */
  place<K extends ProductKind>(kind: K, at: Placement, ...args: OptionsArgs<K>): void {
    const options = args[0] as ProductOptionsMap[K];
    const x = at.x ?? 0;
    const y = at.y ?? 0;
    const z = at.z ?? 0;
    const ry = at.ry ?? 0;

    const factory = this.factories.get(kind);
    if (factory) {
      const object = factory(options);
      this.batch.placeObject(object, x, y, z, ry);
      this.overrides.add(object);
      return;
    }

    const drawer = DRAWERS[kind] as (b: StaticBatch, m: Materials, o: ProductOptionsMap[K]) => void;
    this.batch.group(x, y, z, ry, () => drawer(this.batch, this.materials, options));
  }
}
