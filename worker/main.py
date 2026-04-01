"""
VR180 Converter — Processing Worker
Runs on Render (Docker). Receives blob URLs, processes with FFmpeg, uploads results back.
"""

import os
import uuid
import subprocess
import threading
import time
import json
from pathlib import Path
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Config ───────────────────────────────────────────────────────────────────

API_SECRET = os.environ.get("API_SECRET", "")
BLOB_READ_WRITE_TOKEN = os.environ.get("BLOB_READ_WRITE_TOKEN", "")
BLOB_API_URL = "https://vercel.com/api/blob"

MAX_CONCURRENT_JOBS = 2
MAX_FILE_SIZE_MB = 500
MAX_DURATION_SEC = 600  # 10 minutes
JOB_TIMEOUT_SEC = 1800  # 30 minutes

TMP_DIR = Path("/tmp/vr180-worker")
TMP_DIR.mkdir(parents=True, exist_ok=True)

# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="VR180 Worker")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# In-memory job store (stateless — jobs lost on restart, acceptable for MVP)
jobs: dict[str, dict] = {}
active_job_count = 0
job_lock = threading.Lock()


# ── Auth Middleware ───────────────────────────────────────────────────────────

@app.middleware("http")
async def check_auth(request: Request, call_next):
    if request.url.path in ("/health", "/docs", "/openapi.json"):
        return await call_next(request)
    if API_SECRET:
        auth = request.headers.get("authorization", "")
        if auth != f"Bearer {API_SECRET}":
            raise HTTPException(401, "Unauthorized")
    return await call_next(request)


# ── Models ───────────────────────────────────────────────────────────────────

class ProcessRequest(BaseModel):
    blob_url: str
    original_filename: str
    warp_mode: str = "pad"
    projection: str = "vr180"
    quality: str = "balanced"
    resolution: str = "720p"
    stretch_h: float = 1.0
    stretch_v: float = 1.0
    crop_x: float = 0.0
    crop_y: float = 0.0
    zoom: float = 1.0


class ProcessURLRequest(BaseModel):
    youtube_url: str
    warp_mode: str = "pad"
    projection: str = "vr180"
    quality: str = "balanced"
    resolution: str = "720p"
    stretch_h: float = 1.0
    stretch_v: float = 1.0
    crop_x: float = 0.0
    crop_y: float = 0.0
    zoom: float = 1.0


# ── Quality Presets ──────────────────────────────────────────────────────────

QUALITY_MAP = {
    "fast":     {"preset": "ultrafast", "crf": "28", "tune": "fastdecode", "audio_br": "96k"},
    "balanced": {"preset": "fast",      "crf": "23", "tune": "fastdecode", "audio_br": "128k"},
    "high":     {"preset": "medium",    "crf": "18", "tune": None,         "audio_br": "192k"},
}

RESOLUTION_MAP = {
    "720p":  (1280, 720),
    "1080p": (1920, 1080),
}


# ── FFmpeg Pipeline (reused from original app) ──────────────────────────────

def get_video_info(path: Path) -> dict:
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json",
         "-show_streams", "-show_format", str(path)],
        capture_output=True, text=True
    )
    data = json.loads(result.stdout)
    for stream in data.get("streams", []):
        if stream.get("codec_type") == "video":
            duration = 0
            try:
                duration = float(stream.get("duration", 0))
            except (ValueError, TypeError):
                pass
            if not duration:
                try:
                    duration = float(data.get("format", {}).get("duration", 0))
                except (ValueError, TypeError):
                    pass
            w = stream.get("width", 1920)
            h = stream.get("height", 1080)
            rotation = 0
            tags = stream.get("tags", {})
            side_data = stream.get("side_data_list", [])
            if isinstance(tags, dict):
                try:
                    rotation = int(tags.get("rotate", 0))
                except (ValueError, TypeError):
                    pass
            if not rotation and side_data:
                for sd in side_data:
                    if isinstance(sd, dict) and "rotation" in sd:
                        try:
                            rotation = int(sd["rotation"])
                        except (ValueError, TypeError):
                            pass
            if abs(rotation) in (90, 270):
                w, h = h, w
            return {
                "width": w, "height": h, "duration": duration,
                "rotation": rotation, "orientation": "portrait" if h > w else "landscape",
            }
    return {"width": 1920, "height": 1080, "duration": 0, "rotation": 0, "orientation": "landscape"}


