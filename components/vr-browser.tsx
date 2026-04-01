"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface VRBrowserProps {
  url: string;
}

type ScrollSpeed = "off" | "slow" | "medium" | "fast";

const SPEED_VALUES: Record<ScrollSpeed, number> = {
  off: 0,
  slow: 1.5,
  medium: 4,
  fast: 9,
};

export function VRBrowser({ url }: VRBrowserProps) {
  const [vrMode, setVrMode] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);
  const [scrollSpeed, setScrollSpeed] = useState<ScrollSpeed>("off");
  const [showControls, setShowControls] = useState(true);
  const leftRef = useRef<HTMLIFrameElement>(null);
  const rightRef = useRef<HTMLIFrameElement>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const targetUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;

  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Auto-scroll: send scroll commands to both proxied iframes in sync
  useEffect(() => {
    if (!vrMode || scrollSpeed === "off") return;

    const speed = SPEED_VALUES[scrollSpeed];
    const interval = setInterval(() => {
      const msg = { type: "vr-scroll", dy: speed };
      leftRef.current?.contentWindow?.postMessage(msg, "*");
      rightRef.current?.contentWindow?.postMessage(msg, "*");
    }, 16); // ~60fps, both get the command at the same time

    return () => clearInterval(interval);
  }, [vrMode, scrollSpeed]);

  // Auto-hide controls after 4 seconds
  useEffect(() => {
    if (!vrMode || !showControls) return;
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 4000);
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
  }, [vrMode, showControls, scrollSpeed]);

  const enterVR = useCallback(async () => {
    const DOE = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof DOE?.requestPermission === "function") {
      try { await DOE.requestPermission(); } catch { /* ok */ }
    }
    setVrMode(true);
    setShowControls(true);
  }, []);

  const toggleControls = useCallback(() => {
    setShowControls(true);
  }, []);

  const cycleSpeed = useCallback(() => {
    setScrollSpeed((prev) => {
      const order: ScrollSpeed[] = ["off", "slow", "medium", "fast"];
      const idx = order.indexOf(prev);
      return order[(idx + 1) % order.length];
    });
    setShowControls(true);
  }, []);

  // VR Mode — fullscreen SBS with proxied iframes for scroll sync
  if (vrMode) {
    return (
      <div className="fixed inset-0 z-50 flex bg-black" onClick={toggleControls}>
        {/* Left eye */}
        <div className="relative h-full w-1/2 overflow-hidden border-r border-white/10">
          <iframe
            ref={leftRef}
            src={proxyUrl}
            className="h-full w-full border-none"
          />
        </div>
        {/* Right eye */}
        <div className="relative h-full w-1/2 overflow-hidden">
          <iframe
            ref={rightRef}
            src={proxyUrl}
            className="h-full w-full border-none"
          />
        </div>

        {/* Floating controls — shown on tap, auto-hide after 4s */}
        <div
          className={`pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-5 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-black/80 px-4 py-2.5 backdrop-blur-sm">
            {/* Auto-scroll toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); cycleSpeed(); }}
              className={`cursor-pointer rounded-xl px-4 py-2 text-xs font-medium transition-all ${
                scrollSpeed !== "off"
                  ? "bg-accent text-white"
                  : "bg-white/10 text-white/70"
              }`}
            >
              {scrollSpeed === "off" ? "Auto-scroll: Off" : `Scrolling: ${scrollSpeed}`}
            </button>

            {/* Speed buttons (visible when scrolling is on) */}
            {scrollSpeed !== "off" && (
              <div className="flex gap-1">
                {(["slow", "medium", "fast"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={(e) => { e.stopPropagation(); setScrollSpeed(s); setShowControls(true); }}
                    className={`cursor-pointer rounded-lg px-3 py-1.5 text-[10px] font-medium transition-all ${
                      scrollSpeed === s
                        ? "bg-white/20 text-white"
                        : "bg-white/5 text-white/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Divider */}
            <div className="mx-1 h-5 w-px bg-white/15" />

            {/* Exit */}
            <button
              onClick={(e) => { e.stopPropagation(); setVrMode(false); setScrollSpeed("off"); }}
              className="cursor-pointer rounded-xl bg-red/20 px-3 py-2 text-xs font-medium text-red transition-all hover:bg-red/30"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Tap hint (only when controls hidden) */}
        {!showControls && (
          <div className="pointer-events-none fixed bottom-3 left-1/2 -translate-x-1/2">
            <div className="rounded-full bg-black/50 px-3 py-1 text-[9px] text-white/25">
              Tap for controls
            </div>
          </div>
        )}
      </div>
    );
  }

  // Pre-VR preview (direct iframe — full interactivity)
  return (
    <div className="flex flex-col gap-5 py-6">
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
        Interact with the page above first — accept popups, navigate where you want.
        Then enter VR mode.
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
          <li><strong className="text-txt">Interact first</strong> — accept popups, navigate to the page you want, then enter VR</li>
          <li><strong className="text-txt">Auto-scroll</strong> — tap the screen to show controls, toggle auto-scroll (slow/medium/fast)</li>
          <li><strong className="text-txt">Both eyes sync</strong> — auto-scroll moves both halves together at the same speed</li>
          <li><strong className="text-txt">Exit</strong> — tap the screen, then tap Exit</li>
        </ul>
      </div>
    </div>
  );
}
