"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PanoramaSelector } from "./components/panorama-selector";
import { useInverseSphereViewer } from "./hooks/use-inverse-sphere-viewer";
import {Panorama} from "@/utils/panorama-file-scanner";

interface InverseSphereSceneProps {
  panoramas: Panorama[];
}

export default function InverseSphereScene({ panoramas }: InverseSphereSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const panoramaParam = searchParams.get("panorama");
  const yawParam = searchParams.get("yaw");
  const pitchParam = searchParams.get("pitch");
  const fovParam = searchParams.get("fov");

  const parseNumberParam = (value: string | null, fallback: number) => {
    if (value === null) return fallback;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  
  // Initialize with URL parameter if provided, otherwise default to 0
  const selectedIndex = panoramaParam !== null
    ? Math.max(0, Math.min(parseInt(panoramaParam, 10) || 0, panoramas.length - 1))
    : 0;
  const initialYaw = parseNumberParam(yawParam, 0);
  const initialPitch = Math.max(
    -Math.PI / 2.0,
    Math.min(Math.PI / 2.0, parseNumberParam(pitchParam, 0))
  );
  const initialFov = Math.max(1, Math.min(100, parseNumberParam(fovParam, 75)));
  const currentViewRef = useRef({ yaw: initialYaw, pitch: initialPitch, fov: initialFov });

  useEffect(() => {
    currentViewRef.current = { yaw: initialYaw, pitch: initialPitch, fov: initialFov };
  }, [initialYaw, initialPitch, initialFov]);

  const onViewChange = useCallback((view: { yaw: number; pitch: number; fov: number }) => {
    currentViewRef.current = view;
  }, []);

  const formatParam = (value: number) => value.toFixed(6);

  const handlePanoramaSelect = (index: number) => {
    // Update URL with new panorama parameter
    const params = new URLSearchParams(searchParams.toString());
    params.set("panorama", index.toString());
    params.set("yaw", formatParam(currentViewRef.current.yaw));
    params.set("pitch", formatParam(currentViewRef.current.pitch));
    params.set("fov", formatParam(currentViewRef.current.fov));
    router.push(`?${params.toString()}`, { scroll: false });
  };

  useInverseSphereViewer({
    mountRef,
    panoramaSrc: panoramas[selectedIndex]?.src || "",
    initialYaw,
    initialPitch,
    initialFov,
    onViewChange,
  });

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950">
      <PanoramaSelector
        panoramas={panoramas}
        selectedIndex={selectedIndex}
        onSelect={handlePanoramaSelect}
      />

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-md bg-black/40 px-3 py-2 text-sm text-white">
        Drag to look around • Scroll to zoom
      </div>

      <div ref={mountRef} className="h-screen w-screen" />
    </main>
  );
}
