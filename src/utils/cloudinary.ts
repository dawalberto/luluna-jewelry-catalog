import { cloudinaryConfig } from '../config/env';

/**
 * Cloudinary image transformation options
 */
export interface CloudinaryOptions {
  width?: number;
  height?: number;
  quality?: number | 'auto';
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  gravity?: 'auto' | 'face' | 'center';
}

const DEFAULT_RESPONSIVE_WIDTHS = [400, 800, 1200];

function isProbablyCloudinaryUrl(value: string): boolean {
  return value.includes('res.cloudinary.com') && value.includes('/image/upload/');
}

function stripKnownImageExtension(publicId: string): string {
  const idx = publicId.lastIndexOf('.');
  if (idx === -1) return publicId;
  const ext = publicId.slice(idx + 1).toLowerCase();
  const isKnown = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(ext);
  return isKnown ? publicId.slice(0, idx) : publicId;
}

/**
 * Normalize stored product image reference into a Cloudinary publicId.
 * The app stores `secure_url` strings today, but callers may also provide raw public IDs.
 */
function normalizeToPublicId(source: string): string {
  if (!source) return source;
  if (!source.startsWith('http')) return source;
  if (!isProbablyCloudinaryUrl(source)) return source;

  try {
    const url = new URL(source);
    const parts = url.pathname.split('/').filter(Boolean);
    const uploadIdx = parts.indexOf('upload');
    if (uploadIdx === -1) return source;

    const afterUpload = parts.slice(uploadIdx + 1);
    const versionIdx = afterUpload.findIndex((p) => /^v\d+$/.test(p));
    const publicIdParts = versionIdx >= 0 ? afterUpload.slice(versionIdx + 1) : afterUpload;
    const publicIdWithExt = publicIdParts.join('/');
    return stripKnownImageExtension(publicIdWithExt);
  } catch {
    return source;
  }
}

/**
 * Generate optimized Cloudinary URL
 */
export function getCloudinaryUrl(
  publicId: string,
  options: CloudinaryOptions = {}
): string {
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop,
    gravity,
  } = options;

  const cloudName = cloudinaryConfig.cloudName;
  if (!cloudName) {
    // Avoid breaking rendering if env is missing in some contexts.
    return publicId;
  }

  const normalizedPublicId = normalizeToPublicId(publicId);
  // If this isn't a Cloudinary reference, don't try to build a Cloudinary URL.
  if (normalizedPublicId.startsWith('http') && !isProbablyCloudinaryUrl(publicId)) {
    return publicId;
  }

  const transformations: string[] = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  transformations.push(`q_${quality}`);
  transformations.push(`f_${format}`);
  if (crop) transformations.push(`c_${crop}`);
  if (gravity) transformations.push(`g_${gravity}`);

  const transformString = transformations.join(',');

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${normalizedPublicId}`;
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicId(url: string): string {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return match ? match[1] : url;
}

/**
 * Generate responsive image srcset
 */
export function getResponsiveSrcSet(
  publicId: string,
  widths: number[] = DEFAULT_RESPONSIVE_WIDTHS,
  options: Omit<CloudinaryOptions, 'width'> = {}
): string {
  return widths
    .map((width) => {
      const url = getCloudinaryUrl(publicId, { ...options, width, format: 'auto', quality: 'auto' });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Get placeholder blur URL (low quality, small size)
 */
export function getPlaceholderUrl(publicId: string): string {
  return getCloudinaryUrl(publicId, {
    width: 50,
    quality: 30,
    format: 'auto',
  });
}

/**
 * Delete image from Cloudinary
 * Note: This requires backend implementation with API Secret
 * Cloudinary Admin API cannot be called from client-side for security
 * This function returns a promise that resolves when deletion should be handled
 */
export async function deleteCloudinaryImage(url: string): Promise<void> {
  const publicId = extractPublicId(url);
  
  console.warn(
    '⚠️ Cloudinary deletion requires backend implementation.',
    '\nPublic ID to delete:', publicId,
    '\nFor now, you need to manually delete from Cloudinary dashboard or implement a backend endpoint.'
  );
  
  // In a production app, you would call your backend endpoint here:
  // await fetch('/api/cloudinary/delete', {
  //   method: 'DELETE',
  //   body: JSON.stringify({ publicId }),
  // });
  
  // For now, we just log the warning
  return Promise.resolve();
}

/**
 * Delete multiple images from Cloudinary
 */
export async function deleteCloudinaryImages(urls: string[]): Promise<void> {
  const publicIds = urls.map(url => extractPublicId(url));
  
  console.warn(
    '⚠️ Cloudinary deletion requires backend implementation.',
    '\nPublic IDs to delete:', publicIds,
    '\nFor now, you need to manually delete from Cloudinary dashboard or implement a backend endpoint.'
  );
  
  return Promise.resolve();
}
