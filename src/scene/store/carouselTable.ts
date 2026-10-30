import * as THREE from 'three';

const TABLE_RADIUS = 0.78;
const SPIN_SPEED = 0.18;
const TABLE_Y = 0.012;
const PLATE_THICKNESS = 0.02;
const PLATE_TOP = PLATE_THICKNESS / 2;
const SAUCER_EMBED = 0.002;
const CUP_SEAT_Y = PLATE_TOP - SAUCER_EMBED;

export const CAROUSEL_TABLE_POSITION = { x: 0, y: TABLE_Y, z: 0 } as const;

type MugModel = {
  radius: number;
  height: number;
  handleR: number;
  wall: number;
};

const MUG_MODELS: Record<'espresso' | 'classic' | 'jumbo', MugModel> = {
  espresso: { radius: 0.034, height: 0.06, handleR: 0.021, wall: 0.005 },
  classic: { radius: 0.044, height: 0.097, handleR: 0.029, wall: 0.006 },
  jumbo: { radius: 0.05, height: 0.118, handleR: 0.033, wall: 0.006 },
};

const GLAZES = [
  { id: 'navy', color: '#123A63', metalness: 0.08, roughness: 0.16 },
  { id: 'gold', color: '#C79A2C', metalness: 0.9, roughness: 0.24 },
  { id: 'champagne', color: '#DCC48A', metalness: 0.55, roughness: 0.3 },
  { id: 'cream', color: '#EFE6D2', metalness: 0.02, roughness: 0.28 },
  { id: 'white', color: '#F7F9FB', metalness: 0.02, roughness: 0.14 },
  { id: 'azure', color: '#2E86DE', metalness: 0.05, roughness: 0.18 },
  { id: 'midnight', color: '#101C2B', metalness: 0.12, roughness: 0.2 },
  { id: 'sand', color: '#C9B48C', metalness: 0.05, roughness: 0.34 },
] as const;

type GlazeId = (typeof GLAZES)[number]['id'];

function mugProfile(model: MugModel): THREE.Vector2[] {
  const r = model.radius;
  const h = model.height;
  const t = model.wall;
  return [
    [0.0008, 0.002],
    [r * 0.62, 0.002],
    [r * 0.9, 0.006],
    [r, h * 0.12],
    [r * 0.99, h * 0.5],
    [r * 0.93, h * 0.86],
    [r * 0.9, h - 0.003],
    [r * 0.9 - t, h - 0.003],
    [r * 0.93 - t, h * 0.84],
    [r * 0.99 - t, h * 0.46],
    [r * 0.94 - t, 0.016 + t],
    [0.0008, 0.014 + t],
  ].map(([x, y]) => new THREE.Vector2(x, y));
}

export class CarouselTable {
  public readonly group = new THREE.Group();

  private readonly spinner = new THREE.Group();
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly materials: THREE.Material[] = [];
  private readonly glazes = new Map<string, THREE.MeshStandardMaterial>();

  private readonly gold: THREE.MeshStandardMaterial;
  private readonly navy: THREE.MeshStandardMaterial;
  private readonly white: THREE.MeshStandardMaterial;
  private readonly counterTop: THREE.MeshPhysicalMaterial;

  constructor() {
    this.group.name = 'mesa-giratoria';
    this.group.position.set(
      CAROUSEL_TABLE_POSITION.x,
      CAROUSEL_TABLE_POSITION.y,
      CAROUSEL_TABLE_POSITION.z,
    );

    this.gold = this.standard({
      color: '#D9B44A',
      roughness: 0.22,
      metalness: 1,
      envMapIntensity: 1.35,
    });
    this.navy = this.standard({
      color: '#061A30',
      roughness: 0.72,
      metalness: 0.05,
    });
    this.white = this.standard({
      color: '#F7F9FB',
      roughness: 0.16,
      metalness: 0.03,
      envMapIntensity: 1,
    });
    this.counterTop = this.trackMaterial(
      new THREE.MeshPhysicalMaterial({
        color: '#0E2C4E',
        roughness: 0.16,
        metalness: 0.25,
        clearcoat: 0.7,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.2,
      }),
    );

    this.buildBase();
    this.buildSpinner();
    this.group.add(this.spinner);
  }

  update(deltaSeconds: number): boolean {
    this.spinner.rotation.y += deltaSeconds * SPIN_SPEED;
    return true;
  }

  dispose(): void {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.geometries.length = 0;
    this.materials.length = 0;
    this.glazes.clear();
  }

  private buildBase(): void {
    const base = this.mesh(
      this.group,
      this.cylinder(TABLE_RADIUS, TABLE_RADIUS * 1.05, 0.07, 36),
      this.navy,
    );
    base.position.y = 0.035;

    const stem = this.mesh(
      this.group,
      this.cylinder(0.09, 0.11, 0.72, 20),
      this.gold,
    );
    stem.position.y = 0.43;

    const stemRing = this.mesh(
      this.group,
      this.torus(0.16, 0.018, 18, 24),
      this.gold,
    );
    stemRing.position.y = 0.3;
    stemRing.rotation.x = Math.PI / 2;

    const top = this.mesh(
      this.group,
      this.cylinder(TABLE_RADIUS, TABLE_RADIUS, 0.06, 40),
      this.counterTop,
    );
    top.position.y = 0.83;

    const topRim = this.mesh(
      this.group,
      this.torus(TABLE_RADIUS, 0.014, 12, 48),
      this.gold,
    );
    topRim.position.y = 0.83;
    topRim.rotation.x = Math.PI / 2;
  }

