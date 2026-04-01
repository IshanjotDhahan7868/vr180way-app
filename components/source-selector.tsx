"use client";

import type { SourceType } from "@/lib/types";

interface SourceSelectorProps {
  source: SourceType;
  onChange: (s: SourceType) => void;
}

export function SourceSelector({ source, onChange }: SourceSelectorProps) {
  return (
    <div className="flex rounded-lg border border-bord overflow-hidden">
      <button
        className="flex-1 px-4 py-2.5 font-mono text-[11px] tracking-[1px] transition-colors cursor-pointer border-none"
        style={
          source === "file"
            ? { background: "#00ccff18", color: "#00ccff" }
            : { background: "#0d1520", color: "#4a6070" }
        }
        onClick={() => onChange("file")}
      >
        Upload File
      </button>
      <button
        className="flex-1 px-4 py-2.5 font-mono text-[11px] tracking-[1px] transition-colors cursor-pointer border-none border-l border-l-bord"
        style={
          source === "youtube"
            ? { background: "#ff444618", color: "#ff4466" }
            : { background: "#0d1520", color: "#4a6070" }
        }
        onClick={() => onChange("youtube")}
      >
        YouTube URL
      </button>
    </div>
  );
}