def build_ffmpeg_command(
    input_path: Path, output_path: Path,
    warp_mode: str, info: dict,
    stretch_h: float = 1.0, stretch_v: float = 1.0,
    crop_x: float = 0.0, crop_y: float = 0.0,
    zoom: float = 1.0, projection: str = "vr180",
    quality: str = "balanced", resolution: str = "720p",
) -> list:
    EYE_W, EYE_H = RESOLUTION_MAP.get(resolution, (1280, 720))
    qset = QUALITY_MAP.get(quality, QUALITY_MAP["balanced"])

    sh = max(0.5, min(2.5, stretch_h))
    sv = max(0.5, min(2.5, stretch_v))
    cx_ = max(-1.0, min(1.0, crop_x))
    cy_ = max(-1.0, min(1.0, crop_y))
    zm = max(0.5, min(3.0, zoom))

    filters = []

    # Pre-scale large inputs to 720p to prevent OOM on constrained VMs
    src_w = info.get("width", 1920)
    src_h = info.get("height", 1080)
    if src_w > 1280 or src_h > 720:
        filters.append("scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease:flags=fast_bilinear")

    # Scale to fit inside eye frame (letterbox/pillarbox)
    fit_filter = (
        f"scale={EYE_W}:{EYE_H}:force_original_aspect_ratio=decrease:flags=lanczos,"
        f"pad={EYE_W}:{EYE_H}:(ow-iw)/2:(oh-ih)/2:black"
    )
    filters.append(fit_filter)

    # Zoom
    if abs(zm - 1.0) > 0.01:
        zoomed_w = int(EYE_W * zm)
        zoomed_h = int(EYE_H * zm)
        zoomed_w += zoomed_w % 2
        zoomed_h += zoomed_h % 2
        filters.append(f"scale={zoomed_w}:{zoomed_h}:flags=lanczos")
        overflow_x = zoomed_w - EYE_W
        overflow_y = zoomed_h - EYE_H
        ox = overflow_x // 2
        oy = overflow_y // 2
        filters.append(f"crop={EYE_W}:{EYE_H}:{ox}:{oy}")

    # Independent H/V stretch
    if abs(sh - 1.0) > 0.01 or abs(sv - 1.0) > 0.01:
        sw = int(EYE_W * sh)
        sw += sw % 2
        sv_ = int(EYE_H * sv)
        sv_ += sv_ % 2
        filters.append(f"scale={sw}:{sv_}:flags=lanczos")

        if sw >= EYE_W and sv_ >= EYE_H:
            overflow_x = sw - EYE_W
            overflow_y = sv_ - EYE_H
            ox = int((overflow_x / 2) * (1 + cx_))
            oy = int((overflow_y / 2) * (1 + cy_))
            ox = max(0, min(overflow_x, ox))
            oy = max(0, min(overflow_y, oy))
            filters.append(f"crop={EYE_W}:{EYE_H}:{ox}:{oy}")
        else:
            filters.append(f"pad={EYE_W}:{EYE_H}:(ow-iw)/2:(oh-ih)/2:black")

    # Ensure exact eye frame size
    filters.append(f"scale={EYE_W}:{EYE_H}:flags=lanczos")

    # Equirectangular warp
    if warp_mode == "stretch":
        if projection == "vr360":
            # Full 360 sphere — rectilinear to full equirectangular
            filters.append("v360=flat:equirect:ih_fov=90:iv_fov=60:interp=cubic")
        else:
            # 180 half sphere — rectilinear to half equirectangular
            filters.append("v360=rectilinear:hequirect:ih_fov=90:iv_fov=60:interp=cubic")
    elif projection == "vr360":
        # Pad mode + 360: still project flat content onto full sphere
        filters.append("v360=flat:equirect:ih_fov=110:iv_fov=70:interp=cubic")

    # SBS duplication
    chain = ",".join(filters)
    filter_complex = (
        f"[0:v]{chain}[eye];"
        f"[eye]split[l][r];"
        f"[l][r]hstack[out]"
    )

    cmd = [
        "ffmpeg", "-y",
        "-i", str(input_path),
        "-filter_complex", filter_complex,
        "-map", "[out]",
        "-map", "0:a?",
        "-c:v", "libx264",
        "-preset", qset["preset"],
        "-crf", qset["crf"],
    ]
    if qset["tune"]:
        cmd += ["-tune", qset["tune"]]
    cmd += [
        "-threads", "0",
        "-c:a", "aac", "-b:a", qset["audio_br"], "-ac", "2",
        "-movflags", "+faststart",
        "-progress", "pipe:2",
        "-nostats",
        str(output_path)
    ]
    return cmd