  private buildSpinner(): void {
    this.spinner.position.y = 0.86;

    const plate = this.mesh(
      this.spinner,
      this.cylinder(TABLE_RADIUS - 0.06, TABLE_RADIUS - 0.06, PLATE_THICKNESS, 40),
      this.white,
    );
    plate.position.y = 0;

    const ringRadius = TABLE_RADIUS - 0.26;
    const saucer = this.saucer(0.085, 20);

    for (let index = 0; index < GLAZES.length; index += 1) {
      const glaze = GLAZES[index];
      const angle = (index / GLAZES.length) * Math.PI * 2;
      const cupGroup = new THREE.Group();
      cupGroup.position.set(Math.cos(angle) * ringRadius, CUP_SEAT_Y, Math.sin(angle) * ringRadius);
      cupGroup.rotation.y = -angle + Math.PI / 2;
      this.spinner.add(cupGroup);

      this.mesh(cupGroup, saucer, this.white);
      this.addMug(
        cupGroup,
        index % 2 === 0 ? 'jumbo' : 'classic',
        glaze.id,
        0.014,
        0,
        glaze.metalness > 0.5,
      );
    }

    const tower = new THREE.Group();
    tower.position.y = PLATE_TOP;
    this.spinner.add(tower);

    const towerGlazes: GlazeId[] = ['gold', 'navy', 'cream'];
    for (let index = 0; index < towerGlazes.length; index += 1) {
      this.addMug(tower, 'espresso', towerGlazes[index], index * 0.062, index * 0.7, index === 0);
    }
  }

  private addMug(
    parent: THREE.Group,
    modelId: keyof typeof MUG_MODELS,
    glazeId: GlazeId,
    y: number,
    rotationY: number,
    rim: boolean,
  ): void {
    const model = MUG_MODELS[modelId];
    const material = this.glaze(glazeId);
    const mug = new THREE.Group();
    mug.position.y = y;
    mug.rotation.y = rotationY;
    parent.add(mug);

    const body = this.trackGeometry(
      new THREE.LatheGeometry(mugProfile(model), 20),
    );
    body.computeVertexNormals();
    this.mesh(mug, body, material);

    const height = model.height;
    const handleRadius = model.handleR;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(model.radius * 0.97, height * 0.62, 0),
      new THREE.Vector3(model.radius + handleRadius * 0.85, height * 0.56, 0),
      new THREE.Vector3(model.radius + handleRadius * 1.02, height * 0.42, 0),
      new THREE.Vector3(model.radius + handleRadius * 0.7, height * 0.26, 0),
      new THREE.Vector3(model.radius * 0.96, height * 0.2, 0),
    ]);
    const handle = this.trackGeometry(
      new THREE.TubeGeometry(curve, 14, handleRadius * 0.36, 6, false),
    );
    this.mesh(mug, handle, material);

    if (rim) {
      const rimMesh = this.mesh(
        mug,
        this.torus(model.radius * 0.9, 0.0024, 20, 8),
        this.gold,
      );
      rimMesh.position.y = model.height - 0.004;
      rimMesh.rotation.x = Math.PI / 2;
    }
  }

  private saucer(radius: number, segments: number): THREE.BufferGeometry {
    return this.trackGeometry(
      new THREE.LatheGeometry(
        [
          [0.0008, 0],
          [radius * 0.4, 0],
          [radius, 0.008],
          [radius * 0.96, 0.014],
          [radius * 0.5, 0.011],
          [0.0008, 0.009],
        ].map(([x, y]) => new THREE.Vector2(x, y)),
        segments,
      ),
    );
  }

  private cylinder(
    radiusTop: number,
    radiusBottom: number,
    height: number,
    segments: number,
  ): THREE.CylinderGeometry {
    return this.trackGeometry(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments, 1, false),
    );
  }

  private torus(
    radius: number,
    tube: number,
    segments: number,
    radialSegments: number,
  ): THREE.TorusGeometry {
    return this.trackGeometry(
      new THREE.TorusGeometry(radius, tube, radialSegments, segments),
    );
  }

  private mesh(
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);
    return mesh;
  }

  private standard(parameters: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial {
    return this.trackMaterial(new THREE.MeshStandardMaterial(parameters));
  }

  private trackMaterial<T extends THREE.Material>(material: T): T {
    this.materials.push(material);
    return material;
  }

  private trackGeometry<T extends THREE.BufferGeometry>(geometry: T): T {
    this.geometries.push(geometry);
    return geometry;
  }

  private glaze(id: GlazeId): THREE.MeshStandardMaterial {
    const cached = this.glazes.get(id);
    if (cached) {
      return cached;
    }
    const glaze = GLAZES.find((candidate) => candidate.id === id) ?? GLAZES[0];
    const material = this.standard({
      color: glaze.color,
      roughness: glaze.roughness,
      metalness: glaze.metalness,
      envMapIntensity: 1.35,
    });
    this.glazes.set(id, material);
    return material;
  }
}
