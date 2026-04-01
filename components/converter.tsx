"use client";

import { useState, useCallback } from "react";
import { ModeSelector } from "./mode-selector";
import { EyePreview } from "./eye-preview";
import { TransformControls } from "./transform-controls";
import { UploadZone } from "./upload-zone";
import { JobList } from "./job-list";
import { HowToWatch } from "./how-to-watch";
import { useJobPoller } from "@/lib/use-job-poller";
import type { Job, TransformParams } from "@/lib/types";
import { DEFAULT_TRANSFORM } from "@/lib/types";

export function Converter() {
  const [params, setParams] = useState<TransformParams>(DEFAULT_TRANSFORM);
  const [jobs, setJobs] = useState<Job[]>([]);

  const uploading = jobs.some((j) => j.status === "uploading");

  const handleJobCreated = useCallback((job: Job) => {
    setJobs((prev) => [job, ...prev]);
  }, []);

  const handleJobUpdate = useCallback(
    (jobId: string, updates: Partial<Job>) => {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.jobId !== jobId) return j;
          // If we're replacing the jobId (local → worker), update accordingly
          const newJob = { ...j, ...updates };
          return newJob;
        })
      );
    },
    []
  );

  useJobPoller(jobs, handleJobUpdate);

  return (
    <main className="relative z-[1] flex flex-col gap-6">
      <ModeSelector
        warpMode={params.warpMode}
        onWarpModeChange={(mode) => setParams({ ...params, warpMode: mode })}
      />

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

      <UploadZone
        params={params}
        onJobCreated={handleJobCreated}
        onJobUpdate={handleJobUpdate}
        disabled={uploading}
      />

      <JobList jobs={jobs} />

      <HowToWatch />
    </main>
  );
}
