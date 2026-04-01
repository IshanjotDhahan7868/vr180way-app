"use client";

import { EYE_W, EYE_H } from "@/lib/constants";
import type { WarpMode } from "@/lib/types";

interface EyePreviewProps {
  warpMode: WarpMode;
  orientation: string;
  stretchH: number;
  stretchV: number;
  cropX: number;
  cropY: number;
  zoom: number;
}

export function EyePreview({
  warpMode,
  orientation,
  stretchH,
  stretchV,
  cropX,
  cropY,
  zoom,
}: EyePreviewProps) {
  const srcRatio = orientation === "landscape" ? 16 / 9 : 9 / 16;

  // Scale to FIT (full video visible, letterbox/pillarbox)
  let fitW: number, fitH: number;
  if (srcRatio > EYE_W / EYE_H) {
    fitW = EYE_W;
    fitH = EYE_W / srcRatio;
  } else {
    fitH = EYE_H;
    fitW = EYE_H * srcRatio;
  }

  // Zoom + stretch
  const strW = fitW * zoom * stretchH;
  const strH = fitH * zoom * stretchV;

  // Pan offsets
  const overflowX = Math.max(0, strW - EYE_W);
  const overflowY = Math.max(0, strH - EYE_H);
  const panX = (overflowX / 2) * cropX;
  const panY = (overflowY / 2) * cropY;

  const contentLeft = (EYE_W - strW) / 2 - panX;
  const contentTop = (EYE_H - strH) / 2 - panY;
  const coversFull = strW >= EYE_W - 0.5 && strH >= EYE_H - 0.5;

  const accent = warpMode === "stretch" ? "#00ccff" : "#00ffb3";

  return (
    <div className="rounded-lg border border-bord bg-surf p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <span
          className="font-mono text-[10px] tracking-[2px] opacity-70"
          style={{ color: accent }}
        >
          LIVE EYE FRAME PREVIEW
        </span>
        <span
          className="font-mono text-[11px]"
          style={{ color: coversFull ? "#00ffb3" : "#ffaa00" }}
        >
          {coversFull ? "\u2713 Full fill" : "\u26A0 Black bars"}
        </span>
      </div>

      {/* SBS eyes */}
      <div
        className="relative mx-auto flex justify-center gap-0.5 overflow-hidden rounded border border-white/5 bg-[#020508]"
        style={{ height: EYE_H + 2 }}
      >
        {[0, 1].map((eye) => (
          <div
            key={eye}
            className="relative shrink-0 overflow-hidden"
            style={{ width: EYE_W, height: EYE_H }}
          >
            <div className="absolute inset-0 bg-[#020508]" />
            <div
              className="absolute overflow-hidden border"
              style={{
                width: strW,
                height: strH,
                left: contentLeft,
                top: contentTop,
                background: `${accent}20`,
                borderColor: `${accent}50`,
              }}
            >
              {/* Grid texture */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `linear-gradient(${accent}18 1px, transparent 1px), linear-gradient(90deg, ${accent}18 1px, transparent 1px)`,
                  backgroundSize: "20% 20%",
                }}
              />
              {/* Warp lines for stretch mode */}
              {warpMode === "stretch" && (
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {[20, 40, 60, 80].map((x) => (
                    <path
                      key={x}
                      d={`M${x} 0 Q${x + 4} 50 ${x} 100`}
                      stroke={`${accent}40`}
                      strokeWidth="0.8"
                      fill="none"
                    />
                  ))}
                  {[25, 50, 75].map((y) => (
                    <path
                      key={y}
                      d={`M0 ${y} Q50 ${y + 3} 100 ${y}`}
                      stroke={`${accent}40`}
                      strokeWidth="0.8"
                      fill="none"
                    />
                  ))}
                </svg>
              )}
            </div>
            {/* Eye outline + label */}
            <div
              className="pointer-events-none absolute inset-0 border"
              style={{ borderColor: `${accent}60` }}
            />
            <span className="absolute left-1.5 top-1 font-mono text-[8px] tracking-[1px] text-white/25">
              {eye === 0 ? "L" : "R"}
            </span>
          </div>
        ))}
        {/* Center divider */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/12" />
      </div>

      {/* Stats row */}
      <div className="mt-2 flex flex-wrap gap-3.5">
        {[
          ["zoom", `${Math.round(zoom * 100)}%`],
          ["H\u00D7", stretchH.toFixed(2)],
          ["V\u00D7", stretchV.toFixed(2)],
          ["src", orientation === "landscape" ? "16:9" : "9:16"],
          ["mode", warpMode],
        ].map(([label, val]) => (
          <span key={label} className="font-mono text-[10px] text-mut">
            {label} <b className="text-txt">{val}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
