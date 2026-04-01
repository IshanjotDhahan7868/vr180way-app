"use client";

import { useState } from "react";
import { VRBrowser } from "@/components/vr-browser";

interface BrowseClientProps {
  initialUrl: string;
}

export function BrowseClient({ initialUrl }: BrowseClientProps) {
  const [url, setUrl] = useState(initialUrl);
  const [activeUrl, setActiveUrl] = useState(initialUrl || "");
  const [loading, setLoading] = useState(!!initialUrl);

  const handleGo = () => {
    let target = url.trim();
    if (!target) return;
    if (!/^https?:\/\//i.test(target)) target = "https://" + target;
    setActiveUrl(target);
    setLoading(true);
    // Update URL bar without full navigation
    window.history.replaceState(null, "", `/browse?url=${encodeURIComponent(target)}`);
  };

  return (
    <div>
      {/* URL bar */}
      <div className="mt-6 flex gap-2">
        <input
          type="url"
          placeholder="Enter a website URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGo()}
          className="flex-1 rounded-xl border border-bord bg-surf px-4 py-3 text-sm text-txt outline-none placeholder:text-txt3 focus:border-accent"
        />
        <button
          onClick={handleGo}
          disabled={!url.trim()}
          className="cursor-pointer rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Go
        </button>
      </div>

      {/* Browser */}
      {activeUrl && (
        <VRBrowser key={activeUrl} url={activeUrl} />
      )}

      {!activeUrl && (
        <div className="mt-12 text-center">
          <p className="text-sm text-txt3">
            Enter any website URL above to view it in VR split-screen mode.
          </p>
          <p className="mt-2 text-xs text-txt3">
            Head-tilt scrolling lets you browse hands-free while your phone is in a Cardboard headset.
          </p>
        </div>
      )}
    </div>
  );
}
