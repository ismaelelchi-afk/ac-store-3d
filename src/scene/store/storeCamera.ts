import * as THREE from 'three';
import { VIEWPOINTS, type Viewpoint } from './constants';

/** Campo de visión vertical base: 70° en horizontal; hasta 100° en vertical (teléfono). */
function baseFov(aspect: number): number {
  const base = 70;
  return aspect >= 1.4 ? base : Math.min(100, base + (1.4 - aspect) * 45);
}

function fovForAspect(aspect: number, zoom = 1): number {
  return THREE.MathUtils.clamp(baseFov(aspect) * zoom, 35, 110);
}

/** Ajusta el FOV a la pantalla; `zoom` < 1 acerca, > 1 aleja. */
export function updateStoreFov(camera: THREE.PerspectiveCamera, zoom = 1): void {
  camera.fov = fovForAspect(camera.aspect, zoom);
  camera.updateProjectionMatrix();
}

/** Pose visible de la cámara con la misma convención interna que CameraRig. */
export interface CameraRigPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
}

/** Estado completo y restaurable de CameraRig. */
export interface CameraRigSnapshot {
  pose: CameraRigPose;
  /** Factor de zoom actual aplicado sobre el FOV base. */
  zoom: number;
  /** FOV vertical real de la cámara, en grados. */
  fov: number;
  activeId: string | null;
}

const PITCH_LIMIT = 1.0;
const TRANSITION_MS = 900;

function poseOf(viewpoint: Viewpoint): CameraRigPose {
  const [px, py, pz] = viewpoint.position;
  const [tx, ty, tz] = viewpoint.target;
  const dx = tx - px;
  const dy = ty - py;
  const dz = tz - pz;
  return {
    x: px,
    y: py,
    z: pz,
    yaw: Math.atan2(-dx, -dz),
    pitch: Math.atan2(dy, Math.hypot(dx, dz)),
  };
}

function cloneViewpoint(viewpoint: Viewpoint): Viewpoint {
  return {
    id: viewpoint.id,
    label: viewpoint.label,
    position: [viewpoint.position[0], viewpoint.position[1], viewpoint.position[2]],
    target: [viewpoint.target[0], viewpoint.target[1], viewpoint.target[2]],
  };
}

const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Cámara de pie con mirada libre: se arrastra para girar (ratón o dedo), la rueda hace zoom y
 * los botones saltan con una transición suave a puntos de vista fijos. No hay desplazamiento
 * libre, así que no necesita colisiones.
 *
 * La escena es estática: el rig avisa con `onChange` cuando hay que volver a dibujar y
 * `update()` devuelve `true` mientras dura una transición.
 */
export class CameraRig {
  public onChange: () => void = () => {};
  public onInteract: () => void = () => {};
  /** Id del punto de vista activo (o `null` si el usuario movió la cámara a mano). */
  public activeId: string | null = null;

