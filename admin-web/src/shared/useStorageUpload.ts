import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAdmin } from './context/AdminContext';

type ImageUploadOptions = {
  maxDimension?: number;
  quality?: number;
  targetBytes?: number;
};

const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('تعذر ضغط الصورة. جرّب صورة JPG أو PNG أخرى.')),
      'image/webp',
      quality,
    );
  });
}

/**
 * تصغير الصور الكبيرة وتحويلها إلى WebP قبل رفعها إلى Convex.
 * لا تُرسل الصورة الأصلية الكبيرة إلى الشبكة، ولا تغيّر أبعاد العرض داخل الواجهة.
 */
export async function optimizeImageForUpload(file: File, options: ImageUploadOptions = {}) {
  if (!file.type.startsWith('image/')) {
    throw new Error('الملف المختار ليس صورة.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('حجم الصورة الأصلية يجب ألا يتجاوز 20 ميغابايت.');
  }

  const maxDimension = options.maxDimension ?? 1200;
  const preferredQuality = options.quality ?? 0.82;
  const targetBytes = options.targetBytes ?? 350 * 1024;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP.');
  }

  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('تعذر تجهيز الصورة للرفع.');
    context.drawImage(bitmap, 0, 0, width, height);

    const qualities = [preferredQuality, 0.74, 0.66];
    let optimized = await canvasToBlob(canvas, qualities[0]);
    for (const quality of qualities.slice(1)) {
      if (optimized.size <= targetBytes) break;
      const candidate = await canvasToBlob(canvas, quality);
      if (candidate.size < optimized.size) optimized = candidate;
    }

    // لا نستبدل ملفاً صغيراً أصلاً بنسخة أكبر إذا لم نحتج إلى تصغير أبعاده.
    if (scale === 1 && optimized.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([optimized], `${baseName}.webp`, {
      type: 'image/webp',
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}

export function useStorageUpload() {
  const { tokenHash } = useAdmin();
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  return async (file?: File | null, options?: ImageUploadOptions) => {
    if (!file) return undefined;
    const optimizedFile = await optimizeImageForUpload(file, options);
    const uploadUrl = await generateUploadUrl({ adminTokenHash: tokenHash });
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': optimizedFile.type },
      body: optimizedFile,
    });
    if (!response.ok) throw new Error('فشل رفع الصورة');
    const { storageId } = await response.json();
    return storageId;
  };
}
