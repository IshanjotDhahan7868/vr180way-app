"use client";

import type { SourceType } from "@/lib/types";

interface SourceSelectorProps {
  source: SourceType;
  onChange: (s: SourceType) => void;
}

export function SourceSelector({ source, onChange }: SourceSelectorProps) {
  return (
    <div className="flex gap-1 rounded-xl bg-surf p-1">
      {([
        { key: "file" as const, label: "Upload file" },
        { key: "youtube" as const, label: "YouTube link" },
      ]).map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex-1 cursor-pointer rounded-lg border-none px-4 py-2.5 text-sm font-medium transition-all ${
            source === key
              ? "bg-accent-soft text-accent shadow-sm"
              : "bg-transparent text-txt3 hover:text-txt2"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
