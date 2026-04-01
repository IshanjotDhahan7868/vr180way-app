import { BrowseClient } from "./browse-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VR Browser — View any website in VR",
  description: "Browse any website in split-screen VR mode with head-tilt scrolling",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

interface BrowsePageProps {
  searchParams: Promise<{ url?: string }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const url = params.url;

  return (
    <div className="relative mx-auto min-h-screen max-w-2xl px-5 pb-16">
      <header className="flex items-center gap-3 border-b border-bord pt-6 pb-4">
        <a href="/" className="text-sm text-txt3 hover:text-txt2 transition-colors">
          &larr; Back
        </a>
        <h1 className="text-base font-semibold text-txt">VR Browser</h1>
      </header>

      <BrowseClient initialUrl={url || ""} />
    </div>
  );
}