def inject_vr180_metadata(output_path: Path):
    tmp = output_path.with_suffix(".tmp.mp4")
    output_path.rename(tmp)
    result = subprocess.run([
        "ffmpeg", "-y", "-i", str(tmp), "-c", "copy", "-map_metadata", "0",
        "-metadata:s:v:0", "spherical=true",
        "-metadata:s:v:0", "stereo_mode=left-right",
        "-metadata:s:v:0", "projection=equirectangular",
        str(output_path)
    ], capture_output=True, text=True)
    tmp.unlink(missing_ok=True)
    return result.returncode == 0


def parse_time(t: str) -> float:
    try:
        if ":" in t:
            p = t.strip().split(":")
            return float(p[0]) * 3600 + float(p[1]) * 60 + float(p[2])
        return float(t.strip())
    except (ValueError, IndexError):
        return 0


# ── Blob Helpers ─────────────────────────────────────────────────────────────

def download_from_blob(url: str, dest: Path):
    """Download a file from Vercel Blob to local path."""
    with httpx.Client(timeout=300) as client:
        with client.stream("GET", url) as r:
            r.raise_for_status()
            with open(dest, "wb") as f:
                for chunk in r.iter_bytes(chunk_size=1024 * 1024):
                    f.write(chunk)


def upload_to_blob(local_path: Path, filename: str) -> str:
    """Upload a file to Vercel Blob via REST API, return the public URL."""
    with httpx.Client(timeout=600) as client:
        with open(local_path, "rb") as f:
            resp = client.put(
                BLOB_API_URL,
                params={"pathname": filename},
                content=f,
                headers={
                    "Authorization": f"Bearer {BLOB_READ_WRITE_TOKEN}",
                    "x-api-version": "12",
                    "x-vercel-blob-access": "public",
                    "x-content-type": "video/mp4",
                    "x-cache-control-max-age": "86400",
                    "x-add-random-suffix": "0",
                },
            )
        resp.raise_for_status()
        data = resp.json()
        return data.get("url", "")


# ── Processing ───────────────────────────────────────────────────────────────

