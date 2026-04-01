"use client";

import type { QualityPreset, OutputResolution } from "@/lib/types";

interface QualitySelectorProps {
  quality: QualityPreset;
  resolution: OutputResolution;
  onQualityChange: (q: QualityPreset) => void;
  onResolutionChange: (r: OutputResolution) => void;
}

const QUALITY_INFO: Record<QualityPreset, { label: string; desc: string; color: string }> = {
  fast: { label: "Fast", desc: "Quick conversion, smaller file", color: "#00ffb3" },
  balanced: { label: "Balanced", desc: "Good quality, reasonable speed", color: "#00ccff" },
  high: { label: "High", desc: "Best quality, slower conversion", color: "#ffcc00" },
};

export function QualitySelector({
  quality,
  resolution,
  onQualityChange,
  onResolutionChange,
}: QualitySelectorProps) {
  return (
    <div className="rounded-lg border border-bord bg-surf p-4">
      <div className="mb-3 font-mono text-[10px] tracking-[3px] text-cyan opacity-70">
        OUTPUT SETTINGS
      </div>

      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        {/* Quality */}
        <div>
          <div className="mb-1.5 font-mono text-[9px] tracking-[2px] text-mut">
            QUALITY
          </div>
          <div className="flex gap-1.5">
            {(["fast", "balanced", "high"] as const).map((q) => {
              const info = QUALITY_INFO[q];
              const active = quality === q;
              return (
                <button
                  key={q}
                  className="flex-1 cursor-pointer rounded border px-2 py-1.5 font-mono text-[10px] tracking-[1px] transition-all hover:border-white/30"
                  style={
                    active
                      ? { borderColor: info.color, background: info.color + "18", color: info.color }
                      : { borderColor: "rgba(0,200,255,0.15)", color: "#4a6070", background: "transparent" }
                  }
                  onClick={() => onQualityChange(q)}
                >
                  {info.label}
                </button>
              );
            })}
          </div>
          <p className="mt-1 font-mono text-[9px] text-mut">
            {QUALITY_INFO[quality].desc}
          </p>
        </div>

        {/* Resolution */}
        <div>
          <div className="mb-1.5 font-mono text-[9px] tracking-[2px] text-mut">
            RESOLUTION (per eye)
          </div>
          <div className="flex gap-1.5">
            {(["720p", "1080p"] as const).map((r) => {
              const active = resolution === r;
              const color = r === "1080p" ? "#ffcc00" : "#00ccff";
              return (
                <button
                  key={r}
                  className="flex-1 cursor-pointer rounded border px-2 py-1.5 font-mono text-[10px] tracking-[1px] transition-all hover:border-white/30"
                  style={
                    active
                      ? { borderColor: color, background: color + "18", color }
                      : { borderColor: "rgba(0,200,255,0.15)", color: "#4a6070", background: "transparent" }
                  }
                  onClick={() => onResolutionChange(r)}
                >
                  {r}
                </button>
              );
            })}
          </div>
          <p className="mt-1 font-mono text-[9px] text-mut">
            {resolution === "1080p" ? "1920x1080 per eye — sharper, larger file" : "1280x720 per eye — faster, uses less memory"}
          </p>
        </div>
      </div>
    </div>
  );
}
