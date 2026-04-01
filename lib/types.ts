export type WarpMode = "stretch" | "pad";

export interface TransformParams {
  warpMode: WarpMode;
  zoom: number;
  stretchH: number;
  stretchV: number;
  cropX: number;
  cropY: number;
}

export interface Job {
  jobId: string;
  filename: string;
  size: number;
  warpMode: WarpMode;
  status: "uploading" | "queued" | "processing" | "done" | "error";
  progress: number;
  stage: string;
  error: string | null;
  outputFilename: string | null;
  outputUrl: string | null;
  blobUrl: string | null;
  orientation: string | null;
}

export const DEFAULT_TRANSFORM: TransformParams = {
  warpMode: "pad",
  zoom: 1.0,
  stretchH: 1.0,
  stretchV: 1.0,
  cropX: 0.0,
  cropY: 0.0,
};
