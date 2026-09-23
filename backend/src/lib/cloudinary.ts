// src/lib/cloudinary.ts — Cloudinary upload with dicebear fallback
import { config } from '../config';

export function dicebearUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string,
  publicId: string
): Promise<string> {
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey) {
    console.warn('[Cloudinary] Not configured — returning dicebear URL');
    return dicebearUrl(publicId);
  }

  const { v2: cloudinary } = await import('cloudinary');
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: 'image', overwrite: true },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
}
