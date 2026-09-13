/** Normalise an uploaded image: downscale very large images and convert to web-friendly webp.
 *  Best-effort — sharp is an optional dependency, so if it's unavailable (or the input isn't an
 *  image), the original bytes pass through unchanged. This is the resize "pipeline" seam. */
export interface ProcessedImage {
  data: Buffer;
  contentType: string;
  ext: string;
}

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

export async function processImage(data: Buffer, contentType: string): Promise<ProcessedImage> {
  const fallback: ProcessedImage = { data, contentType, ext: EXT_BY_TYPE[contentType] ?? 'bin' };
  if (!contentType.startsWith('image/')) return fallback;
  try {
    const sharp = (await import('sharp')).default;
    const out = await sharp(data)
      .rotate() // honour EXIF orientation
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    return { data: out, contentType: 'image/webp', ext: 'webp' };
  } catch {
    return fallback;
  }
}
