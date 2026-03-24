"use client";

import { useRef, useState } from "react";
import { PanoramaSelector } from "./components/PanoramaSelector";
import { useInverseSphereViewer } from "./hooks/useInverseSphereViewer";
import { PANORAMAS } from "./panoramas";

export default function InverseSphereScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInverseSphereViewer({
    mountRef,
    panoramaSrc: PANORAMAS[selectedIndex].src,
  });

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950">
      <PanoramaSelector
        panoramas={PANORAMAS}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
      />

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-md bg-black/40 px-3 py-2 text-sm text-white">
        Drag to look around • Scroll to zoom
      </div>

      <div ref={mountRef} className="h-screen w-screen" />
    </main>
  );
}