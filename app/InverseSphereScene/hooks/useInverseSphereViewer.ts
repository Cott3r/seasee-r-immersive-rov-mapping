"use client";

import { useEffect, type RefObject } from "react";
import * as THREE from "three";
import { createEquirectangularMaterial, createPerspectiveMaterial } from "../materials/panoramaMaterials";
import type { ProjectionMode } from "../types";
import { parseXmpFromJpeg } from "../xmp/parseXmpFromJpeg";

type UseInverseSphereViewerArgs = {
  mountRef: RefObject<HTMLDivElement | null>;
  panoramaSrc: string;
  projectionMode: ProjectionMode;
};

export function useInverseSphereViewer({
  mountRef,
  panoramaSrc,
  projectionMode,
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
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(20, 64, 64);
    const material =
      projectionMode === "perspective"
        ? createPerspectiveMaterial()
        : createEquirectangularMaterial();

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const textureLoader = new THREE.TextureLoader();
    let currentTexture: THREE.Texture | null = null;
    let destroyed = false;

    const applyTexture = async (src: string) => {
      try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const xmp = parseXmpFromJpeg(arrayBuffer);

        const blob = new Blob([arrayBuffer]);
        const objectUrl = URL.createObjectURL(blob);

        const texture = textureLoader.load(
          objectUrl,
          () => {
            if (destroyed) {
              URL.revokeObjectURL(objectUrl);
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
            console.error(`Failed to load panorama texture: ${src}`);
            URL.revokeObjectURL(objectUrl);
          }
        );

        texture.colorSpace = THREE.SRGBColorSpace;
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

    const onPointerDown = (event: PointerEvent) => {
      state.isDragging = true;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!state.isDragging) return;

      const deltaX = event.clientX - state.lastX;
      const deltaY = event.clientY - state.lastY;

      state.yaw -= deltaX * 0.005;
      state.pitch -= deltaY * 0.005;
      state.pitch = THREE.MathUtils.clamp(
        state.pitch,
        -Math.PI / 2 + 0.05,
        Math.PI / 2 - 0.05
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
      camera.fov = THREE.MathUtils.clamp(camera.fov + event.deltaY * 0.02, 40, 90);
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
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    let animationFrame = 0;
    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      destroyed = true;
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);

      geometry.dispose();
      material.dispose();
      if (currentTexture) currentTexture.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [mountRef, panoramaSrc, projectionMode]);
}
