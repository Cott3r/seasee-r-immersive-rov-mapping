import type { ProjectionMode } from "../types";

type ProjectionToggleProps = {
  value: ProjectionMode;
  onChange: (mode: ProjectionMode) => void;
};

export function ProjectionToggle({ value, onChange }: ProjectionToggleProps) {
  return (
    <div className="absolute left-4 top-20 z-10 rounded-md bg-black/40 p-3 text-sm text-white">
      <label className="mb-2 block font-medium">Projection</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange("perspective")}
          className={`rounded px-3 py-1 transition ${
            value === "perspective"
              ? "bg-white text-black"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          Perspective
        </button>
        <button
          type="button"
          onClick={() => onChange("rectilinear")}
          className={`rounded px-3 py-1 transition ${
            value === "rectilinear"
              ? "bg-white text-black"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          Rectilinear
        </button>
      </div>
    </div>
  );
}