def process_video(job_id: str, blob_url: str, original_filename: str,
                  warp_mode: str, stretch_h: float, stretch_v: float,
                  crop_x: float, crop_y: float, zoom: float,
                  projection: str = "vr180", quality: str = "balanced",
                  resolution: str = "720p", _retry: int = 0):
    global active_job_count
    job = jobs[job_id]

    try:
        # Download source
        job.update({"status": "processing", "progress": 2, "stage": "Downloading video..."})
        ext = Path(original_filename).suffix.lower() or ".mp4"
        input_path = TMP_DIR / f"{job_id}_input{ext}"
        try:
            download_from_blob(blob_url, input_path)
        except Exception as e:
            raise RuntimeError(f"Download failed — check your network or try again. ({e})")

        # Validate
        job.update({"progress": 5, "stage": "Analysing video..."})
        info = get_video_info(input_path)

        file_size_mb = input_path.stat().st_size / (1024 * 1024)
        if file_size_mb > MAX_FILE_SIZE_MB:
            raise ValueError(f"File too large ({file_size_mb:.0f}MB). Max is {MAX_FILE_SIZE_MB}MB.")

        duration = info.get("duration", 0)
        if duration > MAX_DURATION_SEC:
            raise ValueError(f"Video too long ({duration:.0f}s). Max is {MAX_DURATION_SEC // 60} minutes.")

        # Process
        stem = Path(original_filename).stem
        proj_label = "vr360" if projection == "vr360" else "vr180"
        out_name = f"{stem}_{proj_label}_{warp_mode}_{quality}.mp4"
        out_path = TMP_DIR / f"{job_id}_output.mp4"
        job.update({"progress": 8, "stage": f"Encoding ({quality} quality, {resolution})...",
                     "orientation": info.get("orientation", "landscape")})

        cmd = build_ffmpeg_command(input_path, out_path, warp_mode, info,
                                   stretch_h, stretch_v, crop_x, crop_y, zoom,
                                   projection=projection, quality=quality,
                                   resolution=resolution)
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                text=True, bufsize=1)

        stderr_tail = []
        for line in proc.stderr:
            line = line.strip()
            stderr_tail.append(line)
            if len(stderr_tail) > 20:
                stderr_tail.pop(0)
            if line.startswith("out_time="):
                elapsed = parse_time(line.split("=", 1)[1])
                if duration > 0:
                    pct = min(int((elapsed / duration) * 80) + 10, 89)
                    if pct > job["progress"]:
                        job["progress"] = pct
                        job["stage"] = f"Converting... {pct}%"

        proc.wait()
        if proc.returncode != 0:
            # Better error diagnosis
            err_lines = "\n".join(stderr_tail[-5:])
            if "killed" in err_lines.lower() or proc.returncode == -9:
                raise RuntimeError("Out of memory — try a shorter video or lower quality/resolution.")
            if "no such file" in err_lines.lower() or "does not exist" in err_lines.lower():
                raise RuntimeError("Video file is corrupted or has an unsupported codec.")
            if "invalid data" in err_lines.lower():
                raise RuntimeError("Video data is invalid — the file may be damaged.")
            raise RuntimeError(f"Conversion failed (code {proc.returncode}). Try lower quality or a different video.")

        # Inject VR metadata
        job.update({"progress": 91, "stage": "Injecting VR metadata..."})
        inject_vr180_metadata(out_path)

        # Upload result to Vercel Blob
        job.update({"progress": 94, "stage": "Uploading result..."})
        output_blob_url = upload_to_blob(out_path, f"vr180/{job_id}/{out_name}")

        job.update({
            "status": "done",
            "progress": 100,
            "stage": "Done!",
            "output_filename": out_name,
            "output_url": output_blob_url,
            "projection": projection,
        })

    except Exception as e:
        # Auto-retry once on OOM or transient failures
        is_oom = "out of memory" in str(e).lower() or "killed" in str(e).lower()
        is_transient = "download failed" in str(e).lower() or "network" in str(e).lower()
        if _retry == 0 and (is_oom or is_transient):
            # Cleanup before retry
            for f in TMP_DIR.glob(f"{job_id}_*"):
                f.unlink(missing_ok=True)
            retry_quality = "fast" if is_oom and quality != "fast" else quality
            retry_res = "720p" if is_oom and resolution == "1080p" else resolution
            job.update({"progress": 0, "stage": f"Retrying with {retry_quality}/{retry_res}...", "error": None})
            process_video(job_id, blob_url, original_filename, warp_mode,
                          stretch_h, stretch_v, crop_x, crop_y, zoom,
                          projection, retry_quality, retry_res, _retry=1)
            return
        job.update({"status": "error", "error": str(e), "stage": "Error"})

    finally:
        # Cleanup temp files
        for f in TMP_DIR.glob(f"{job_id}_*"):
            f.unlink(missing_ok=True)
        if _retry == 0:
            with job_lock:
                active_job_count -= 1


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/api/process")
async def start_processing(req: ProcessRequest):
    global active_job_count

    if req.warp_mode not in ("stretch", "pad"):
        raise HTTPException(400, "warp_mode must be 'stretch' or 'pad'")

    with job_lock:
        if active_job_count >= MAX_CONCURRENT_JOBS:
            raise HTTPException(429, "Server busy — try again in a few minutes")
        active_job_count += 1

    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "progress": 0,
        "filename": req.original_filename,
        "warp_mode": req.warp_mode,
        "projection": req.projection,
        "output_filename": None,
        "output_url": None,
        "error": None,
        "stage": "Queued",
        "orientation": None,
    }

    thread = threading.Thread(
        target=process_video,
        args=(job_id, req.blob_url, req.original_filename, req.warp_mode,
              req.stretch_h, req.stretch_v, req.crop_x, req.crop_y, req.zoom,
              req.projection, req.quality, req.resolution),
        daemon=True,
    )
    thread.start()

    return {"job_id": job_id}


