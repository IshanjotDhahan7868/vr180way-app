"use client";

import type { Job } from "@/lib/types";

function formatBytes(b: number) {
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function ProgressBar({
  progress,
  stage,
  status,
}: {
  progress: number;
  stage: string;
  status: string;
}) {
  const color =
    status === "done"
      ? "#00ffb3"
      : status === "error"
        ? "#ff4466"
        : "#00ccff";
  const active = status === "processing" || status === "queued" || status === "uploading";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-[5px] overflow-hidden rounded-sm bg-white/[0.06]">
        <div
          className="h-full rounded-sm transition-[width] duration-300 ease-out"
          style={{
            width: `${progress}%`,
            background: color,
            boxShadow: active ? `0 0 10px ${color}88` : "none",
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px]" style={{ color }}>
          {active && (
            <span className="mr-1 inline-block animate-spin-slow">{"\u27F3"}</span>
          )}
          {stage}
        </span>
        <span className="font-mono text-[11px]" style={{ color }}>
          {progress}%
        </span>
      </div>
    </div>
  );
}

function JobRow({ job }: { job: Job }) {
  const color =
    job.status === "done"
      ? "#00ffb3"
      : job.status === "error"
        ? "#ff4466"
        : "#00ccff";

  return (
    <div
      className="flex flex-col gap-2 rounded-md border border-bord border-l-[3px] bg-surf p-3"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center gap-2">
        <span className="flex-1 break-all text-[13px] font-semibold">
          {job.filename}
        </span>
        <span className="flex shrink-0 gap-2">
          <span className="font-mono text-[10px] tracking-[1px] text-mut">
            {formatBytes(job.size)}
          </span>
          <span className="font-mono text-[10px] tracking-[1px] text-mut">
            {job.warpMode === "stretch" ? "WARP" : "FILL"}
          </span>
        </span>
      </div>

      <ProgressBar
        progress={job.progress}
        stage={job.stage}
        status={job.status}
      />

      {job.status === "error" && (
        <div className="break-all font-mono text-[11px] text-red">
          {job.error}
        </div>
      )}

      {job.status === "done" && job.outputUrl && (
        <div className="flex flex-col gap-1 self-start">
          <a
            className="inline-block rounded border border-grn bg-grn/10 px-4 py-1.5 font-mono text-[12px] tracking-[2px] text-grn no-underline transition-colors hover:bg-grn/20"
            href={job.outputUrl}
            download={job.outputFilename || undefined}
            target="_blank"
            rel="noopener noreferrer"
          >
            {"\u2193"} Download
          </a>
          <div className="flex gap-2">
            <a
              className="inline-block rounded border border-purp bg-purp/10 px-4 py-1.5 font-mono text-[12px] tracking-[2px] text-purp no-underline transition-colors hover:bg-purp/20"
              href={`/watch?url=${encodeURIComponent(job.outputUrl)}&projection=${job.projection || "vr180"}&type=video`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch in VR
            </a>
            <button
              className="cursor-pointer border-none bg-transparent px-0.5 text-left font-mono text-[10px] text-mut hover:text-txt"
              onClick={() => {
                navigator.clipboard.writeText(job.outputUrl!);
              }}
            >
              Copy link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function JobList({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) return null;

  return (
    <div>
      <div className="mb-2.5 font-mono text-[10px] tracking-[3px] text-cyan opacity-70">
        CONVERSION QUEUE
      </div>
      <div className="flex flex-col gap-2">
        {jobs.map((job) => (
          <JobRow key={job.jobId} job={job} />
        ))}
      </div>
    </div>
  );
}
