"use client";

import { useState, useCallback } from "react";
import { ModeSelector } from "./mode-selector";
import { ProjectionSelector } from "./projection-selector";
import { SourceSelector } from "./source-selector";
import { EyePreview } from "./eye-preview";
import { TransformControls } from "./transform-controls";
import { UploadZone } from "./upload-zone";
import { YouTubeInput } from "./youtube-input";
import { JobList } from "./job-list";
import { HowToWatch } from "./how-to-watch";
import { useJobPoller } from "@/lib/use-job-poller";
import type { Job, TransformParams, SourceType } from "@/lib/types";
import { DEFAULT_TRANSFORM } from "@/lib/types";

export function Converter() {
  const [params, setParams] = useState<TransformParams>(DEFAULT_TRANSFORM);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [source, setSource] = useState<SourceType>("file");

  const uploading = jobs.some((j) => j.status === "uploading");
  const processing = jobs.some((j) => j.status === "processing" || j.status === "queued");

  const handleJobCreated = useCallback((job: Job) => {
    setJobs((prev) => [job, ...prev]);
  }, []);

  const handleJobUpdate = useCallback(
    (jobId: string, updates: Partial<Job>) => {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.jobId !== jobId) return j;
          return { ...j, ...updates };
        })
      );
    },
    []
  );

  useJobPoller(jobs, handleJobUpdate);

  return (
    <main className="relative z-[1] flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <ModeSelector
          warpMode={params.warpMode}
          onWarpModeChange={(mode) => setParams({ ...params, warpMode: mode })}
        />
        <ProjectionSelector
          projection={params.projection}
          onChange={(p) => setParams({ ...params, projection: p })}
        />
      </div>

      <EyePreview
        warpMode={params.warpMode}
        orientation="landscape"
        stretchH={params.stretchH}
        stretchV={params.stretchV}
        cropX={params.cropX}
        cropY={params.cropY}
        zoom={params.zoom}
      />

      <TransformControls params={params} onChange={setParams} />

      <SourceSelector source={source} onChange={setSource} />

      {source === "file" ? (
        <UploadZone
          params={params}
          onJobCreated={handleJobCreated}
          onJobUpdate={handleJobUpdate}
          disabled={uploading}
        />
      ) : (
        <YouTubeInput
          params={params}
          onJobCreated={handleJobCreated}
          onJobUpdate={handleJobUpdate}
          disabled={processing}
        />
      )}

      <JobList jobs={jobs} />

      <HowToWatch />
    </main>
  );
}
