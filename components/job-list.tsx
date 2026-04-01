"use client";

import type { Job } from "@/lib/types";

function formatBytes(b: number) {
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function ProgressBar({ progress, stage, status }: { progress: number; stage: string; status: string }) {
  const isActive = status === "processing" || status === "queued" || status === "uploading";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${progress}%`,
            background: status === "done" ? "#22c55e" : status === "error" ? "#ef4444" : "#6366f1",
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-txt3">
        <span>
          {isActive && <span className="mr-1 inline-block animate-spin-slow">&#8635;</span>}
          {stage}
        </span>
        <span>{progress}%</span>
      </div>
    </div>
  );
}

function JobRow({ job }: { job: Job }) {
  return (
    <div className="rounded-xl border border-bord bg-surf p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{job.filename}</div>
          <div className="mt-0.5 flex gap-2 text-xs text-txt3">
            {job.size > 0 && <span>{formatBytes(job.size)}</span>}
            <span>{job.warpMode === "stretch" ? "Immersive" : "Flat screen"}</span>
            <span>{job.projection === "vr360" ? "360\u00B0" : "180\u00B0"}</span>
          </div>
        </div>
      </div>

      <ProgressBar progress={job.progress} stage={job.stage} status={job.status} />

      {job.status === "error" && (
        <div className="mt-3 rounded-lg bg-red-soft px-3 py-2 text-xs text-red">
          {job.error}
        </div>
      )}

      {job.status === "done" && job.outputUrl && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-soft px-4 py-2 text-sm font-medium text-green no-underline transition-opacity hover:opacity-80"
            href={job.outputUrl}
            download={job.outputFilename || undefined}
            target="_blank"
            rel="noopener noreferrer"
          >
            Download
          </a>
          <a
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent-soft px-4 py-2 text-sm font-medium text-accent no-underline transition-opacity hover:opacity-80"
            href={`/watch?url=${encodeURIComponent(job.outputUrl)}&projection=${job.projection || "vr180"}&type=video`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Watch in VR
          </a>
          <button
            className="cursor-pointer rounded-lg border-none bg-transparent px-2 py-2 text-xs text-txt3 hover:text-txt2"
            onClick={() => navigator.clipboard.writeText(job.outputUrl!)}
          >
            Copy link
          </button>
        </div>
      )}
    </div>
  );
}

export function JobList({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-txt2">Conversions</h3>
      {jobs.map((job) => (
        <JobRow key={job.jobId} job={job} />
      ))}
    </div>
  );
}