  private enabled = true;
  private pose: CameraRigPose;
  private zoom = 1;
  private tween: { from: CameraRigPose; to: CameraRigPose; start: number } | null = null;
  private dragging = false;
  private pointerId: number | null = null;
  private lastX = 0;
  private lastY = 0;
  private readonly viewpoints: Viewpoint[];
  private readonly cleanups: (() => void)[] = [];

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly canvas: HTMLCanvasElement,
    viewpoints: readonly Viewpoint[] = VIEWPOINTS,
  ) {
    this.viewpoints = viewpoints.map(cloneViewpoint);
    const first = this.viewpoints[0] as Viewpoint;
    this.pose = poseOf(first);
    this.activeId = first.id;
    this.apply();
    this.bind();
  }

  /**
   * Habilita o suspende los controles. Al suspender se cancela la transición pendiente sin
   * alterar la pose visible; no se reaplica ninguna pose al reactivar.
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.tween = null;
      this.endDrag();
    }
  }

  /**
   * Captura la pose realmente visible, incluso a mitad de una transición. La fuente de verdad
   * es la cámara, no el destino del tween.
   */
  public snapshot(): CameraRigSnapshot {
    return {
      pose: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z,
        yaw: this.camera.rotation.y,
        pitch: this.camera.rotation.x,
      },
      zoom: this.zoom,
      fov: this.camera.fov,
      activeId: this.activeId,
    };
  }

  public getViewpoint(id: string): Viewpoint | undefined {
    const viewpoint = this.viewpoints.find((candidate) => candidate.id === id);
    return viewpoint ? cloneViewpoint(viewpoint) : undefined;
  }

  /** Marca una vista como activa sin mover la cámara. */
  public setActiveView(id: string): void {
    if (this.viewpoints.some((viewpoint) => viewpoint.id === id)) {
      this.activeId = id;
    }
  }

  /** Actualiza la pose efectiva de una vista sin tocar las demás ni mover la cámara. */
  public setViewpointPose(
    id: string,
    pose: { position: readonly [number, number, number]; target: readonly [number, number, number] },
  ): void {
    const viewpoint = this.viewpoints.find((candidate) => candidate.id === id);
    if (!viewpoint) {
      return;
    }

    viewpoint.position = [pose.position[0], pose.position[1], pose.position[2]];
    viewpoint.target = [pose.target[0], pose.target[1], pose.target[2]];
  }

  /** Captura la pose efectiva de una vista para volver a ella al salir del modo libre. */
  public snapshotForView(id: string): CameraRigSnapshot | null {
    const viewpoint = this.viewpoints.find((candidate) => candidate.id === id);
    if (!viewpoint) {
      return null;
    }

    return {
      pose: poseOf(viewpoint),
      zoom: this.zoom,
      fov: fovForAspect(this.camera.aspect, this.zoom),
      activeId: id,
    };
  }

  /**
   * Restaura una captura sin animación y sincroniza la pose interna con la cámara.
   * No modifica el estado habilitado/suspendido: si la cámara se movió durante la suspensión,
   * debe llamarse antes de `setEnabled(true)`.
   */
  public restore(snapshot: CameraRigSnapshot): void {
    this.pose = { ...snapshot.pose };
    this.zoom = snapshot.zoom;
    this.activeId = snapshot.activeId;
    this.tween = null;
    this.endDrag();
    this.applyPose();
    this.camera.fov = THREE.MathUtils.clamp(snapshot.fov, 35, 110);
    this.camera.updateProjectionMatrix();
    this.onChange();
  }

  /** Salta con transición al punto de vista `id`. */
  goTo(id: string): void {
    if (!this.enabled) {
      return;
    }
    const target = this.viewpoints.find((viewpoint) => viewpoint.id === id);
    if (!target) {
      return;
    }
    const to = poseOf(target);
    // Giro por el camino más corto.
    let delta = to.yaw - this.pose.yaw;
    delta = ((((delta + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
    to.yaw = this.pose.yaw + delta;
    this.tween = { from: { ...this.pose }, to, start: performance.now() };
    this.activeId = id;
    this.onChange();
  }

  /** Avanza la transición. Devuelve `true` si aún queda movimiento por dibujar. */
  update(now: number): boolean {
    if (!this.enabled || !this.tween) {
      return false;
    }
    const t = Math.min(1, (now - this.tween.start) / TRANSITION_MS);
    const k = easeInOut(t);
    const { from, to } = this.tween;
    this.pose = {
      x: from.x + (to.x - from.x) * k,
      y: from.y + (to.y - from.y) * k,
      z: from.z + (to.z - from.z) * k,
      yaw: from.yaw + (to.yaw - from.yaw) * k,
      pitch: from.pitch + (to.pitch - from.pitch) * k,
    };
    this.apply();
    if (t >= 1) {
      this.tween = null;
      return false;
    }
    return true;
  }

  /** Reaplica el FOV (al redimensionar) manteniendo el zoom del usuario. */
  refreshFov(): void {
    if (!this.enabled) {
      return;
    }
    updateStoreFov(this.camera, this.zoom);
  }

  dispose(): void {
    this.cleanups.forEach((cleanup) => cleanup());
    this.cleanups.length = 0;
  }

  private applyPose(): void {
    this.camera.position.set(this.pose.x, this.pose.y, this.pose.z);
    this.camera.rotation.set(this.pose.pitch, this.pose.yaw, 0, 'YXZ');
  }

  private apply(): void {
    this.applyPose();
    updateStoreFov(this.camera, this.zoom);
  }

  private manual(change: () => void): void {
    if (!this.enabled) {
      return;
    }
    this.tween = null;
    this.activeId = null;
    change();
    this.pose.pitch = THREE.MathUtils.clamp(this.pose.pitch, -PITCH_LIMIT, PITCH_LIMIT);
    this.apply();
    this.onInteract();
    this.onChange();
  }

  private endDrag(): void {
    if (this.pointerId !== null && this.canvas.hasPointerCapture(this.pointerId)) {
      this.canvas.releasePointerCapture(this.pointerId);
    }
    this.pointerId = null;
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
  }

  private listen<K extends keyof HTMLElementEventMap>(
    target: HTMLElement | Window,
    type: K | string,
    handler: (event: never) => void,
    options?: AddEventListenerOptions,
  ): void {
    target.addEventListener(type, handler as EventListener, options);
    this.cleanups.push(() => target.removeEventListener(type, handler as EventListener, options));
  }

  private bind(): void {
    const { canvas } = this;
    canvas.style.touchAction = 'none';

    this.listen(canvas, 'pointerdown', (event: PointerEvent) => {
      if (!this.enabled) {
        return;
      }
      this.dragging = true;
      this.pointerId = event.pointerId;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    });
    this.listen(canvas, 'pointermove', (event: PointerEvent) => {
      if (!this.enabled || !this.dragging) {
        return;
      }
      const radPerPx = THREE.MathUtils.degToRad(this.camera.fov) / Math.max(1, canvas.clientHeight);
      const dx = event.clientX - this.lastX;
      const dy = event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.manual(() => {
        this.pose.yaw += dx * radPerPx;
        this.pose.pitch += dy * radPerPx;
      });
    });
    const stop = (event: PointerEvent): void => {
      if (!this.enabled) {
        return;
      }
      if (event.pointerId === this.pointerId) {
        this.pointerId = null;
      }
      this.dragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };
    this.listen(canvas, 'pointerup', stop);
    this.listen(canvas, 'pointercancel', stop);
    this.listen(
      canvas,
      'wheel',
      (event: WheelEvent) => {
        if (!this.enabled) {
          return;
        }
        event.preventDefault();
        this.manual(() => {
          this.zoom = THREE.MathUtils.clamp(this.zoom * (event.deltaY > 0 ? 1.06 : 0.94), 0.5, 1.15);
        });
      },
      { passive: false },
    );
    this.listen(window, 'keydown', (event: KeyboardEvent) => {
      if (!this.enabled) {
        return;
      }
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < this.viewpoints.length) {
        this.goTo((this.viewpoints[index] as Viewpoint).id);
        return;
      }
      const step = 0.08;
      const turn: Record<string, [number, number]> = {
        ArrowLeft: [step, 0],
        ArrowRight: [-step, 0],
        ArrowUp: [0, step],
        ArrowDown: [0, -step],
      };
      const delta = turn[event.key];
      if (delta) {
        event.preventDefault();
        this.manual(() => {
          this.pose.yaw += delta[0];
          this.pose.pitch += delta[1];
        });
      }
    });
  }
}
