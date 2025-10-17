export type CompressOptions = {
  maxDimension?: number; // Max width or height in pixels
  quality?: number; // 0..1 for lossy formats
  mimeType?: string; // target mime type, default webp
  yieldIdleForLargeFiles?: boolean; // yield to main thread before heavy work
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export async function maybeCompressImage(file: File, options: CompressOptions = {}): Promise<File> {
  if (!isBrowser()) return file;
  if (!file.type.startsWith("image/")) return file;
  // Skip compression for GIF (may be animated)
  if (file.type === "image/gif") return file;

  // Optionally yield control before heavy work for large files
  if (options.yieldIdleForLargeFiles && file.size > 4 * 1024 * 1024) {
    await new Promise<void>((resolve) => {
      const hasRIC = typeof (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback === "function";
      if (hasRIC) {
        (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(() => resolve());
      }
      else setTimeout(() => resolve(), 0);
    });
  }

  const maxDimension = options.maxDimension ?? 1600; // good balance for mobile
  const quality = options.quality ?? 0.82;
  const targetMime = options.mimeType ?? "image/webp";

  // Create bitmap for efficient decode if available
  let bitmap: ImageBitmap | null = null;
  try {
    // Some browsers can directly resize in createImageBitmap; fallback to canvas below for sizing
    bitmap = await createImageBitmap(file);
  } catch {
    // Fallback path using HTMLImageElement
  }

  let width: number;
  let height: number;
  let drawImage: (ctx: CanvasRenderingContext2D) => void;

  // Parse EXIF orientation for JPEGs to correct rotation
  let orientation: number | null = null;
  if (file.type === "image/jpeg" || file.type === "image/jpg") {
    try {
      const buf = await file.arrayBuffer();
      orientation = readExifOrientation(buf) ?? null;
    } catch {}
  }

  if (bitmap) {
    width = bitmap.width;
    height = bitmap.height;
    drawImage = (ctx) => drawWithOrientation(ctx, bitmap as ImageBitmap, orientation);
  } else {
    // Fallback: load image element
    const objectUrl = URL.createObjectURL(file);
    try {
      const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = objectUrl;
      });
      width = imgEl.naturalWidth;
      height = imgEl.naturalHeight;
      drawImage = (ctx) => drawWithOrientation(ctx, imgEl, orientation);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  const maxSide = Math.max(width!, height!);
  const scale = maxSide > maxDimension ? maxDimension / maxSide : 1;

  // If small enough already, skip to save CPU
  if (scale >= 1 && file.size <= 1.25 * 1024 * 1024) {
    // <=1.25MB and dimensions already small
    return file;
  }

  const targetWidth = Math.max(1, Math.round(width! * scale));
  const targetHeight = Math.max(1, Math.round(height! * scale));

  // Use OffscreenCanvas if available, else regular canvas
  const canvas: HTMLCanvasElement | OffscreenCanvas = (typeof OffscreenCanvas !== "undefined")
    ? new OffscreenCanvas(targetWidth, targetHeight)
    : Object.assign(document.createElement("canvas"), { width: targetWidth, height: targetHeight });

  const ctx = (canvas as HTMLCanvasElement).getContext
    ? (canvas as HTMLCanvasElement).getContext("2d", { alpha: true })
    : (canvas as OffscreenCanvas).getContext("2d", { alpha: true });
  if (!ctx) return file;

  // Draw with high quality scaling
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ctx as unknown as any).imageSmoothingEnabled = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ctx as unknown as any).imageSmoothingQuality = "high";
  drawImage(ctx as CanvasRenderingContext2D);

  const blob: Blob | null = await new Promise((resolve) => {
    const maybeOffscreen = canvas as OffscreenCanvas & { convertToBlob?: (opts: { type: string; quality?: number }) => Promise<Blob> };
    if (typeof maybeOffscreen.convertToBlob === "function") {
      maybeOffscreen.convertToBlob({ type: targetMime, quality }).then(resolve).catch(() => resolve(null));
      return;
    }
    const maybeDOM = canvas as HTMLCanvasElement;
    if (maybeDOM.toBlob) {
      maybeDOM.toBlob((b: Blob | null) => resolve(b), targetMime, quality);
      return;
    }
    resolve(null);
  });

  // Cleanup bitmap
  try { (bitmap as unknown as { close?: () => void })?.close?.(); } catch {}

  if (!blob) return file;

  // If compression didn't reduce size meaningfully, keep original
  if (blob.size >= file.size * 0.98) {
    return file;
  }

  // Preserve base name, change extension to match target mime
  const ext = targetMime === "image/webp" ? "webp" : targetMime === "image/jpeg" ? "jpg" : (file.name.split(".").pop() || "img");
  const base = file.name.replace(/\.[^.]+$/, "");
  const compressedFile = new File([blob], `${base}.${ext}` , { type: targetMime, lastModified: Date.now() });
  return compressedFile;
}

// --- EXIF orientation helpers ---
function readExifOrientation(buffer: ArrayBuffer): number | undefined {
  const view = new DataView(buffer);
  // JPEG magic
  if (view.getUint16(0, false) !== 0xFFD8) return undefined;
  let offset = 2;
  const length = view.byteLength;
  while (offset < length) {
    const marker = view.getUint16(offset, false);
    offset += 2;
    if (marker === 0xFFE1) { // APP1
      const app1Length = view.getUint16(offset, false);
      const exifHeader = offset + 2;
      // "Exif\0\0"
      if (
        view.getUint32(exifHeader, false) === 0x45786966 &&
        view.getUint16(exifHeader + 4, false) === 0x0000
      ) {
        const tiffOffset = exifHeader + 6;
        const little = view.getUint16(tiffOffset, false) === 0x4949;
        const firstIFDOffset = view.getUint32(tiffOffset + 4, little);
        const ifdStart = tiffOffset + firstIFDOffset;
        const entries = view.getUint16(ifdStart, little);
        for (let i = 0; i < entries; i++) {
          const entryOffset = ifdStart + 2 + i * 12;
          const tag = view.getUint16(entryOffset, little);
          if (tag === 0x0112) { // Orientation
            const value = view.getUint16(entryOffset + 8, little);
            return value; // 1..8
          }
        }
      }
      offset += app1Length;
    } else if ((marker & 0xFF00) !== 0xFF00) {
      break;
    } else {
      offset += view.getUint16(offset, false);
    }
  }
  return undefined;
}

function drawWithOrientation(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  orientation: number | null
) {
  const canvas = ctx.canvas as HTMLCanvasElement;
  const w = canvas.width;
  const h = canvas.height;
  // Default: no transform
  if (!orientation || orientation === 1) {
    ctx.drawImage(source, 0, 0, w, h);
    return;
  }
  // Save and transform
  ctx.save();
  switch (orientation) {
    case 2: // Mirrored horizontally
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      break;
    case 3: // Rotated 180°
      ctx.translate(w, h);
      ctx.rotate(Math.PI);
      break;
    case 4: // Mirrored vertically
      ctx.translate(0, h);
      ctx.scale(1, -1);
      break;
    case 5: // Mirrored horizontally then rotated 90° CW
      ctx.rotate(0.5 * Math.PI);
      ctx.scale(1, -1);
      break;
    case 6: // Rotated 90° CW
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(0, -h);
      break;
    case 7: // Mirrored horizontally then rotated 90° CCW
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(w, -h);
      ctx.scale(-1, 1);
      break;
    case 8: // Rotated 90° CCW
      ctx.rotate(-0.5 * Math.PI);
      ctx.translate(-w, 0);
      break;
    default:
      break;
  }
  ctx.drawImage(source, 0, 0, w, h);
  ctx.restore();
}


