"use client";

import { useState, useCallback } from "react";
import { YOUTUBE_URL_REGEX } from "@/lib/constants";
import type { Job, TransformParams } from "@/lib/types";

interface YouTubeInputProps {
  params: TransformParams;
  onJobCreated: (job: Job) => void;
  onJobUpdate: (jobId: string, updates: Partial<Job>) => void;
  disabled?: boolean;
}

export function YouTubeInput({ params, onJobCreated, onJobUpdate, disabled }: YouTubeInputProps) {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isValid = YOUTUBE_URL_REGEX.test(url.trim());

  const handleSubmit = useCallback(async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);

    const jobId = crypto.randomUUID();
    const job: Job = {
      jobId,
      filename: url.trim(),
      size: 0,
      warpMode: params.warpMode,
      projection: params.projection,
      sourceType: "youtube",
      mediaType: "video",
      status: "queued",
      progress: 0,
      stage: "Sending to worker...",
      error: null,
      outputFilename: null,
      outputUrl: null,
      blobUrl: null,
      orientation: null,
    };
    onJobCreated(job);

    try {
      const res = await fetch("/api/start-url-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl: url.trim(),
          warpMode: params.warpMode,
          projection: params.projection,
          quality: params.quality,
          resolution: params.resolution,
          stretchH: params.stretchH,
          stretchV: params.stretchV,
          cropX: params.cropX,
          cropY: params.cropY,
          zoom: params.zoom,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Server error (${res.status})`);
      }

      const data = await res.json();
      onJobUpdate(jobId, {
        jobId: data.job_id,
        status: "processing",
        progress: 5,
        stage: "Downloading video...",
      });
      setUrl("");
    } catch (err) {
      onJobUpdate(jobId, {
        status: "error",
        error: err instanceof Error ? err.message : "Failed to start job",
        stage: "Error",
      });
    } finally {
      setSubmitting(false);
    }
  }, [url, isValid, submitting, params, onJobCreated, onJobUpdate]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="Paste a YouTube link..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={disabled || submitting}
          className="flex-1 rounded-xl border border-bord bg-surf px-4 py-3 text-sm text-txt outline-none placeholder:text-txt3 focus:border-accent disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting || disabled}
          className="cursor-pointer rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Starting..." : "Convert"}
        </button>
      </div>
      <p className="text-xs text-txt3">
        Videos up to 10 minutes, downloaded at 720p. YouTube 360 videos are auto-detected.
      </p>
    </div>
  );
}
