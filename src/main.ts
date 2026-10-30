import * as THREE from 'three';
import { Camera } from './core/camera';
import { FreeCameraController } from './core/freeCameraController';
import { Renderer } from './core/renderer';
import {
  COMMERCIAL_VIEWS,
  type CommercialViewId,
} from './scene/store/commercialCamera';
import { CommercialViewPreferences } from './scene/store/commercialViewPreferences';
import { VIEWPOINTS } from './scene/store/constants';
import { CameraRig, type CameraRigSnapshot } from './scene/store/storeCamera';
import { StoreScene } from './scene/store/storeScene';
import {
  createCommercialViewEditor,
  type CommercialViewEditor,
} from './ui/commercialViewEditor';

/**
 * A/C Store 3D — escena con cámara de pie y mesa central giratoria. El render se mantiene
 * activo mientras la mesa gira y también ante arrastre, transición de cámara, cambio de
 * tamaño o vuelta a primer plano.
 */
const canvas = document.getElementById('scene') as HTMLCanvasElement;
const camera = new Camera();
const renderer = new Renderer(canvas);

let store: StoreScene;
try {
  store = new StoreScene({ renderer: renderer.renderer });
} catch (error) {
  console.error('No se pudo construir la tienda 3D:', error);
  showError('No se pudo construir la tienda 3D. Revisa la consola del navegador.');
  throw error;
}

const viewPreferences = new CommercialViewPreferences();
const initialViewpoints = VIEWPOINTS.map((viewpoint) => {
  const pose = viewPreferences.get(viewpoint.id);
  return pose
    ? { ...viewpoint, position: pose.position, target: pose.target }
    : viewpoint;
});

const rig = new CameraRig(camera.camera, canvas, initialViewpoints);
const freeCamera = new FreeCameraController(camera.camera);

const MAX_FRAME_DELTA = 0.1;
const FREE_CAMERA_EXIT_MS = 500;
let lastFrameTime = performance.now();

interface FreeCameraExitTransition {
  snapshot: CameraRigSnapshot;
  startedAt: number;
  fromPosition: THREE.Vector3;
  fromQuaternion: THREE.Quaternion;
  fromFov: number;
  toPosition: THREE.Vector3;
  toQuaternion: THREE.Quaternion;
  toFov: number;
}

let viewEditor: CommercialViewEditor;

const freeCameraMode = {
  active: false,
  savedSnapshot: null as CameraRigSnapshot | null,
  exitTransition: null as FreeCameraExitTransition | null,
  enter(): void {
    if (freeCameraMode.active) {
      return;
    }
    freeCameraMode.savedSnapshot = rig.snapshot();
    rig.setEnabled(false);
    freeCameraMode.active = true;
    lastFrameTime = performance.now();
    freeCamera.start(canvas);
    setFreeCameraUiVisible(true);
    showEditorForActiveView();
    requestRender();
  },
  exit(): void {
    if (!freeCameraMode.active || freeCameraMode.exitTransition) {
      return;
    }

    const snapshot = freeCameraMode.savedSnapshot;
    const fromPosition = camera.camera.position.clone();
    const fromQuaternion = camera.camera.quaternion.clone();
    const fromFov = camera.camera.fov;

    freeCamera.stop();
    freeCameraMode.savedSnapshot = null;
    viewEditor.hide();
    setFreeCameraUiVisible(false);

    if (!snapshot) {
      freeCameraMode.active = false;
      rig.setEnabled(true);
      requestRender();
      return;
    }

    freeCameraMode.exitTransition = {
      snapshot,
      startedAt: performance.now(),
      fromPosition,
      fromQuaternion,
      fromFov,
      toPosition: new THREE.Vector3(snapshot.pose.x, snapshot.pose.y, snapshot.pose.z),
      toQuaternion: new THREE.Quaternion().setFromEuler(
        new THREE.Euler(snapshot.pose.pitch, snapshot.pose.yaw, 0, 'YXZ'),
      ),
      toFov: snapshot.fov,
    };
    requestRender();
  },
};

function activeEditorViewId(): CommercialViewId {
  const match = COMMERCIAL_VIEWS.find((view) => view.id === rig.activeId);
  return match ? match.id : COMMERCIAL_VIEWS[0].id;
}

function syncReturnSnapshot(id: CommercialViewId): void {
  const snapshot = rig.snapshotForView(id);
  if (snapshot) {
    freeCameraMode.savedSnapshot = snapshot;
  }
}

