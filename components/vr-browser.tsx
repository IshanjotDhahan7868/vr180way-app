"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface VRBrowserProps {
  url: string;
}

export function VRBrowser({ url }: VRBrowserProps) {
  const [vrMode, setVrMode] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);
  const [neutralBeta, setNeutralBeta] = useState<number | null>(null);
  const leftRef = useRef<HTMLIFrameElement>(null);
  const rightRef = useRef<HTMLIFrameElement>(null);
  const scrollSpeedRef = useRef(0);

  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

  // Orientation check
  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Head-tilt scroll controller
  useEffect(() => {
    if (!vrMode || !permissionGranted) return;

    const DEAD_ZONE = 8;
    const MAX_SPEED = 18;

    function handleOrientation(e: DeviceOrientationEvent) {
      if (e.beta === null) return;
      setNeutralBeta((prev) => (prev === null ? e.beta! : prev));

      const neutral = neutralBeta ?? e.beta;
      const diff = e.beta - neutral;

      if (Math.abs(diff) < DEAD_ZONE) {
        scrollSpeedRef.current = 0;
        return;
      }

      const dir = diff > 0 ? 1 : -1;
      const magnitude = Math.min(Math.abs(diff) - DEAD_ZONE, 40) / 40;
      scrollSpeedRef.current = dir * magnitude * MAX_SPEED;
    }

    window.addEventListener("deviceorientation", handleOrientation);

    // Send scroll commands to both iframes
    const interval = setInterval(() => {
      const speed = scrollSpeedRef.current;
      if (Math.abs(speed) < 0.5) return;

      const msg = { type: "vr-scroll", dy: speed };
      leftRef.current?.contentWindow?.postMessage(msg, "*");
      rightRef.current?.contentWindow?.postMessage(msg, "*");
    }, 16); // ~60fps

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      clearInterval(interval);
    };
  }, [vrMode, permissionGranted, neutralBeta]);

  const enterVR = useCallback(async () => {
    // Request DeviceOrientation permission on iOS
    const DOE = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof DOE?.requestPermission === "function") {
      try {
        const result = await DOE.requestPermission();
        setPermissionGranted(result === "granted");
      } catch {
        setPermissionGranted(false);
      }
    } else {
      setPermissionGranted(true);
    }
    setNeutralBeta(null);
    setVrMode(true);
  }, []);

  const recalibrate = useCallback(() => {
    setNeutralBeta(null);
  }, []);

  // VR Mode — fullscreen SBS split
  if (vrMode) {
    return (
      <div className="fixed inset-0 z-50 flex bg-black">
        {/* Left eye */}
        <div className="relative h-full w-1/2 overflow-hidden border-r border-white/10">
          <iframe
            ref={leftRef}
            src={proxyUrl}
            className="h-full w-full border-none"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
        {/* Right eye */}
        <div className="relative h-full w-1/2 overflow-hidden">
          <iframe
            ref={rightRef}
            src={proxyUrl}
            className="h-full w-full border-none"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>

        {/* Scroll indicator */}
        <div className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2">
          <div className="rounded-full bg-black/60 px-3 py-1 text-center text-[10px] text-white/50">
            Tilt head to scroll
          </div>
        </div>

        {/* Exit + recalibrate (tap screen to show briefly) */}
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-4 opacity-0 transition-opacity active:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-2">
            <button
              onClick={() => setVrMode(false)}
              className="cursor-pointer rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur"
            >
              Exit VR
            </button>
            <button
              onClick={recalibrate}
              className="cursor-pointer rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur"
            >
              Recalibrate
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pre-VR view
  return (
    <div className="flex flex-col gap-6 py-8">
      {/* Preview */}
      <div className="overflow-hidden rounded-2xl border border-bord bg-surf">
        <div className="border-b border-bord px-4 py-2">
          <span className="truncate text-xs text-txt3">{url}</span>
        </div>
        <iframe
          src={proxyUrl}
          className="h-[50vh] w-full border-none"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

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
        <h3 className="mb-2 text-sm font-medium text-txt">How it works</h3>
        <ul className="flex flex-col gap-1.5 text-sm text-txt2">
          <li><strong className="text-txt">Split screen</strong> — the page is shown side-by-side for each eye</li>
          <li><strong className="text-txt">Head-tilt scroll</strong> — look down to scroll down, look up to scroll up</li>
          <li><strong className="text-txt">Recalibrate</strong> — tap the screen and hit Recalibrate if drift occurs</li>
          <li><strong className="text-txt">Best experience</strong> — add this page to your Home Screen first</li>
        </ul>
      </div>
    </div>
  );
}
