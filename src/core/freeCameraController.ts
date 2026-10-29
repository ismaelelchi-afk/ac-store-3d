import * as THREE from 'three';
import { STORE } from '../scene/store/constants';

export interface FreeCameraOptions {
  speed: number;
  verticalSpeed: number;
  lookSensitivity: number;
  pitchLimit: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minHeight: number;
  maxHeight: number;
}

const BOUND_MARGIN = 0.25;
const MAX_DELTA = 0.1;

const DEFAULT_OPTIONS: FreeCameraOptions = {
  speed: 2.4,
  verticalSpeed: 1.4,
  lookSensitivity: 1,
  pitchLimit: 1.35,
  minX: -STORE.halfW + BOUND_MARGIN,
  maxX: STORE.halfW - BOUND_MARGIN,
  minZ: -STORE.halfD + BOUND_MARGIN,
  maxZ: STORE.halfD - BOUND_MARGIN,
  minHeight: 0.35,
  maxHeight: STORE.height - 0.2,
};

const MOVEMENT_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);

function clampInput(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return THREE.MathUtils.clamp(value, -1, 1);
}

export class FreeCameraController {
  public onChange: () => void = () => {};

  private readonly options: FreeCameraOptions;
  private readonly position = new THREE.Vector3();
  private readonly keys = new Set<string>();
  private readonly cleanups: (() => void)[] = [];
  private active = false;
  private target: HTMLElement | null = null;
  private savedTouchAction = '';
  private yaw = 0;
  private pitch = 0;
  private joystickStrafe = 0;
  private joystickForward = 0;
  private heightInput = 0;
  private dragging = false;
  private pointerId: number | null = null;
  private lastX = 0;
  private lastY = 0;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    options: Partial<FreeCameraOptions> = {},
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.camera.rotation.order = 'YXZ';
  }

  public start(target: HTMLElement = document.body): void {
    if (this.active) {
      if (this.target === target) {
        return;
      }
      this.stop();
    }

    this.syncFromCamera();
    this.active = true;
    this.target = target;
    this.savedTouchAction = target.style.touchAction;
    target.style.touchAction = 'none';
    this.bind(target);
    this.onChange();
  }

  public stop(): void {
    if (!this.active) {
      return;
    }

    this.active = false;
    this.endDrag();
    this.keys.clear();
    this.joystickStrafe = 0;
    this.joystickForward = 0;
    this.heightInput = 0;

    const target = this.target;
    if (target) {
      target.style.touchAction = this.savedTouchAction;
    }
    this.target = null;
    this.savedTouchAction = '';
    this.cleanups.forEach((cleanup) => cleanup());
    this.cleanups.length = 0;
  }

  public dispose(): void {
    this.stop();
  }

  public setJoystickInput(strafe: number, forward: number): void {
    const nextStrafe = clampInput(strafe);
    const nextForward = clampInput(forward);
    if (nextStrafe === this.joystickStrafe && nextForward === this.joystickForward) {
      return;
    }
    this.joystickStrafe = nextStrafe;
    this.joystickForward = nextForward;
    if (this.active) {
      this.onChange();
    }
  }

  public setHeightInput(direction: number): void {
    const next = clampInput(direction);
    if (next === this.heightInput) {
      return;
    }
    this.heightInput = next;
    if (this.active) {
      this.onChange();
    }
  }

  public update(deltaSeconds: number): boolean {
    if (!this.active) {
      return false;
    }

    const delta = Number.isFinite(deltaSeconds)
      ? THREE.MathUtils.clamp(deltaSeconds, 0, MAX_DELTA)
      : 0;
    if (delta <= 0) {
      return false;
    }

    let strafe =
      (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) -
      (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0) +
      this.joystickStrafe;
    let forward =
      (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) -
      (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) +
      this.joystickForward;

    const magnitude = Math.hypot(strafe, forward);
    if (magnitude > 1) {
      strafe /= magnitude;
      forward /= magnitude;
    }

    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const step = this.options.speed * delta;
    const heightStep = this.heightInput * this.options.verticalSpeed * delta;

    const previousX = this.position.x;
    const previousY = this.position.y;
    const previousZ = this.position.z;

    this.position.x = THREE.MathUtils.clamp(
      this.position.x + (cos * strafe - sin * forward) * step,
      this.options.minX,
      this.options.maxX,
    );
    this.position.z = THREE.MathUtils.clamp(
      this.position.z + (-sin * strafe - cos * forward) * step,
      this.options.minZ,
      this.options.maxZ,
    );
    this.position.y = THREE.MathUtils.clamp(
      this.position.y + heightStep,
      this.options.minHeight,
      this.options.maxHeight,
    );

    if (
      this.position.x === previousX &&
      this.position.y === previousY &&
      this.position.z === previousZ
    ) {
      return false;
    }

    this.applyPose();
    this.onChange();
    return true;
  }

  /** Sincroniza el estado interno con la cámara tras una edición externa de la pose. */
  public syncFromCamera(): void {
    this.position.copy(this.camera.position);
    this.yaw = this.camera.rotation.y;
    this.pitch = THREE.MathUtils.clamp(
      this.camera.rotation.x,
      -this.options.pitchLimit,
      this.options.pitchLimit,
    );
  }

  private applyPose(): void {
    this.camera.position.copy(this.position);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  private endDrag(): void {
    const target = this.target;
    if (target && this.pointerId !== null && target.hasPointerCapture(this.pointerId)) {
      target.releasePointerCapture(this.pointerId);
    }
    this.pointerId = null;
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
  }

  private bind(target: HTMLElement): void {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!this.active || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (!MOVEMENT_KEYS.has(event.code)) {
        return;
      }
      event.preventDefault();
      if (event.repeat) {
        return;
      }
      this.keys.add(event.code);
      this.onChange();
    };

    const onKeyUp = (event: KeyboardEvent): void => {
      if (!this.active || !MOVEMENT_KEYS.has(event.code)) {
        return;
      }
      event.preventDefault();
      this.keys.delete(event.code);
    };

    const clearKeys = (): void => {
      this.keys.clear();
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (
        !this.active ||
        this.dragging ||
        (event.pointerType === 'mouse' && event.button !== 0)
      ) {
        return;
      }
      this.dragging = true;
      this.pointerId = event.pointerId;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      target.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (
        !this.active ||
        !this.dragging ||
        this.pointerId === null ||
        event.pointerId !== this.pointerId
      ) {
        return;
      }

      const dx = event.clientX - this.lastX;
      const dy = event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      if (dx === 0 && dy === 0) {
        return;
      }

      event.preventDefault();
      const viewportHeight = target.clientHeight > 0 ? target.clientHeight : window.innerHeight;
      const radiansPerPixel =
        (THREE.MathUtils.degToRad(this.camera.fov) / Math.max(1, viewportHeight)) *
        this.options.lookSensitivity;

      this.yaw -= dx * radiansPerPixel;
      this.pitch = THREE.MathUtils.clamp(
        this.pitch - dy * radiansPerPixel,
        -this.options.pitchLimit,
        this.options.pitchLimit,
      );
      this.applyPose();
      this.onChange();
    };

    const onPointerUp = (event: PointerEvent): void => {
      if (event.pointerId !== this.pointerId) {
        return;
      }
      this.endDrag();
    };

    const onLostPointerCapture = (event: PointerEvent): void => {
      if (event.pointerId !== this.pointerId) {
        return;
      }
      this.pointerId = null;
      this.dragging = false;
    };

    const onWheel = (event: WheelEvent): void => {
      if (!this.active) {
        return;
      }
      event.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearKeys);
    target.addEventListener('pointerdown', onPointerDown);
    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', onPointerUp);
    target.addEventListener('pointercancel', onPointerUp);
    target.addEventListener('lostpointercapture', onLostPointerCapture);
    target.addEventListener('wheel', onWheel, { passive: false });

    this.cleanups.push(
      () => window.removeEventListener('keydown', onKeyDown),
      () => window.removeEventListener('keyup', onKeyUp),
      () => window.removeEventListener('blur', clearKeys),
      () => target.removeEventListener('pointerdown', onPointerDown),
      () => target.removeEventListener('pointermove', onPointerMove),
      () => target.removeEventListener('pointerup', onPointerUp),
      () => target.removeEventListener('pointercancel', onPointerUp),
      () => target.removeEventListener('lostpointercapture', onLostPointerCapture),
      () => target.removeEventListener('wheel', onWheel),
    );
  }
}