function showEditorForActiveView(): void {
  const id = activeEditorViewId();
  const viewpoint = rig.getViewpoint(id);
  const targetDistance = viewpoint
    ? Math.hypot(
        viewpoint.target[0] - viewpoint.position[0],
        viewpoint.target[1] - viewpoint.position[1],
        viewpoint.target[2] - viewpoint.position[2],
      )
    : undefined;
  viewEditor.show(id, targetDistance);
}

let frameId = 0;
function requestRender(): void {
  if (frameId === 0) {
    frameId = requestAnimationFrame(frame);
  }
}

function frameDelta(now: number): number {
  const delta = (now - lastFrameTime) / 1000;
  lastFrameTime = now;
  if (!Number.isFinite(delta) || delta <= 0) {
    return 0;
  }
  return Math.min(delta, MAX_FRAME_DELTA);
}

function easeInOut(t: number): number {
  return t * t * (3 - 2 * t);
}

function updateFreeCameraExit(now: number): boolean {
  const transition = freeCameraMode.exitTransition;
  if (!transition) {
    return false;
  }

  const t = Math.min(1, Math.max(0, (now - transition.startedAt) / FREE_CAMERA_EXIT_MS));
  const k = easeInOut(t);
  camera.camera.position.lerpVectors(transition.fromPosition, transition.toPosition, k);
  camera.camera.quaternion.slerpQuaternions(transition.fromQuaternion, transition.toQuaternion, k);
  camera.camera.fov = transition.fromFov + (transition.toFov - transition.fromFov) * k;
  camera.camera.updateProjectionMatrix();

  if (t >= 1) {
    finishFreeCameraExit();
    return false;
  }
  return true;
}

function finishFreeCameraExit(): void {
  const transition = freeCameraMode.exitTransition;
  if (!transition) {
    return;
  }

  freeCameraMode.exitTransition = null;
  freeCameraMode.active = false;
  rig.restore(transition.snapshot);
  rig.setEnabled(true);
  requestRender();
}

function frame(now: number): void {
  frameId = 0;
  const delta = frameDelta(now);
  let moving: boolean;
  if (freeCameraMode.exitTransition) {
    moving = updateFreeCameraExit(now);
  } else if (freeCameraMode.active) {
    moving = freeCamera.update(delta);
  } else {
    moving = rig.update(now);
  }
  const carouselMoving = store.update(delta);
  renderer.renderer.render(store.scene, camera.camera);
  syncNav();
  if (moving || carouselMoving) {
    requestRender();
  }
}

rig.onChange = requestRender;
rig.onInteract = hideHint;

viewEditor = createCommercialViewEditor({
  camera: camera.camera,
  isCustomized: (id) => viewPreferences.has(id),
  onSelectView: (id) => {
    rig.setActiveView(id);
    syncReturnSnapshot(id);
  },
  onSavePose: (id, pose) => {
    if (!viewPreferences.save(id, pose)) {
      return false;
    }
    rig.setViewpointPose(id, pose);
    rig.setActiveView(id);
    syncReturnSnapshot(id);
    return true;
  },
  onRestorePose: (id) => {
    const original = VIEWPOINTS.find((viewpoint) => viewpoint.id === id);
    if (!original) {
      return { ok: false };
    }
    if (viewPreferences.has(id) && !viewPreferences.remove(id)) {
      return { ok: false };
    }

    const pose = {
      position: original.position,
      target: original.target,
    };
    rig.setViewpointPose(id, pose);
    rig.setActiveView(id);
    syncReturnSnapshot(id);
    return { ok: true, pose };
  },
  onCameraChanged: () => {
    if (freeCameraMode.active) {
      freeCamera.syncFromCamera();
    }
    viewEditor.update();
    requestRender();
  },
});

freeCamera.onChange = () => {
  viewEditor.update();
  requestRender();
};

const freeUi = document.getElementById('free-camera-ui') as HTMLDivElement;
const freeExit = document.getElementById('free-camera-exit') as HTMLButtonElement;
const joystick = document.getElementById('free-camera-joystick') as HTMLDivElement;
const joystickKnob = document.getElementById('free-camera-joystick-knob') as HTMLDivElement;
const heightUp = document.getElementById('free-camera-up') as HTMLButtonElement;
const heightDown = document.getElementById('free-camera-down') as HTMLButtonElement;

let joystickPointerId: number | null = null;
let heightPointerId: number | null = null;
let heightButton: HTMLButtonElement | null = null;

function setFreeCameraUiVisible(visible: boolean): void {
  if (!visible) {
    endJoystick();
    endHeightInput();
  }
  freeUi.hidden = !visible;
  document.body.classList.toggle('free-camera-mode', visible);
}

