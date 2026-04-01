"use client";

import { useState, useCallback } from "react";
import { PARAM_LIMITS, PRESETS } from "@/lib/constants";
import type { TransformParams } from "@/lib/types";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  fmt?: (v: number) => string;
  color?: string;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  fmt,
  color = "#00ccff",
}: SliderProps) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState("");
  const pct = ((value - min) / (max - min)) * 100;
  const display = fmt ? fmt(value) : `${Math.round(value * 100)}%`;

  const commitEdit = useCallback(() => {
    const parsed = parseFloat(editVal);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    }
    setEditing(false);
  }, [editVal, min, max, onChange]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[1px] text-mut">
          {label}
        </span>
        {editing ? (
          <input
            type="number"
            className="w-16 rounded border border-bord bg-bg px-1.5 py-0.5 font-mono text-[11px] text-txt outline-none"
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => e.key === "Enter" && commitEdit()}
            autoFocus
            step={step}
            min={min}
            max={max}
          />
        ) : (
          <button
            className="cursor-pointer border-none bg-transparent font-mono text-[11px] font-bold"
            style={{ color }}
            onClick={() => {
              setEditVal(String(value));
              setEditing(true);
            }}
            title="Tap to type exact value"
          >
            {display}
          </button>
        )}
      </div>
      <div className="relative flex h-[18px] items-center">
        <div className="pointer-events-none absolute inset-x-0 h-1 overflow-visible rounded-sm bg-white/[0.07]">
          <div
            className="h-full rounded-sm transition-[width] duration-[40ms]"
            style={{ width: `${pct}%`, background: color }}
          />
          {min < 0 && (
            <div className="absolute left-1/2 top-[-3px] h-2.5 w-px -translate-x-1/2 bg-white/25" />
          )}
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-x-0 m-0 h-[18px] w-full cursor-pointer opacity-0"
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

  const reset = () =>
    onChange({
      ...params,
      zoom: 1,
      stretchH: 1,
      stretchV: 1,
      cropX: 0,
      cropY: 0,
    });

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

  // Pan controls are only useful when content overflows
  const overflowsH =
    params.zoom * params.stretchH > 1.01;
  const overflowsV =
    params.zoom * params.stretchV > 1.01;

  return (
    <div className="flex flex-col gap-3.5 rounded-lg border border-bord bg-surf p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[3px] text-cyan opacity-70">
          TRANSFORM CONTROLS
        </span>
        <button
          onClick={reset}
          className="cursor-pointer rounded border border-bord bg-transparent px-2.5 py-1 font-mono text-[11px] text-mut transition-colors hover:border-white/30 hover:text-txt"
        >
          &#8634; Reset all
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <Slider
          label="Zoom"
          value={params.zoom}
          {...PARAM_LIMITS.zoom}
          onChange={(v) => set("zoom", v)}
          fmt={(v) => `${Math.round(v * 100)}%`}
          color="#ffcc00"
        />
        <Slider
          label="Horizontal Stretch"
          value={params.stretchH}
          {...PARAM_LIMITS.stretchH}
          onChange={(v) => set("stretchH", v)}
          color="#00ccff"
        />
        <Slider
          label="Vertical Stretch"
          value={params.stretchV}
          {...PARAM_LIMITS.stretchV}
          onChange={(v) => set("stretchV", v)}
          color="#aa88ff"
        />
        <Slider
          label={`Pan Left / Right${!overflowsH ? " (zoom to enable)" : ""}`}
          value={params.cropX}
          {...PARAM_LIMITS.cropX}
          onChange={(v) => set("cropX", v)}
          fmt={(v) =>
            v === 0
              ? "center"
              : v > 0
                ? `right ${Math.round(v * 100)}%`
                : `left ${Math.round(-v * 100)}%`
          }
          color={overflowsH ? "#00ffb3" : "#4a6070"}
        />
        <Slider
          label={`Pan Up / Down${!overflowsV ? " (zoom to enable)" : ""}`}
          value={params.cropY}
          {...PARAM_LIMITS.cropY}
          onChange={(v) => set("cropY", v)}
          fmt={(v) =>
            v === 0
              ? "center"
              : v > 0
                ? `down ${Math.round(v * 100)}%`
                : `up ${Math.round(-v * 100)}%`
          }
          color={overflowsV ? "#ff88aa" : "#4a6070"}
        />
      </div>

      {/* Presets */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-bord pt-2.5">
        <span className="mr-0.5 font-mono text-[9px] tracking-[2px] text-mut">
          PRESETS
        </span>
        {PRESETS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => applyPreset(key)}
            className="cursor-pointer whitespace-nowrap rounded border border-cyan/25 bg-cyan/[0.07] px-2 py-1 font-mono text-[10px] text-cyan transition-colors hover:border-cyan hover:bg-cyan/15"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