@app.post("/api/process-url")
async def start_url_processing(req: ProcessURLRequest):
    """Process a YouTube URL — download with yt-dlp then convert."""
    global active_job_count
    import re

    if req.warp_mode not in ("stretch", "pad"):
        raise HTTPException(400, "warp_mode must be 'stretch' or 'pad'")

    url_pattern = re.compile(r'^https?://(www\.)?(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)')
    if not url_pattern.match(req.youtube_url):
        raise HTTPException(400, "Invalid YouTube URL")

    with job_lock:
        if active_job_count >= MAX_CONCURRENT_JOBS:
            raise HTTPException(429, "Server busy — try again in a few minutes")
        active_job_count += 1

    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "progress": 0,
        "filename": req.youtube_url,
        "warp_mode": req.warp_mode,
        "projection": req.projection,
        "output_filename": None,
        "output_url": None,
        "error": None,
        "stage": "Queued",
        "orientation": None,
    }

    thread = threading.Thread(
        target=process_youtube,
        args=(job_id, req.youtube_url, req.warp_mode, req.projection,
              req.stretch_h, req.stretch_v, req.crop_x, req.crop_y, req.zoom,
              req.quality, req.resolution),
        daemon=True,
    )
    thread.start()

    return {"job_id": job_id}


def process_youtube(job_id: str, youtube_url: str, warp_mode: str,
                    projection: str, stretch_h: float, stretch_v: float,
                    crop_x: float, crop_y: float, zoom: float,
                    quality: str = "balanced", resolution: str = "720p"):
    """Download from YouTube with yt-dlp, then process with FFmpeg."""
    global active_job_count
    job = jobs[job_id]

    try:
        # Fetch metadata first
        job.update({"status": "processing", "progress": 2, "stage": "Fetching video info..."})
        meta_result = subprocess.run(
            ["yt-dlp", "--dump-json", "--no-download", "--no-playlist", youtube_url],
            capture_output=True, text=True, timeout=30
        )
        if meta_result.returncode != 0:
            err = meta_result.stderr.strip()
            if "age" in err.lower():
                raise ValueError("This video is age-restricted and cannot be downloaded.")
            if "private" in err.lower():
                raise ValueError("This video is private.")
            raise ValueError(f"Cannot access video: {err[:200]}")

        meta = json.loads(meta_result.stdout)
        title = meta.get("title", "video")
        duration = meta.get("duration", 0)
        is_live = meta.get("is_live", False)

        if is_live:
            raise ValueError("Live streams cannot be converted.")
        if duration and duration > MAX_DURATION_SEC:
            raise ValueError(f"Video too long ({duration}s). Max is {MAX_DURATION_SEC // 60} minutes.")

        # Download
        job.update({"progress": 8, "stage": f"Downloading: {title[:40]}..."})
        input_path = TMP_DIR / f"{job_id}_input.mp4"
        dl_result = subprocess.run(
            ["yt-dlp",
             "-f", "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]",
             "--merge-output-format", "mp4",
             "--no-playlist",
             "--max-filesize", f"{MAX_FILE_SIZE_MB}M",
             "-o", str(input_path),
             youtube_url],
            capture_output=True, text=True, timeout=300
        )
        if dl_result.returncode != 0 or not input_path.exists():
            raise RuntimeError(f"Download failed: {dl_result.stderr.strip()[:200]}")

        # Analyse
        job.update({"progress": 30, "stage": "Analysing video..."})
        info = get_video_info(input_path)

        # Check if source is already 360 (spherical metadata)
        is_spherical = False
        probe = subprocess.run(
            ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", str(input_path)],
            capture_output=True, text=True
        )
        if probe.returncode == 0:
            probe_data = json.loads(probe.stdout)
            for stream in probe_data.get("streams", []):
                side_data = stream.get("side_data_list", [])
                for sd in (side_data or []):
                    if isinstance(sd, dict) and sd.get("side_data_type", "").lower().find("spherical") >= 0:
                        is_spherical = True

        # Build output
        safe_title = "".join(c if c.isalnum() or c in " -_" else "" for c in title)[:50].strip() or "youtube"
        proj_label = "vr360" if projection == "vr360" else "vr180"
        out_name = f"{safe_title}_{proj_label}_{warp_mode}.mp4"
        out_path = TMP_DIR / f"{job_id}_output.mp4"

        job.update({"progress": 35, "stage": "Starting encoder...",
                     "orientation": info.get("orientation", "landscape")})

        if is_spherical and projection == "vr360":
            # Already 360 — just duplicate to SBS, no re-projection
            filter_complex = "[0:v]split[l][r];[l][r]hstack[out]"
            cmd = [
                "ffmpeg", "-y", "-i", str(input_path),
                "-filter_complex", filter_complex,
                "-map", "[out]", "-map", "0:a?",
                "-c:v", "libx264", "-preset", "ultrafast", "-crf", "23",
                "-c:a", "aac", "-b:a", "128k",
                "-movflags", "+faststart",
                "-progress", "pipe:2", "-nostats",
                str(out_path)
            ]
        else:
            cmd = build_ffmpeg_command(input_path, out_path, warp_mode, info,
                                       stretch_h, stretch_v, crop_x, crop_y, zoom,
                                       projection=projection, quality=quality,
                                       resolution=resolution)

        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                text=True, bufsize=1)
        vid_duration = info.get("duration", 0)
        for line in proc.stderr:
            line = line.strip()
            if line.startswith("out_time="):
                elapsed = parse_time(line.split("=", 1)[1])
                if vid_duration > 0:
                    pct = min(int((elapsed / vid_duration) * 50) + 40, 89)
                    if pct > job["progress"]:
                        job["progress"] = pct
                        job["stage"] = f"Converting... {pct}%"

        proc.wait()
        if proc.returncode != 0:
            raise RuntimeError("FFmpeg conversion failed.")

        job.update({"progress": 91, "stage": "Injecting VR metadata..."})
        inject_vr180_metadata(out_path)

        job.update({"progress": 94, "stage": "Uploading result..."})
        output_blob_url = upload_to_blob(out_path, f"vr180/{job_id}/{out_name}")

        job.update({
            "status": "done",
            "progress": 100,
            "stage": "Done!",
            "output_filename": out_name,
            "output_url": output_blob_url,
            "projection": projection,
        })

    except Exception as e:
        job.update({"status": "error", "error": str(e), "stage": "Error"})

    finally:
        for f in TMP_DIR.glob(f"{job_id}_*"):
            f.unlink(missing_ok=True)
        with job_lock:
            active_job_count -= 1


@app.get("/api/status/{job_id}")
async def get_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@app.get("/health")
async def health():
    r = subprocess.run(["ffmpeg", "-version"], capture_output=True)
    return {
        "status": "ok",
        "ffmpeg": r.returncode == 0,
        "active_jobs": active_job_count,
        "max_jobs": MAX_CONCURRENT_JOBS,
    }