function endJoystick(pointerId?: number): void {
  const activePointer = joystickPointerId;
  if (activePointer === null || (pointerId !== undefined && pointerId !== activePointer)) {
    return;
  }
  joystickPointerId = null;
  if (joystick.hasPointerCapture(activePointer)) {
    joystick.releasePointerCapture(activePointer);
  }
  joystick.classList.remove('is-active');
  joystickKnob.style.transform = '';
  freeCamera.setJoystickInput(0, 0);
}

function endHeightInput(pointerId?: number): void {
  const activePointer = heightPointerId;
  if (activePointer === null || (pointerId !== undefined && pointerId !== activePointer)) {
    return;
  }
  const button = heightButton;
  heightPointerId = null;
  heightButton = null;
  if (button && button.hasPointerCapture(activePointer)) {
    button.releasePointerCapture(activePointer);
  }
  heightUp.classList.remove('is-pressed');
  heightDown.classList.remove('is-pressed');
  freeCamera.setHeightInput(0);
}

function updateJoystick(event: PointerEvent): void {
  const rect = joystick.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return;
  }
  const radius = Math.max(1, Math.min(rect.width, rect.height) / 2 - joystickKnob.offsetWidth / 2);
  const dx = event.clientX - (rect.left + rect.width / 2);
  const dy = event.clientY - (rect.top + rect.height / 2);
  const distance = Math.hypot(dx, dy);
  const scale = distance > radius ? radius / distance : 1;
  const x = dx * scale;
  const y = dy * scale;
  joystickKnob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  freeCamera.setJoystickInput(x / radius, -y / radius);
}

joystick.addEventListener('pointerdown', (event) => {
  if (
    !freeCameraMode.active ||
    joystickPointerId !== null ||
    (event.pointerType === 'mouse' && event.button !== 0)
  ) {
    return;
  }
  event.preventDefault();
  joystickPointerId = event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  joystick.classList.add('is-active');
  updateJoystick(event);
});

joystick.addEventListener('pointermove', (event) => {
  if (!freeCameraMode.active || event.pointerId !== joystickPointerId) {
    return;
  }
  event.preventDefault();
  updateJoystick(event);
});

const releaseJoystick = (event: PointerEvent): void => {
  endJoystick(event.pointerId);
};

joystick.addEventListener('pointerup', releaseJoystick);
joystick.addEventListener('pointercancel', releaseJoystick);
joystick.addEventListener('lostpointercapture', releaseJoystick);

function bindHeightButton(button: HTMLButtonElement, direction: 1 | -1): void {
  button.addEventListener('pointerdown', (event) => {
    if (
      !freeCameraMode.active ||
      heightPointerId !== null ||
      (event.pointerType === 'mouse' && event.button !== 0)
    ) {
      return;
    }
    event.preventDefault();
    heightPointerId = event.pointerId;
    heightButton = button;
    button.setPointerCapture(event.pointerId);
    button.classList.add('is-pressed');
    freeCamera.setHeightInput(direction);
  });

  const release = (event: PointerEvent): void => {
    if (event.pointerId !== heightPointerId) {
      return;
    }
    event.preventDefault();
    endHeightInput(event.pointerId);
  };

  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', (event) => {
    endHeightInput(event.pointerId);
  });
}

bindHeightButton(heightUp, 1);
bindHeightButton(heightDown, -1);

freeExit.addEventListener('click', (event) => {
  event.preventDefault();
  freeCameraMode.exit();
});

setFreeCameraUiVisible(false);

const monogram = document.querySelector('.brand-mark') as HTMLElement;
const TRIPLE_TAP_COUNT = 3;
const TRIPLE_TAP_WINDOW_MS = 800;
const TRIPLE_TAP_MAX_DISTANCE = 12;

let tapPointerId: number | null = null;
let tapStartX = 0;
let tapStartY = 0;
let tapStartTime = 0;
let tapMaxDistance = 0;
let tapCount = 0;
let tapSequenceStart = 0;
let tapSequenceLast = 0;

