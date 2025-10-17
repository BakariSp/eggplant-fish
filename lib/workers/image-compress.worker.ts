export type WorkerCompressOptions = {
  maxDimension?: number;
  quality?: number;
  mimeType?: string;
};

function isWorker(): boolean {
  return typeof self !== "undefined" && typeof (self as unknown as Worker).postMessage === "function";
}

async function compressInWorker(file: File, opts: WorkerCompressOptions) {
  const maxDimension = opts.maxDimension ?? 1600;
  const quality = opts.quality ?? 0.82;
  const targetMime = opts.mimeType ?? "image/webp";

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {}

  if (!bitmap) {
    // Fallback: return original
    return { ok: false } as const;
  }

  const width = bitmap.width;
  const height = bitmap.height;
  const maxSide = Math.max(width, height);
  const scale = maxSide > maxDimension ? maxDimension / maxSide : 1;
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return { ok: false } as const;
  // use high quality scaling where supported
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ctx as unknown as any).imageSmoothingEnabled = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ctx as unknown as any).imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  try { (bitmap as unknown as { close?: () => void }).close?.(); } catch {}

  const blob = await canvas.convertToBlob({ type: targetMime, quality }).catch(() => null);
  if (!blob) return { ok: false } as const;

  // If not significantly smaller, keep original
  if (blob.size >= file.size * 0.98) return { ok: false } as const;

  const ext = targetMime === "image/webp" ? "webp" : targetMime === "image/jpeg" ? "jpg" : (file.name.split(".").pop() || "img");
  const base = file.name.replace(/\.[^.]+$/, "");
  const outFile = new File([blob], `${base}.${ext}`, { type: targetMime, lastModified: Date.now() });
  return { ok: true, file: outFile } as const;
}

if (isWorker()) {
  (self as unknown as Worker).onmessage = async (e: MessageEvent) => {
    const payload = e.data as { file: File; options?: WorkerCompressOptions };
    const { file, options } = payload;
    try {
      const res = await compressInWorker(file, options || {});
      (self as unknown as Worker).postMessage(res);
    } catch {
      (self as unknown as Worker).postMessage({ ok: false });
    }
  };
}

const workerModule = null as unknown as never;
export default workerModule;


