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

export function UploadZone({
  params,
  onJobCreated,
  onJobUpdate,
  disabled,
}: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      const jobId = crypto.randomUUID();

      // Create job in uploading state
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
        // Upload directly to Vercel Blob
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload-token",
          multipart: file.size > 10 * 1024 * 1024, // multipart for >10MB
          onUploadProgress: ({ percentage }) => {
            onJobUpdate(jobId, {
              progress: Math.round(percentage * 0.4), // 0-40% for upload
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

        // Start processing on worker
        const res = await fetch("/api/start-job", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blobUrl: blob.url,
            originalFilename: file.name,
            warpMode: params.warpMode,
            projection: params.projection,
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
          jobId: data.job_id, // Replace local UUID with worker's UUID
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
      const videoFiles = files.filter(
        (f) => f.type.startsWith("video/") || f.type.startsWith("image/") || /\.(mp4|mov|avi|mkv|webm|m4v|wmv|jpg|jpeg|png|webp|heic)$/i.test(f.name)
      );
      for (const file of videoFiles) {
        processFile(file);
      }
    },
    [processFile]
  );

  return (
    <div>
      <div className="mb-2.5 font-mono text-[10px] tracking-[3px] text-cyan opacity-70">
        UPLOAD VIDEOS
      </div>
      <div
        className={`relative cursor-pointer overflow-hidden rounded-lg border-[1.5px] border-dashed bg-surf p-9 text-center transition-colors ${
          dragging ? "border-cyan bg-cyan/[0.04]" : "border-bord hover:border-cyan hover:bg-cyan/[0.04]"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) {
            handleFiles(Array.from(e.dataTransfer.files));
          }
        }}
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
        <div className="mb-2 text-[26px] opacity-50">
          {disabled ? "\u27F3" : "\u2B21"}
        </div>
        <div className="mb-1 text-sm font-semibold">
          {disabled ? "Uploading\u2026" : "Drop videos here"}
        </div>
        <div className="font-mono text-[11px] tracking-[1px] text-mut">
          MP4 \u00B7 MOV \u00B7 MKV \u00B7 AVI \u00B7 WebM \u00B7 JPG \u00B7 PNG
        </div>
        {dragging && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,200,255,0.12),transparent_70%)]" />
        )}
      </div>
    </div>
  );
}
