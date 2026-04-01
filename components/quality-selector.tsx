"use client";

import type { QualityPreset, OutputResolution } from "@/lib/types";

interface QualitySelectorProps {
  quality: QualityPreset;
  resolution: OutputResolution;
  onQualityChange: (q: QualityPreset) => void;
  onResolutionChange: (r: OutputResolution) => void;
}

export function QualitySelector({
  quality,
  resolution,
  onQualityChange,
  onResolutionChange,
}: QualitySelectorProps) {
  return (
    <div className="rounded-2xl border border-bord bg-surf p-5">
      <h3 className="mb-4 text-sm font-medium text-txt">Output settings</h3>

      <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
        <div>
          <label className="mb-2 block text-xs font-medium text-txt2">Quality</label>
          <div className="flex gap-1.5">
            {([
              { key: "fast" as const, label: "Fast" },
              { key: "balanced" as const, label: "Balanced" },
              { key: "high" as const, label: "High" },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onQualityChange(key)}
                className={`flex-1 cursor-pointer rounded-lg border px-2.5 py-2 text-xs font-medium transition-all ${
                  quality === key
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-bord bg-surf2 text-txt3 hover:text-txt2"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-txt2">Resolution</label>
          <div className="flex gap-1.5">
            {([
              { key: "720p" as const, label: "720p" },
              { key: "1080p" as const, label: "1080p" },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onResolutionChange(key)}
                className={`flex-1 cursor-pointer rounded-lg border px-2.5 py-2 text-xs font-medium transition-all ${
                  resolution === key
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-bord bg-surf2 text-txt3 hover:text-txt2"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
