"use client";

import { useEffect, useRef } from "react";
import type { Job } from "./types";

/**
 * Polls /api/job-status/[id] for active jobs and updates their state.
 * Only polls jobs that are in "processing" or "queued" status.
 */
export function useJobPoller(
  jobs: Job[],
  onUpdate: (jobId: string, updates: Partial<Job>) => void
) {
  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;

  useEffect(() => {
    const active = jobs.filter(
      (j) => j.status === "queued" || j.status === "processing"
    );
    if (active.length === 0) return;

    const interval = setInterval(async () => {
      const current = jobsRef.current.filter(
        (j) => j.status === "queued" || j.status === "processing"
      );

      await Promise.all(
        current.map(async (job) => {
          try {
            const res = await fetch(`/api/job-status/${job.jobId}`);
            if (!res.ok) return;
            const data = await res.json();

            // Map worker progress (0-100) to our range (40-100) since upload is 0-40
            const mappedProgress = Math.round(40 + (data.progress / 100) * 60);

            onUpdate(job.jobId, {
              status: data.status,
              progress: data.status === "done" ? 100 : mappedProgress,
              stage: data.stage || job.stage,
              error: data.error,
              outputFilename: data.output_filename,
              outputUrl: data.output_url,
              orientation: data.orientation,
            });
          } catch {
            // Silently ignore polling errors
          }
        })
      );
    }, 500);

    return () => clearInterval(interval);
  }, [jobs, onUpdate]);
}
