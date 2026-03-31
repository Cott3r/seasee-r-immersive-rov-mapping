"use client";

import { useEffect, type RefObject } from "react";
import * as THREE from "three";
import { createEquirectangularMaterial } from "../materials/equirectangular-material";
import { parseXmpFromJpeg } from "@/utils/parse-xmp-from-jpeg";

type UseInverseSphereViewerArgs = {
  mountRef: RefObject<HTMLDivElement | null>;
  panoramaSrc: string;
};

export function useInverseSphereViewer({
  mountRef,
  panoramaSrc,
}: UseInverseSphereViewerArgs) {
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050816);

    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    const baseFov = camera.fov;
    const basePointerSensitivity = 0.005;
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(20, 64, 64);
    const material = createEquirectangularMaterial();

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const textureLoader = new THREE.TextureLoader();
    let currentTexture: THREE.Texture | null = null;
    let destroyed = false;
    const pendingObjectUrls = new Set<string>();

    const applyTexture = async (src: string) => {
      try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const xmp = parseXmpFromJpeg(arrayBuffer);

        const blob = new Blob([arrayBuffer]);
        const objectUrl = URL.createObjectURL(blob);
        
        // Track the ObjectURL for cleanup
        pendingObjectUrls.add(objectUrl);

        const texture = textureLoader.load(
          objectUrl,
          () => {
            // Remove from pending set
            pendingObjectUrls.delete(objectUrl);
            
            if (destroyed) {
              URL.revokeObjectURL(objectUrl);
              texture.dispose();
              return;
            }

            material.uniforms.map.value = texture;
            if (xmp) {
              material.uniforms.fullWidth.value = xmp.fullWidth;
              material.uniforms.fullHeight.value = xmp.fullHeight;
              material.uniforms.cropWidth.value = xmp.cropWidth;
              material.uniforms.cropHeight.value = xmp.cropHeight;
              material.uniforms.cropLeft.value = xmp.cropLeft;
              material.uniforms.cropTop.value = xmp.cropTop;
            }
            material.needsUpdate = true;
            URL.revokeObjectURL(objectUrl);
          },
          undefined,
          () => {
            // Remove from pending set and cleanup
            pendingObjectUrls.delete(objectUrl);
            console.error(`Failed to load panorama texture: ${src}`);
            URL.revokeObjectURL(objectUrl);
            texture.dispose();
          }
        );

        texture.colorSpace = THREE.LinearSRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.flipY = true;

        if (currentTexture) currentTexture.dispose();
        currentTexture = texture;
      } catch (error) {
        console.error(`Failed to read panorama or XMP metadata: ${src}`, error);
      }
    };

    applyTexture(panoramaSrc);

    const state = {
      yaw: 0,
      pitch: 0,
      isDragging: false,
      lastX: 0,
      lastY: 0,
    };

    const updateCameraRotation = () => {
      const euler = new THREE.Euler(state.pitch, state.yaw, 0, "YXZ");
      camera.quaternion.setFromEuler(euler);
    };

    updateCameraRotation();

    // Expose to window for testing purposes
    if (typeof window !== "undefined" && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')) {
      (window as Window).camera = camera;
      (window as Window).renderer = renderer;
      (window as Window).scene = scene;
      (window as Window).cameraState = state;
      (window as Window).updateCameraRotation = updateCameraRotation;
    }

    const onPointerDown = (event: PointerEvent) => {
      state.isDragging = true;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!state.isDragging) return;

      const deltaX = event.clientX - state.lastX;
      const deltaY = event.clientY - state.lastY;
      const pointerSensitivity =
        basePointerSensitivity * (camera.fov / baseFov);

      state.yaw -= deltaX * pointerSensitivity;
      state.pitch -= deltaY * pointerSensitivity;
      state.pitch = THREE.MathUtils.clamp(
        state.pitch,
        -Math.PI / 2.0,
        Math.PI / 2.0
      );

      state.lastX = event.clientX;
      state.lastY = event.clientY;

      updateCameraRotation();
    };

    const onPointerUp = () => {
      state.isDragging = false;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.fov = THREE.MathUtils.clamp(camera.fov + event.deltaY * 0.02, 1, 100);
      camera.updateProjectionMatrix();
    };

    const resize = () => {
      if (!mount) return;
      const width = mount.clientWidth;
      const height = mount.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("wheel", onWheel, { passive: false });

    let animationFrame = 0;
    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      destroyed = true;
      
      // Revoke any pending ObjectURLs to prevent memory leaks
      pendingObjectUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
      pendingObjectUrls.clear();
      
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("wheel", onWheel);

      geometry.dispose();
      material.dispose();
      if (currentTexture) currentTexture.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [mountRef, panoramaSrc]);
}
