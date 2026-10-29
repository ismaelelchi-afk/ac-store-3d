import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildArchitecture } from './architecture';
import { StaticBatch } from './batch';
import { COLORS } from './constants';
import type { StoreContext } from './context';
import { buildCounterDepartment } from './departments/counterDepartment';
import { buildCupIslands } from './departments/cupIslandsDepartment';
import { buildCupNiche, buildCupWall } from './departments/cupWallDepartment';
import { buildFeatureWall } from './departments/featureWall';
import { buildGiftsDepartment } from './departments/giftsDepartment';
import { buildWaterFloor, buildWaterIslands, buildWaterNiche, buildWaterRacks } from './departments/waterDepartment';
import { buildCeilingFixtures, createStoreLights } from './lighting';
import { ProductLibrary } from './library';
import { createMaterials, disposeMaterials, type Materials } from './materials';
import { Signage } from './signage';

export interface StoreSceneOptions {
  /** Registra cajas envolventes por primitiva (solo para verificación automática). */
  trackBounds?: boolean;
  /** Si se indica, genera un entorno procedural (reflejos suaves en dorado, vidrio y suelo). */
  renderer?: THREE.WebGLRenderer;
}

/** Orden de dibujo de las mallas transparentes: calcomanías → vidrio → garrafas → rótulos. */
const RENDER_ORDER: Record<string, number> = {
  shadowSquare: 1,
  shadowWide: 1,
  lightPool: 1,
  glass: 2,
  jugShell: 3,
};

/**
 * Escena de la tienda A/C Store 3D: local comercial pequeño-mediano para tazas de café y
 * garrafas de agua, construido solo con geometría procedural de Three.js.
 *
 * Es una escena estática: no tiene animación propia, por lo que `main.ts` solo renderiza
 * cuando la cámara se mueve, al redimensionar la ventana o al volver a primer plano.
 */
export class StoreScene {
  public readonly scene = new THREE.Scene();
  public readonly batch: StaticBatch;
  public readonly products: ProductLibrary;

  private readonly mats: Materials;
  private readonly signage: Signage;
  private environment: THREE.WebGLRenderTarget | null = null;

  constructor(options: StoreSceneOptions = {}) {
    this.scene.name = 'tienda-ac-store-3d';
    this.scene.background = new THREE.Color(COLORS.sky);

    if (options.renderer) {
      this.createEnvironment(options.renderer);
    }

    this.mats = createMaterials();
    this.batch = new StaticBatch(options.trackBounds === true);
    this.products = new ProductLibrary(this.batch, this.mats);
    this.signage = new Signage(this.batch, this.mats);

    const ctx: StoreContext = {
      batch: this.batch,
      mats: this.mats,
      products: this.products,
      signage: this.signage,
    };

    buildArchitecture(ctx);
    buildCeilingFixtures(ctx);
    buildFeatureWall(ctx);
    buildCupWall(ctx);
    buildCupNiche(ctx);
    buildCupIslands(ctx);
    buildWaterRacks(ctx);
    buildWaterFloor(ctx);
    buildWaterIslands(ctx);
    buildWaterNiche(ctx);
    buildCounterDepartment(ctx);
    buildGiftsDepartment(ctx);

    const built = this.batch.build('tienda-estatica');
    built.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const material = object.material as THREE.Material;
        object.renderOrder = RENDER_ORDER[material.name] ?? 0;
      }
    });
    this.signage.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.renderOrder = 5;
      }
    });

    this.scene.add(built);
    this.scene.add(this.signage.group);
    this.scene.add(this.products.overrides);
    this.scene.add(createStoreLights());
  }

  private createEnvironment(renderer: THREE.WebGLRenderer): void {
    try {
      const generator = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      this.environment = generator.fromScene(room as unknown as THREE.Scene, 0.04);
      room.dispose();
      generator.dispose();
      this.scene.environment = this.environment.texture;
      this.scene.environmentIntensity = 0.4;
    } catch (error) {
      console.warn('Entorno procedural no disponible; se usa solo la iluminación base.', error);
    }
  }

  /** La tienda es estática; existe para compartir la interfaz con otras escenas. */
  animate(): void {}

  dispose(): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
      }
    });
    this.signage.dispose();
    disposeMaterials(this.mats);
    this.environment?.dispose();
    this.environment = null;
  }
}
