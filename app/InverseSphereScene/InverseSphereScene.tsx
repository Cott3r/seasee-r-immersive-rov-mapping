"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const PANORAMAS = [
  {
    label: "Room 1",
    src: "/panoramas/360_degree_panorama_-_Shinjuku_busta_and_Shinjuku_station_south_Dec16_2020.jpeg",
  },
  {
    label: "Room 2",
    src: "/panoramas/360_panorama_-_JR_Shinjuku_Station_south_east_ticket_gates_-_Dec_16_2020.jpeg",
  },
  {
    label: "Room 3",
    src: "/panoramas/Dartmoor_Forest_-_Church_of_St_Michael,_Princetown_-_20170705154700.jpg",
  },
];

export default function InverseSphereScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

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

    const sphereGeometry = new THREE.SphereGeometry(20, 64, 64);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.BackSide,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);

    const textureLoader = new THREE.TextureLoader();
    let currentTexture: THREE.Texture | null = null;

    const applyTexture = (src: string) => {
      const texture = textureLoader.load(
        src,
        () => {
          sphereMaterial.map = texture;
          sphereMaterial.needsUpdate = true;
        },
        undefined,
        () => {
          console.error(`Failed to load panorama texture: ${src}`);
        }
      );

      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;

      if (currentTexture) currentTexture.dispose();
      currentTexture = texture;
    };

    applyTexture(PANORAMAS[selectedIndex].src);

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
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);

      sphereGeometry.dispose();
      sphereMaterial.dispose();
      if (currentTexture) currentTexture.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [selectedIndex]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950">
      <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2 rounded-md bg-black/40 p-2 text-sm text-white">
        {PANORAMAS.map((panorama, index) => (
          <button
            key={panorama.src}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className={`rounded px-3 py-1 transition ${
              index === selectedIndex
                ? "bg-white text-black"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {panorama.label}
          </button>
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-md bg-black/40 px-3 py-2 text-sm text-white">
        Drag to look around • Scroll to zoom
      </div>

      <div ref={mountRef} className="h-screen w-screen" />
    </main>
  );
}