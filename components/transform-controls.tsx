"use client";

import { useState, useCallback } from "react";
import { PARAM_LIMITS, PRESETS } from "@/lib/constants";
import type { TransformParams } from "@/lib/types";

function Slider({ label, value, min, max, step, onChange, fmt }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; fmt?: (v: number) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState("");
  const pct = ((value - min) / (max - min)) * 100;
  const display = fmt ? fmt(value) : `${Math.round(value * 100)}%`;

  const commitEdit = useCallback(() => {
    const parsed = parseFloat(editVal);
    if (!isNaN(parsed)) onChange(Math.max(min, Math.min(max, parsed)));
    setEditing(false);
  }, [editVal, min, max, onChange]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-txt2">{label}</span>
        {editing ? (
          <input
            type="number"
            className="w-16 rounded border border-bord bg-bg px-1.5 py-0.5 text-right text-xs text-txt outline-none"
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => e.key === "Enter" && commitEdit()}
            autoFocus step={step} min={min} max={max}
          />
        ) : (
          <button
            className="cursor-pointer border-none bg-transparent font-mono text-xs font-medium text-accent"
            onClick={() => { setEditVal(String(value)); setEditing(true); }}
            title="Tap to edit"
          >
            {display}
          </button>
        )}
      </div>
      <div className="relative flex h-5 items-center">
        <div className="pointer-events-none absolute inset-x-0 h-1 rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-accent/60 transition-[width] duration-[40ms]" style={{ width: `${pct}%` }} />
          {min < 0 && <div className="absolute left-1/2 top-[-2px] h-2 w-px -translate-x-1/2 bg-white/20" />}
        </div>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-x-0 m-0 h-5 w-full opacity-0"
        />
      </div>
    </div>
  );
}

interface TransformControlsProps {
  params: TransformParams;
  onChange: (params: TransformParams) => void;
}

export function TransformControls({ params, onChange }: TransformControlsProps) {
  const set = (key: keyof TransformParams, value: number | string) =>
    onChange({ ...params, [key]: value });

  const reset = () => onChange({ ...params, zoom: 1, stretchH: 1, stretchV: 1, cropX: 0, cropY: 0 });

  const applyPreset = (key: string) => {
    const base = { ...params, zoom: 1, stretchH: 1, stretchV: 1, cropX: 0, cropY: 0 };
    switch (key) {
      case "zoom15": base.zoom = 1.5; break;
      case "zoom2": base.zoom = 2.0; break;
      case "widen": base.stretchH = 1.4; break;
      case "tall": base.stretchV = 1.4; break;
      case "square": base.stretchH = 1.33; break;
    }
    onChange(base);
  };

  return (
    <div className="rounded-2xl border border-bord bg-surf p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-txt">Adjustments</h3>
        <button onClick={reset} className="cursor-pointer rounded-lg border border-bord bg-transparent px-3 py-1 text-xs text-txt3 transition hover:text-txt2">
          Reset
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <Slider label="Zoom" value={params.zoom} {...PARAM_LIMITS.zoom} onChange={(v) => set("zoom", v)} fmt={(v) => `${Math.round(v * 100)}%`} />
        <Slider label="Horizontal stretch" value={params.stretchH} {...PARAM_LIMITS.stretchH} onChange={(v) => set("stretchH", v)} />
        <Slider label="Vertical stretch" value={params.stretchV} {...PARAM_LIMITS.stretchV} onChange={(v) => set("stretchV", v)} />
        <Slider label="Pan left/right" value={params.cropX} {...PARAM_LIMITS.cropX} onChange={(v) => set("cropX", v)}
          fmt={(v) => v === 0 ? "center" : v > 0 ? `right ${Math.round(v * 100)}%` : `left ${Math.round(-v * 100)}%`} />
        <Slider label="Pan up/down" value={params.cropY} {...PARAM_LIMITS.cropY} onChange={(v) => set("cropY", v)}
          fmt={(v) => v === 0 ? "center" : v > 0 ? `down ${Math.round(v * 100)}%` : `up ${Math.round(-v * 100)}%`} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-bord pt-3">
        <span className="mr-1 text-xs text-txt3">Quick:</span>
        {PRESETS.map(({ key, label }) => (
          <button key={key} onClick={() => applyPreset(key)}
            className="cursor-pointer rounded-lg border border-bord bg-surf2 px-2.5 py-1 text-xs text-txt3 transition hover:text-txt2">
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
