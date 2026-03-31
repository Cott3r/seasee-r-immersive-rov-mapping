import * as THREE from "three";

declare global {
  interface Window {
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    cameraState?: {
      yaw: number;
      pitch: number;
      isDragging: boolean;
      lastX: number;
      lastY: number;
    };
    updateCameraRotation?: () => void;
  }
}

export {};