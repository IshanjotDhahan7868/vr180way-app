"use client";

import { useState, useEffect, useCallback } from "react";

interface VRBrowserProps {
  url: string;
}

export function VRBrowser({ url }: VRBrowserProps) {
  const [vrMode, setVrMode] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);

  // Normalize URL
  const targetUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const enterVR = useCallback(async () => {
    // Request DeviceOrientation permission on iOS (for future use)
    const DOE = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof DOE?.requestPermission === "function") {
      try { await DOE.requestPermission(); } catch { /* ok */ }
    }
    setVrMode(true);
  }, []);

  // VR Mode — fullscreen SBS with direct iframes (full interactivity)
  if (vrMode) {
    return (
      <div className="fixed inset-0 z-50 flex bg-black">
        {/* Left eye — fully interactive */}
        <div className="relative h-full w-1/2 overflow-hidden border-r border-white/10">
          <iframe
            src={targetUrl}
            className="h-full w-full border-none"
            allow="fullscreen"
          />
        </div>
        {/* Right eye — fully interactive */}
        <div className="relative h-full w-1/2 overflow-hidden">
          <iframe
            src={targetUrl}
            className="h-full w-full border-none"
            allow="fullscreen"
          />
        </div>

        {/* Bottom hint */}
        <div className="pointer-events-none fixed bottom-3 left-1/2 -translate-x-1/2">
          <div className="rounded-full bg-black/70 px-3 py-1 text-[10px] text-white/40">
            Scroll &amp; tap through the nose gap
          </div>
        </div>

        {/* Exit button — visible on tap */}
        <button
          onClick={() => setVrMode(false)}
          className="fixed top-3 left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-full bg-black/70 px-4 py-1.5 text-xs text-white opacity-0 backdrop-blur transition-opacity active:opacity-100 hover:opacity-100"
        >
          Exit VR
        </button>
      </div>
    );
  }

  // Pre-VR preview
  return (
    <div className="flex flex-col gap-5 py-6">
      {/* Preview — direct iframe, fully interactive */}
      <div className="overflow-hidden rounded-2xl border border-bord bg-surf">
        <div className="flex items-center gap-2 border-b border-bord px-4 py-2">
          <div className="h-2 w-2 rounded-full bg-green" />
          <span className="truncate text-xs text-txt3">{targetUrl}</span>
        </div>
        <iframe
          src={targetUrl}
          className="h-[60vh] w-full border-none"
          allow="fullscreen"
        />
      </div>

      <p className="text-center text-xs text-txt3">
        You can interact with the page above — click buttons, scroll, log in.
        When ready, enter VR mode.
      </p>

      {!isLandscape && (
        <div className="rounded-xl border border-amber/20 bg-amber-soft px-4 py-3 text-center text-sm text-amber">
          Rotate your phone to landscape before entering VR
        </div>
      )}

      <button
        onClick={enterVR}
        className="cursor-pointer rounded-xl bg-accent px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
      >
        Enter VR mode
      </button>

      <div className="rounded-xl border border-bord bg-surf p-4">
        <h3 className="mb-2 text-sm font-medium text-txt">How to use in Cardboard</h3>
        <ul className="flex flex-col gap-1.5 text-sm text-txt2">
          <li><strong className="text-txt">Touch through nose gap</strong> — reach through the Cardboard opening to tap and scroll</li>
          <li><strong className="text-txt">Interact first</strong> — accept popups, log in, navigate to the page you want before entering VR</li>
          <li><strong className="text-txt">Both halves are live</strong> — each eye shows a fully interactive copy of the site</li>
          <li><strong className="text-txt">Exit</strong> — tap the top-center of the screen to show the exit button</li>
        </ul>
      </div>
    </div>
  );
}
