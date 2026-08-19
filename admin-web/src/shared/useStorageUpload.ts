import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAdmin } from './context/AdminContext';

export function useStorageUpload() {
  const { tokenHash } = useAdmin();
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  return async (file?: File | null) => {
    if (!file) return undefined;
    const uploadUrl = await generateUploadUrl({ adminTokenHash: tokenHash });
    const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
    if (!response.ok) throw new Error('فشل رفع الصورة');
    const { storageId } = await response.json();
    return storageId;
  };
}
