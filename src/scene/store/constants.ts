/**
 * Dimensiones, paleta, zonas y puntos de vista de la tienda A/C Store 3D (metros).
 *
 * Sistema de coordenadas:
 *  - X: izquierda (-) / derecha (+) visto desde la entrada.
 *  - Y: altura.
 *  - Z: fondo de la tienda (-) / entrada (+). La pared de la entrada está en z = +9.
 */

export const STORE = {
  /** Semiancho interior: x ∈ [-7, 7]. */
  halfW: 7,
  /** Semifondo interior: z ∈ [-9, 9]. */
  halfD: 9,
  /** Altura libre interior hasta la cara inferior del techo. */
  height: 3.6,
  /** Grosor de muros (se construyen hacia afuera: la cara interior queda exacta). */
  wallThickness: 0.3,
  /** Semiancho de la alfombra central. */
  runnerHalfWidth: 1.2,
} as const;

export const COLORS = {
  navy: 0x0c2b5e,
  navyDeep: 0x071a3d,
  blue: 0x1f5fc0,
  blueSoft: 0x8fbce8,
  gold: 0xc9a24a,
  goldLight: 0xe8cd85,
  goldDeep: 0x9a7a2c,
  white: 0xf7f8fa,
  ivory: 0xf2eee4,
  graphite: 0x2b2e34,
  graphiteSoft: 0x434850,
  oak: 0xb98c5a,
  ceiling: 0xf6f7f9,
  /** Color de fondo visible solo a través de la entrada y las ventanas. */
  sky: 0xcfe3f5,
} as const;

/** Color numérico → "#rrggbb" (para texturas de canvas). */
export const hex = (color: number): string => `#${color.toString(16).padStart(6, '0')}`;

export type ZoneId =
  | 'feature'
  | 'cupWall'
  | 'cupNiche'
  | 'cupIslands'
  | 'waterRacks'
  | 'waterFloor'
  | 'waterIslands'
  | 'waterNiche'
  | 'counter'
  | 'gifts';

export interface Zone {
  id: ZoneId;
  label: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Zonas comerciales (huella en planta). Todo lo que construye un departamento debe
 * quedar dentro de su zona; la verificación automática lo comprueba.
 */
export const ZONES: Record<ZoneId, Zone> = {
  feature: { id: 'feature', label: 'Pared de marca', minX: -2.6, maxX: 2.6, minZ: -8.95, maxZ: -7.9 },
  cupWall: { id: 'cupWall', label: 'Pared de tazas', minX: -6.95, maxX: -6.2, minZ: -8.95, maxZ: 2.4 },
  cupNiche: { id: 'cupNiche', label: 'Colección premium', minX: -4.95, maxX: -2.5, minZ: -8.95, maxZ: -8.2 },
  cupIslands: { id: 'cupIslands', label: 'Islas de tazas', minX: -4.4, maxX: -2.2, minZ: -4.2, maxZ: 2.4 },
  waterRacks: { id: 'waterRacks', label: 'Estantes de garrafas', minX: 6.0, maxX: 6.95, minZ: -8.95, maxZ: 3.0 },
  waterFloor: { id: 'waterFloor', label: 'Tarimas de garrafas', minX: 4.3, maxX: 5.9, minZ: -8.7, maxZ: -4.6 },
  waterIslands: { id: 'waterIslands', label: 'Dispensadores y botellas', minX: 2.2, maxX: 4.4, minZ: -4.2, maxZ: 2.4 },
  waterNiche: { id: 'waterNiche', label: 'Agua premium', minX: 2.5, maxX: 4.95, minZ: -8.95, maxZ: -8.2 },
  counter: { id: 'counter', label: 'Caja y atención', minX: 2.0, maxX: 6.95, minZ: 3.3, maxZ: 8.9 },
  gifts: { id: 'gifts', label: 'Regalos', minX: -6.95, maxX: -1.5, minZ: 3.2, maxZ: 8.9 },
};

export type ViewpointId =
  | 'entrada'
  | 'tazas'
  | 'garrafas'
  | 'caja'
  | 'regalos';

export interface Viewpoint {
  id: ViewpointId;
  label: string;
  position: readonly [number, number, number];
  target: readonly [number, number, number];
}

/** Puntos de vista de pie (altura de ojos 1,62 m). El primero es la vista inicial. */
export const VIEWPOINTS: readonly Viewpoint[] = [
  { id: 'entrada', label: 'Entrada', position: [0, 1.62, 7.6], target: [0, 1.75, -9] },
  { id: 'tazas', label: 'Tazas', position: [-2.2, 1.62, 3.6], target: [-6.9, 1.5, -2.8] },
  { id: 'garrafas', label: 'Garrafas', position: [2.2, 1.62, 3.6], target: [6.9, 1.2, -4.2] },
  { id: 'caja', label: 'Caja', position: [0.2, 1.62, 2.4], target: [4.6, 1.15, 6.6] },
  { id: 'regalos', label: 'Regalos', position: [-0.2, 1.62, 2.4], target: [-4.6, 1.1, 6.6] },
];
