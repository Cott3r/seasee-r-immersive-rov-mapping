"use client";

import { useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PanoramaSelector } from "./components/PanoramaSelector";
import { useInverseSphereViewer } from "./hooks/useInverseSphereViewer";
import type { PanoramaItem } from "./types";

interface InverseSphereSceneProps {
  panoramas: PanoramaItem[];
}

export default function InverseSphereScene({ panoramas }: InverseSphereSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const panoramaParam = searchParams.get("panorama");
  
  // Initialize with URL parameter if provided, otherwise default to 0
  const selectedIndex = panoramaParam !== null
    ? Math.max(0, Math.min(parseInt(panoramaParam, 10) || 0, panoramas.length - 1))
    : 0;

  const handlePanoramaSelect = (index: number) => {
    // Update URL with new panorama parameter
    const params = new URLSearchParams(searchParams.toString());
    params.set("panorama", index.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  useInverseSphereViewer({
    mountRef,
    panoramaSrc: panoramas[selectedIndex]?.src || "",
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