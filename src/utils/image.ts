/**
 * Optimize Cloudinary URL by adding transformation parameters
 * @param url The original Cloudinary URL
 * @param width Optional width for resizing
 * @returns Optimized URL string
 */
export const optimizeCloudinaryUrl = (url?: string, width?: number): string => {
  if (!url || !url.includes('cloudinary.com')) return url || '';
  
  // Neu da co tham so thi khong can them nua
  if (url.includes('/upload/f_auto,q_auto')) return url;

  const transformation = width ? `f_auto,q_auto,w_${width}` : 'f_auto,q_auto';
  
  // Chen tham so vao sau chu "/upload/"
  return url.replace('/upload/', `/upload/${transformation}/`);
};
