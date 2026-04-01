"use client";

import type { WarpMode } from "@/lib/types";

interface ModeSelectorProps {
  warpMode: WarpMode;
  onWarpModeChange: (mode: WarpMode) => void;
}

export function ModeSelector({ warpMode, onWarpModeChange }: ModeSelectorProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-txt2">Style</label>
      <div className="flex gap-2">
        {([
          { key: "stretch" as const, label: "Immersive", desc: "Warps video to fill your view" },
          { key: "pad" as const, label: "Flat screen", desc: "Sharp center, no distortion" },
        ]).map(({ key, label, desc }) => (
          <button
            key={key}
            onClick={() => onWarpModeChange(key)}
            className={`flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-left transition-all ${
              warpMode === key
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
