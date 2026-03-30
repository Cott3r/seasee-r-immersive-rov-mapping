import type { PanoramaItem } from "../types";

type PanoramaSelectorProps = {
  panoramas: PanoramaItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export function PanoramaSelector({
  panoramas,
  selectedIndex,
  onSelect,
}: PanoramaSelectorProps) {
  return (
    <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2 rounded-md bg-black/40 p-2 text-sm text-white">
      {panoramas.map((panorama, index) => (
        <button
          key={panorama.src}
          type="button"
          onClick={() => onSelect(index)}
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
  );
}
