import * as THREE from 'three';
import { COLORS, STORE } from './constants';
import type { CupColor } from './products/cups';
import {
  createFloorTileTexture,
  createGlowTexture,
  createLabelTexture,
  createPosScreenTexture,
  createRunnerTexture,
  createSoftShadowTexture,
  createWoodTexture,
  type LabelId,
} from './textures';

const CUP_COLORS: Record<CupColor, { color: number; roughness: number; metalness?: number }> = {
  white: { color: 0xf8f8f6, roughness: 0.22 },
  ivory: { color: 0xeee3cc, roughness: 0.3 },
  navy: { color: 0x14377a, roughness: 0.25 },
  blue: { color: 0x2f74d0, roughness: 0.25 },
  sky: { color: 0x9cc8ee, roughness: 0.3 },
  black: { color: 0x1b1c20, roughness: 0.55 },
  graphite: { color: 0x4a4f58, roughness: 0.5 },
  terracotta: { color: 0xc4673f, roughness: 0.6 },
  sage: { color: 0x9fb59a, roughness: 0.5 },
  mustard: { color: 0xd9a63a, roughness: 0.45 },
  rose: { color: 0xe3b4ac, roughness: 0.4 },
  gold: { color: 0xd4af37, roughness: 0.28, metalness: 0.7 },
};

const LABEL_IDS: readonly LabelId[] = ['blue20', 'blue10', 'gold10', 'white5', 'sky3', 'pack15', 'case05', 'giftBox'];

/**
 * Biblioteca única de materiales compartidos. Los materiales se crean una sola vez y se
 * reutilizan en toda la escena (el batch estático fusiona por material).
 */
