"use client";

import dynamic from "next/dynamic";

const VRPlayer = dynamic(
  () => import("@/components/vr-player").then((m) => m.VRPlayer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="animate-spin-slow font-mono text-2xl text-cyan">
          {"\u27F3"}
        </span>
      </div>
    ),
  }
);

interface WatchClientProps {
  url: string;
  projection: "vr180" | "vr360";
  type: "video" | "image";
}

export function WatchClient({ url, projection, type }: WatchClientProps) {
  return <VRPlayer url={url} projection={projection} type={type} />;
}
