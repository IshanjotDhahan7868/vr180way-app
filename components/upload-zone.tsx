"use client";

import { useState, useRef, useCallback } from "react";
import { upload } from "@vercel/blob/client";
import type { Job, TransformParams } from "@/lib/types";

interface UploadZoneProps {
  params: TransformParams;
  onJobCreated: (job: Job) => void;
  onJobUpdate: (jobId: string, updates: Partial<Job>) => void;
  disabled?: boolean;
}

function formatBytes(b: number) {
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

export function UploadZone({ params, onJobCreated, onJobUpdate, disabled }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      const jobId = crypto.randomUUID();
      const isImage = file.type.startsWith("image/");
      const job: Job = {
        jobId,
        filename: file.name,
        size: file.size,
        warpMode: params.warpMode,
        projection: params.projection,
        sourceType: "file",
        mediaType: isImage ? "image" : "video",
        status: "uploading",
        progress: 0,
        stage: `Uploading ${formatBytes(file.size)}...`,
        error: null,
        outputFilename: null,
        outputUrl: null,
        blobUrl: null,
        orientation: null,
      };
      onJobCreated(job);

      try {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload-token",
          multipart: file.size > 10 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => {
            onJobUpdate(jobId, {
              progress: Math.round(percentage * 0.4),
              stage: `Uploading... ${Math.round(percentage)}%`,
            });
          },
        });

        onJobUpdate(jobId, {
          blobUrl: blob.url,
          status: "queued",
          progress: 40,
          stage: "Starting conversion...",
        });

        const res = await fetch("/api/start-job", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blobUrl: blob.url,
            originalFilename: file.name,
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
          progress: 42,
          stage: "Processing...",
        });
      } catch (err) {
        onJobUpdate(jobId, {
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed",
          stage: "Error",
        });
      }
    },
    [params, onJobCreated, onJobUpdate]
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      const valid = files.filter(
        (f) => f.type.startsWith("video/") || f.type.startsWith("image/") || /\.(mp4|mov|avi|mkv|webm|m4v|wmv|jpg|jpeg|png|webp|heic)$/i.test(f.name)
      );
      for (const file of valid) {
        processFile(file);
      }
    },
    [processFile]
  );

  return (
    <div
      className={`relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed bg-surf p-10 text-center transition-all ${
        dragging ? "border-accent bg-accent-soft" : "border-bord hover:border-white/15"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); if (!disabled) handleFiles(Array.from(e.dataTransfer.files)); }}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*,image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(Array.from(e.target.files || []))}
      />
      <div className="mb-3 text-3xl opacity-40">
        {disabled ? "\u23F3" : "\u2B06"}
      </div>
      <div className="mb-1 text-base font-medium">
        {disabled ? "Uploading..." : "Drop a video or image here"}
      </div>
      <div className="text-sm text-txt3">
        or click to browse. MP4, MOV, MKV, JPG, PNG
      </div>
    </div>
  );
}
