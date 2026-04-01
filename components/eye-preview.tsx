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

export function EyePreview({ warpMode, orientation, stretchH, stretchV, cropX, cropY, zoom }: EyePreviewProps) {
  const srcRatio = orientation === "landscape" ? 16 / 9 : 9 / 16;
  let fitW: number, fitH: number;
  if (srcRatio > EYE_W / EYE_H) { fitW = EYE_W; fitH = EYE_W / srcRatio; }
  else { fitH = EYE_H; fitW = EYE_H * srcRatio; }

  const strW = fitW * zoom * stretchH;
  const strH = fitH * zoom * stretchV;
  const overflowX = Math.max(0, strW - EYE_W);
  const overflowY = Math.max(0, strH - EYE_H);
  const panX = (overflowX / 2) * cropX;
  const panY = (overflowY / 2) * cropY;
  const contentLeft = (EYE_W - strW) / 2 - panX;
  const contentTop = (EYE_H - strH) / 2 - panY;
  const coversFull = strW >= EYE_W - 0.5 && strH >= EYE_H - 0.5;

  return (
    <div className="rounded-2xl border border-bord bg-surf p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-txt2">Preview</span>
        <span className={`text-xs ${coversFull ? "text-green" : "text-amber"}`}>
          {coversFull ? "Full frame" : "Has black bars"}
        </span>
      </div>

      <div
        className="relative mx-auto flex justify-center gap-px overflow-hidden rounded-lg bg-black"
        style={{ height: EYE_H + 2 }}
      >
        {[0, 1].map((eye) => (
          <div key={eye} className="relative shrink-0 overflow-hidden" style={{ width: EYE_W, height: EYE_H }}>
            <div className="absolute inset-0 bg-zinc-950" />
            <div
              className="absolute overflow-hidden rounded-sm border border-white/10"
              style={{
                width: strW, height: strH,
                left: contentLeft, top: contentTop,
                background: "rgba(99, 102, 241, 0.08)",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
                  backgroundSize: "20% 20%",
                }}
              />
              {warpMode === "stretch" && (
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {[20,40,60,80].map(x => <path key={x} d={`M${x} 0 Q${x+4} 50 ${x} 100`} stroke="rgba(99,102,241,0.2)" strokeWidth="0.8" fill="none"/>)}
                  {[25,50,75].map(y => <path key={y} d={`M0 ${y} Q50 ${y+3} 100 ${y}`} stroke="rgba(99,102,241,0.2)" strokeWidth="0.8" fill="none"/>)}
                </svg>
              )}
            </div>
            <div className="pointer-events-none absolute inset-0 border border-white/5 rounded-sm" />
            <span className="absolute left-1.5 top-1 text-[9px] font-medium text-white/20">
              {eye === 0 ? "L" : "R"}
            </span>
          </div>
        ))}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/10" />
      </div>

      <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] text-txt3">
        <span>Zoom <b className="text-txt2">{Math.round(zoom * 100)}%</b></span>
        <span>H <b className="text-txt2">{stretchH.toFixed(2)}</b></span>
        <span>V <b className="text-txt2">{stretchV.toFixed(2)}</b></span>
      </div>
    </div>
  );
}
