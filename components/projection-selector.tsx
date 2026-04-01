"use client";

import type { ProjectionMode } from "@/lib/types";

interface ProjectionSelectorProps {
  projection: ProjectionMode;
  onChange: (p: ProjectionMode) => void;
}

export function ProjectionSelector({ projection, onChange }: ProjectionSelectorProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-txt2">Field of view</label>
      <div className="flex gap-2">
        {([
          { key: "vr180" as const, label: "180\u00B0", desc: "Standard Cardboard" },
          { key: "vr360" as const, label: "360\u00B0", desc: "Look all around" },
        ]).map(({ key, label, desc }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-left transition-all ${
              projection === key
                ? "border-accent bg-accent-soft text-txt"
                : "border-bord bg-surf text-txt3 hover:border-white/15 hover:text-txt2"
            }`}
          >
            <div className="text-sm font-medium">{label}</div>
            <div className="mt-0.5 text-xs opacity-70">{desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
