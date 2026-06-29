import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, getCloudinaryCloudName } from '../config';

async function sha1Hex(message: string): Promise<string> {
  const buf = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest('SHA-1', buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function uploadToCloudinary(
  file: File,
  folder = 'ojt-journals'
): Promise<{ url: string; publicId: string }> {
  const cloudName = getCloudinaryCloudName();
  if (!cloudName) {
    throw new Error('Cloudinary cloud name not configured.');
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Params must be sorted alphabetically before signing (Cloudinary requirement)
  const params: Record<string, string> = { folder, timestamp };
  const paramsToSign = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');

  const signature = await sha1Hex(paramsToSign + CLOUDINARY_API_SECRET);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    let msg = `Upload failed (HTTP ${res.status})`;
    try {
      const err = await res.json() as { error?: { message?: string } };
      if (err.error?.message) msg = err.error.message;
    } catch {}
    throw new Error(msg);
  }

  const data = await res.json() as { secure_url: string; public_id: string };
  return { url: data.secure_url, publicId: data.public_id };
}
