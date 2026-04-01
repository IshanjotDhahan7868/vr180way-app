"use client";

import type { ProjectionMode } from "@/lib/types";

interface ProjectionSelectorProps {
  projection: ProjectionMode;
  onChange: (p: ProjectionMode) => void;
}

export function ProjectionSelector({ projection, onChange }: ProjectionSelectorProps) {
  return (
    <div>
      <div className="mb-2.5 font-mono text-[10px] tracking-[3px] text-cyan opacity-70">
        PROJECTION
      </div>
      <div className="flex gap-1.5">
        <button
          className="cursor-pointer whitespace-nowrap rounded border px-2.5 py-1.5 font-mono text-[10px] tracking-[1px] transition-all hover:border-white/30 hover:text-txt"
          style={
            projection === "vr180"
              ? { borderColor: "#00ccff", background: "#00ccff18", color: "#00ccff" }
              : { borderColor: "rgba(0,200,255,0.15)", color: "#4a6070", background: "#0d1520" }
          }
          onClick={() => onChange("vr180")}
        >
          VR180
        </button>
        <button
          className="cursor-pointer whitespace-nowrap rounded border px-2.5 py-1.5 font-mono text-[10px] tracking-[1px] transition-all hover:border-white/30 hover:text-txt"
          style={
            projection === "vr360"
              ? { borderColor: "#aa88ff", background: "#aa88ff18", color: "#aa88ff" }
              : { borderColor: "rgba(0,200,255,0.15)", color: "#4a6070", background: "#0d1520" }
          }
          onClick={() => onChange("vr360")}
        >
          VR360
        </button>
      </div>
      <p className="mt-2 font-mono text-[10px] text-mut">
        {projection === "vr180"
          ? "180\u00B0 side-by-side — standard Google Cardboard format"
          : "360\u00B0 full sphere — look around in all directions"}
      </p>
    </div>
  );
}
