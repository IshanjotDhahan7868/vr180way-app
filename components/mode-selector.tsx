"use client";

import type { WarpMode } from "@/lib/types";

interface ModeSelectorProps {
  warpMode: WarpMode;
  onWarpModeChange: (mode: WarpMode) => void;
}

function Chip({
  label,
  active,
  onClick,
  color = "#00ccff",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      className="cursor-pointer whitespace-nowrap rounded border px-2.5 py-1.5 font-mono text-[10px] tracking-[1px] transition-all hover:border-white/30 hover:text-txt"
      style={
        active
          ? { borderColor: color, background: color + "18", color }
          : { borderColor: "rgba(0,200,255,0.15)", color: "#4a6070", background: "#0d1520" }
      }
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function ModeSelector({
  warpMode,
  onWarpModeChange,
}: ModeSelectorProps) {
  return (
    <div>
      <div className="mb-2.5 font-mono text-[10px] tracking-[3px] text-cyan opacity-70">
        PROJECTION MODE
      </div>
      <div className="flex gap-1.5">
        <Chip
          label="&#8857; WARP"
          active={warpMode === "stretch"}
          onClick={() => onWarpModeChange("stretch")}
          color="#00ccff"
        />
        <Chip
          label="&#11035; FILL"
          active={warpMode === "pad"}
          onClick={() => onWarpModeChange("pad")}
          color="#00ffb3"
        />
      </div>
      <p className="mt-2 font-mono text-[10px] text-mut">
        {warpMode === "stretch"
          ? "Warp: applies equirectangular projection for immersive 180\u00B0 FOV"
          : "Fill: keeps center sharp with black borders, no distortion"}
      </p>
    </div>
  );
}