export function createMaterials() {
  const lambert = (color: number, name: string): THREE.MeshLambertMaterial => {
    const material = new THREE.MeshLambertMaterial({ color });
    material.name = name;
    return material;
  };
  /** Lambert con un pequeño aporte emisivo: levanta paredes y techo sin añadir luces. */
  const lambertLifted = (color: number, emissive: number, name: string): THREE.MeshLambertMaterial => {
    const material = new THREE.MeshLambertMaterial({ color, emissive });
    material.name = name;
    return material;
  };
  const standard = (color: number, name: string, roughness = 0.6, metalness = 0): THREE.MeshStandardMaterial => {
    const material = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    material.name = name;
    return material;
  };
  const basic = (color: number, name: string): THREE.MeshBasicMaterial => {
    const material = new THREE.MeshBasicMaterial({ color });
    material.name = name;
    return material;
  };
  /** Material de calcomanía: transparente, sin escritura de profundidad. */
  const decal = (map: THREE.Texture, name: string, opacity: number, color = 0xffffff, additive = false) => {
    const material = new THREE.MeshBasicMaterial({
      map,
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    material.name = name;
    return material;
  };

  // --- Suelos ---
  const floor = new THREE.MeshStandardMaterial({
    map: createFloorTileTexture(STORE.halfW * 2, STORE.halfD * 2),
    color: 0xeaeaea,
    roughness: 0.3,
    metalness: 0,
  });
  floor.name = 'floor';

  const runner = new THREE.MeshLambertMaterial({ map: createRunnerTexture((STORE.halfD * 2) / 2.4) });
  runner.name = 'runner';

  const woodMap = createWoodTexture();
  const wood = new THREE.MeshStandardMaterial({ map: woodMap, roughness: 0.55 });
  wood.name = 'wood';
  const floorWood = new THREE.MeshStandardMaterial({ map: createWoodTexture(3, 3), roughness: 0.4 });
  floorWood.name = 'floorWood';

  // --- Vidrio y plásticos translúcidos ---
  const glass = new THREE.MeshStandardMaterial({
    color: 0xa8d4ea,
    roughness: 0.05,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  glass.name = 'glass';

  const jugShell = new THREE.MeshStandardMaterial({
    color: 0x6fb9ee,
    roughness: 0.06,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  jugShell.name = 'jugShell';

  // --- Decales: sombras de contacto y charcos de luz ---
  const shadowSquare = decal(createSoftShadowTexture(128, 128, 30, 26), 'shadowSquare', 0.55, 0x000000);
  const shadowWide = decal(createSoftShadowTexture(256, 64, 16, 14), 'shadowWide', 0.55, 0x000000);
  const lightPool = decal(createGlowTexture(), 'lightPool', 0.5, 0xffd9a0, true);

  const cup = {} as Record<CupColor, THREE.MeshStandardMaterial>;
  (Object.keys(CUP_COLORS) as CupColor[]).forEach((key) => {
    const spec = CUP_COLORS[key];
    cup[key] = standard(spec.color, `cup:${key}`, spec.roughness, spec.metalness ?? 0);
  });

  const labels = {} as Record<LabelId, THREE.MeshStandardMaterial>;
  LABEL_IDS.forEach((id) => {
    const material = new THREE.MeshStandardMaterial({ map: createLabelTexture(id), roughness: 0.4 });
    material.name = `label:${id}`;
    labels[id] = material;
  });

  const posScreen = new THREE.MeshBasicMaterial({ map: createPosScreenTexture() });
  posScreen.name = 'posScreen';

  return {
    // --- Arquitectura ---
    floor,
    runner,
    wood,
    floorWood,
    wall: lambertLifted(COLORS.ivory, 0x77736a, 'wall'),
    navy: standard(COLORS.navy, 'navy', 0.45),
    navyDeep: lambertLifted(COLORS.navyDeep, 0x050d1e, 'navyDeep'),
    navyLifted: lambertLifted(COLORS.navy, 0x0a1c3c, 'navyLifted'),
    blue: standard(COLORS.blue, 'blue', 0.4),
    graphite: lambert(COLORS.graphite, 'graphite'),
    graphiteSoft: lambert(COLORS.graphiteSoft, 'graphiteSoft'),
    ceiling: lambertLifted(COLORS.ceiling, 0xb4b8be, 'ceiling'),
    rubber: lambert(0x1d1f23, 'rubber'),
    glass,
    floorWater: standard(0xdde8f3, 'floorWater', 0.3),
    floorCarpet: lambert(0x5d636b, 'floorCarpet'),
    whiteGloss: standard(0xf8f8f6, 'whiteGloss', 0.3),
    quartz: standard(0xf3f2ee, 'quartz', 0.18),
    ivory: lambert(0xece6d8, 'ivory'),

    // --- Metales y luz ---
    gold: standard(0xd4af37, 'gold', 0.3, 0.7),
    goldMatte: standard(COLORS.gold, 'goldMatte', 0.5, 0.35),
    chrome: standard(0xe3e6e9, 'chrome', 0.2, 0.7),
    steel: standard(0xaeb4bb, 'steel', 0.4, 0.55),
    ledWarm: basic(0xffe2a8, 'ledWarm'),
    lightPanel: basic(0xffffff, 'lightPanel'),
    shadowSquare,
    shadowWide,
    lightPool,

    // --- Tazas ---
    cup,
    cupLid: standard(0x24272d, 'cupLid', 0.5),

    // --- Agua ---
    jugShell,
    jugWater: standard(0x4fb0ec, 'jugWater', 0.1),
    bottleBody: standard(0xa9d6f2, 'bottleBody', 0.12),
    capBlue: standard(0x1d63d6, 'capBlue', 0.35),
    capGold: standard(0xd4af37, 'capGold', 0.3, 0.6),
    capWhite: standard(0xf4f4f2, 'capWhite', 0.35),
    capNavy: standard(COLORS.navy, 'capNavy', 0.35),
    labels,
    crateBlue: lambert(0x1a4aa0, 'crateBlue'),
    palletWood: lambert(0xc29a62, 'palletWood'),
    strap: lambert(0x2a62c6, 'strap'),
    tapBlue: standard(0x2f7fe0, 'tapBlue', 0.3),

    // --- Cartón, bolsas y regalos ---
    cardboard: lambert(0xc8a878, 'cardboard'),
    boxWhite: lambert(0xf1f1ef, 'boxWhite'),
    boxNavy: lambert(0x12388a, 'boxNavy'),

    // --- Caja y mobiliario ---
    posScreen,
    screenOff: standard(0x07090c, 'screenOff', 0.08, 0.25),
    cushion: lambert(0x16408a, 'cushion'),
    cushionIvory: lambert(0xe6dcc6, 'cushionIvory'),
    tag: lambert(0xffffff, 'tag'),

    // --- Plantas ---
    leaf: lambert(0x3d8a4e, 'leaf'),
    leafDark: lambert(0x2f6e3d, 'leafDark'),
    potWhite: standard(0xf2f2f0, 'potWhite', 0.5),
    soil: lambert(0x3b2a20, 'soil'),
  };
}

export type Materials = ReturnType<typeof createMaterials>;

/** Libera materiales y texturas asociadas (incluye los registros anidados de tazas y etiquetas). */
export function disposeMaterials(materials: Materials): void {
  const seen = new Set<THREE.Material>();
  const visit = (value: unknown): void => {
    if (value instanceof THREE.Material) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
      const map = (value as THREE.MeshBasicMaterial).map;
      if (map) {
        map.dispose();
      }
      value.dispose();
    } else if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(visit);
    }
  };
  visit(materials);
}
