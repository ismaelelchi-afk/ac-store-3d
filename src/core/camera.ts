import * as THREE from 'three';

/** Cámara base de la aplicación; la pose real la gobierna `CameraRig`. */
export class Camera {
  public camera: THREE.PerspectiveCamera;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 100);
    this.camera.rotation.order = 'YXZ';
  }

  resize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}
