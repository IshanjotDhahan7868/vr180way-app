"use client";

import { useEffect, useRef, useState } from "react";

interface VRPlayerProps {
  url: string;
  projection: "vr180" | "vr360";
  type: "video" | "image";
}

export function VRPlayer({ url, projection, type }: VRPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);

  // Check orientation
  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const enterVR = async () => {
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
    setStarted(true);
  };

  // Load A-Frame and build scene after user starts
  useEffect(() => {
    if (!started || !containerRef.current) return;

    // Dynamic import of A-Frame (must be client-side only)
    import("aframe").then(() => {
      const container = containerRef.current;
      if (!container) return;

      const thetaLength = projection === "vr180" ? "180" : "360";
      const thetaStart = projection === "vr180" ? "90" : "0"; // Center the 180 view

      if (type === "image") {
        container.innerHTML = `
          <a-scene embedded vr-mode-ui="enabled: true" device-orientation-permission-ui="enabled: true"
                   style="width:100%;height:100%">
            <a-sky src="${url}" rotation="0 -90 0"
                   theta-length="${thetaLength}" theta-start="${thetaStart}"></a-sky>
            <a-camera look-controls="magicWindowTrackingEnabled: ${permissionGranted}"></a-camera>
          </a-scene>
        `;
      } else {
        // Video
        container.innerHTML = `
          <a-scene embedded vr-mode-ui="enabled: true" device-orientation-permission-ui="enabled: true"
                   style="width:100%;height:100%">
            <a-assets>
              <video id="vr-video" src="${url}" crossorigin="anonymous"
                     playsinline webkit-playsinline loop preload="auto"></video>
            </a-assets>
            <a-videosphere src="#vr-video" rotation="0 -90 0"
                           theta-length="${thetaLength}" theta-start="${thetaStart}"></a-videosphere>
            <a-camera look-controls="magicWindowTrackingEnabled: ${permissionGranted}"></a-camera>
          </a-scene>
        `;

        // Start video playback (needs user gesture context)
        const video = container.querySelector("video") as HTMLVideoElement;
        if (video) {
          video.play().catch(() => {
            // iOS may still block — user needs to tap the scene
          });
        }
      }
    });

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [started, url, projection, type, permissionGranted]);

  if (!started) {
    return (
      <div className="flex flex-col items-center gap-6 py-16">
        {!isLandscape && (
          <div className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 font-mono text-[11px] text-gold">
            Rotate your phone to landscape for the best VR experience
          </div>
        )}

        <button
          onClick={enterVR}
          className="cursor-pointer rounded-xl border-2 border-purp bg-purp/10 px-10 py-5 font-mono text-lg tracking-[3px] text-purp transition-all hover:bg-purp/20 hover:shadow-[0_0_30px_rgba(170,136,255,0.3)]"
        >
          ENTER VR
        </button>

        <p className="max-w-xs text-center font-mono text-[10px] leading-relaxed text-mut">
          Tap to enable head tracking and start playback.
          For fullscreen, add this page to your Home Screen.
        </p>

        <div className="rounded-lg border border-bord bg-surf p-4">
          <p className="mb-2 font-mono text-[10px] tracking-[2px] text-cyan opacity-70">
            ADD TO HOME SCREEN
          </p>
          <ol className="flex list-decimal flex-col gap-1 pl-4 font-mono text-[11px] text-mut">
            <li>Tap the Share button in Safari</li>
            <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
            <li>Open from your home screen for true fullscreen VR</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black"
      onClick={() => {
        // Toggle video play/pause on tap
        const video = containerRef.current?.querySelector("video") as HTMLVideoElement;
        if (video) {
          video.paused ? video.play() : video.pause();
        }
      }}
    />
  );
}