function isPointOnMonogram(x: number, y: number): boolean {
  const rect = monogram.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function resetTripleTap(): void {
  const pointerId = tapPointerId;
  tapPointerId = null;
  tapStartX = 0;
  tapStartY = 0;
  tapStartTime = 0;
  tapMaxDistance = 0;
  tapCount = 0;
  tapSequenceStart = 0;
  tapSequenceLast = 0;
  if (pointerId !== null && monogram.hasPointerCapture(pointerId)) {
    monogram.releasePointerCapture(pointerId);
  }
}

function expireTripleTap(now: number): void {
  if (
    tapCount > 0 &&
    (now - tapSequenceStart > TRIPLE_TAP_WINDOW_MS ||
      now - tapSequenceLast > TRIPLE_TAP_WINDOW_MS)
  ) {
    resetTripleTap();
  }
}

function recordTap(startedAt: number): void {
  const now = performance.now();
  expireTripleTap(now);

  if (tapCount === 0) {
    tapSequenceStart = startedAt;
  }
  tapSequenceLast = now;
  tapCount += 1;

  if (tapCount < TRIPLE_TAP_COUNT) {
    return;
  }

  const withinWindow = now - tapSequenceStart <= TRIPLE_TAP_WINDOW_MS;
  const canEnter = !freeCameraMode.active && !document.hidden;
  resetTripleTap();

  if (withinWindow && canEnter) {
    freeCameraMode.enter();
  }
}

function startMonogramTap(event: PointerEvent): void {
  if (tapPointerId !== null) {
    resetTripleTap();
    return;
  }
  if (freeCameraMode.active || document.hidden) {
    resetTripleTap();
    return;
  }
  if (!event.isPrimary || event.button !== 0) {
    resetTripleTap();
    return;
  }

  const now = performance.now();
  expireTripleTap(now);
  if (!isPointOnMonogram(event.clientX, event.clientY)) {
    resetTripleTap();
    return;
  }

  event.preventDefault();
  tapPointerId = event.pointerId;
  tapStartX = event.clientX;
  tapStartY = event.clientY;
  tapStartTime = now;
  tapMaxDistance = 0;
  monogram.setPointerCapture(event.pointerId);
}

function moveMonogramPointer(event: PointerEvent): void {
  if (event.pointerId !== tapPointerId) {
    return;
  }

  const distance = Math.hypot(event.clientX - tapStartX, event.clientY - tapStartY);
  if (distance > TRIPLE_TAP_MAX_DISTANCE) {
    event.preventDefault();
    resetTripleTap();
    return;
  }
  tapMaxDistance = Math.max(tapMaxDistance, distance);
}

function finishMonogramTap(event: PointerEvent): void {
  if (event.pointerId !== tapPointerId) {
    return;
  }

  const pointerId = tapPointerId;
  const startedAt = tapStartTime;
  const endDistance = Math.hypot(event.clientX - tapStartX, event.clientY - tapStartY);
  const valid =
    tapMaxDistance <= TRIPLE_TAP_MAX_DISTANCE &&
    endDistance <= TRIPLE_TAP_MAX_DISTANCE &&
    isPointOnMonogram(event.clientX, event.clientY);

  tapPointerId = null;
  tapStartTime = 0;
  if (monogram.hasPointerCapture(pointerId)) {
    monogram.releasePointerCapture(pointerId);
  }

  if (!valid) {
    resetTripleTap();
    return;
  }

  event.preventDefault();
  recordTap(startedAt);
}

function cancelMonogramTap(event: PointerEvent): void {
  if (event.pointerId === tapPointerId) {
    resetTripleTap();
  }
}

function resetTripleTapOnOutsidePointer(event: PointerEvent): void {
  if (event.target instanceof Node && monogram.contains(event.target)) {
    return;
  }
  resetTripleTap();
}

monogram.addEventListener('pointerdown', startMonogramTap);
monogram.addEventListener('pointermove', moveMonogramPointer);
monogram.addEventListener('pointerup', finishMonogramTap);
monogram.addEventListener('pointercancel', cancelMonogramTap);
document.addEventListener('pointerdown', resetTripleTapOnOutsidePointer, true);

window.addEventListener('resize', () => {
  camera.resize();
  rig.refreshFov();
  renderer.resize();
  requestRender();
});
canvas.addEventListener('webglcontextlost', (event) => event.preventDefault());
canvas.addEventListener('webglcontextrestored', requestRender);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    resetTripleTap();
    return;
  }
  lastFrameTime = performance.now();
  requestRender();
});

const nav = document.getElementById('views');
const buttons = new Map<string, HTMLButtonElement>();
if (nav) {
  for (const viewpoint of VIEWPOINTS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = viewpoint.label;
    button.addEventListener('click', () => {
      hideHint();
      rig.goTo(viewpoint.id);
    });
    nav.appendChild(button);
    buttons.set(viewpoint.id, button);
  }
}

function syncNav(): void {
  buttons.forEach((button, id) => {
    const active = rig.activeId === id;
    button.classList.toggle('active', active);
    button.setAttribute('aria-current', active ? 'true' : 'false');
  });
}

function hideHint(): void {
  document.getElementById('hint')?.classList.add('hidden');
}

function showError(message: string): void {
  const box = document.createElement('div');
  box.className = 'scene-error';
  box.textContent = message;
  document.body.appendChild(box);
}

requestRender();
