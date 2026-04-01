import { WatchClient } from "@/components/watch-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watch in VR — VR180 Converter",
  description: "Watch your converted VR video in Google Cardboard",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

interface WatchPageProps {
  searchParams: Promise<{
    url?: string;
    projection?: string;
    type?: string;
  }>;
}

export default async function WatchPage({ searchParams }: WatchPageProps) {
  const params = await searchParams;
  const url = params.url;
  const projection = params.projection === "vr360" ? "vr360" : "vr180";
  const type = params.type === "image" ? "image" : "video";

  if (!url) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <span className="font-mono text-lg text-red">No video URL provided</span>
        <a href="/" className="font-mono text-sm text-cyan hover:underline">
          Go back to converter
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 px-4 py-3">
        <a href="/" className="font-mono text-[11px] text-cyan hover:underline">
          &larr; Back to converter
        </a>
        <span className="rounded bg-purp/20 px-2 py-0.5 font-mono text-[10px] tracking-[2px] text-purp">
          {projection.toUpperCase()} {type.toUpperCase()}
        </span>
      </div>

      <WatchClient url={url} projection={projection} type={type} />
    </div>
  );
}
