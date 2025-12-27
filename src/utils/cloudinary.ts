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
    crop = 'fill',
    gravity = 'auto',
  } = options;

  const transformations: string[] = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  transformations.push(`q_${quality}`);
  transformations.push(`f_${format}`);
  if (crop) transformations.push(`c_${crop}`);
  if (gravity) transformations.push(`g_${gravity}`);

  const transformString = transformations.join(',');
  const cloudName = cloudinaryConfig.cloudName;

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${publicId}`;
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
  widths: number[] = [320, 640, 768, 1024, 1280]
): string {
  return widths
    .map((width) => {
      const url = getCloudinaryUrl(publicId, { width, format: 'auto', quality: 'auto' });
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
