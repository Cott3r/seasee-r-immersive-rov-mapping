"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Home() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(3, 5, 2);
    scene.add(directionalLight);

    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    scene.add(cube);

    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 1,
      metalness: 0,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    scene.add(floor);

    const resize = () => {
      if (!mount) return;
      const width = mount.clientWidth;
      const height = mount.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", resize);

    let animationFrame = 0;
    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate);

      cube.rotation.x += 0.01;
      cube.rotation.y += 0.015;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);

      cubeGeometry.dispose();
      cubeMaterial.dispose();
      floorGeometry.dispose();
      floorMaterial.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <main className="h-screen w-screen overflow-hidden bg-slate-950">
      <div ref={mountRef} className="h-[calc(100vh-16px)] w-full" />
    </main>
  );
}
