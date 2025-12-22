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
