import { ChangeEvent, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ArrowRight, ImagePlus, Images, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import DeleteConfirmDialog from '../../../components/DeleteConfirmDialog';
import { useAdmin } from '../../../shared/context/AdminContext';
import { useStorageUpload } from '../../../shared/useStorageUpload';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export default function BannersView() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { tokenHash } = useAdmin();
  const banners = useQuery(api.banners.list, { adminTokenHash: tokenHash });
  const addBanner = useMutation(api.banners.add);
  const removeBanner = useMutation(api.banners.remove);
  const uploadFile = useStorageUpload();
  const [isUploading, setIsUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<Id<'banners'> | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    if (files.some((file) => !file.type.startsWith('image/'))) {
      setError('اختر ملفات صور فقط.');
      return;
    }
    if (files.some((file) => file.size > MAX_IMAGE_SIZE)) {
      setError('حجم كل صورة يجب ألا يتجاوز 10 ميغابايت.');
      return;
    }

    setIsUploading(true);
    setError('');
    setMessage('');
    let uploaded = 0;
    try {
      for (const file of files) {
        const storageId = await uploadFile(file);
        if (!storageId) continue;
        await addBanner({ adminTokenHash: tokenHash, imageStorageId: storageId });
        uploaded += 1;
      }
      setMessage(`تم رفع ${uploaded.toLocaleString('ar-IQ')} صورة بنجاح.`);
    } catch {
      setError('تعذر إكمال رفع الصور. تحقق من الاتصال وحاول مرة أخرى.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إدارة البنرات</h2>
          <p className="mt-1 text-sm text-gray-500">ارفع صورة واحدة أو عدة صور لتظهر بالتتابع في تطبيق المستخدم.</p>
        </div>
        <button onClick={() => navigate('/more')} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
          <ArrowRight className="h-4 w-4" /> رجوع
        </button>
      </div>

      <div className="rounded-3xl border border-dashed border-[#055C33]/30 bg-white p-6 text-center shadow-sm">
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-[#055C33]">
          <ImagePlus className="h-7 w-7" />
        </div>
        <h3 className="font-bold text-gray-900">رفع صور البنر</h3>
        <p className="mt-1 text-xs text-gray-500">يمكنك تحديد أكثر من صورة مرة واحدة — الحد الأقصى 10 MB لكل صورة.</p>
        <button disabled={isUploading} onClick={() => inputRef.current?.click()} className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#055C33] px-6 py-3 font-bold text-white transition hover:bg-[#044727] disabled:cursor-wait disabled:opacity-70">
          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Images className="h-5 w-5" />}
          {isUploading ? 'جارٍ رفع الصور...' : 'اختيار الصور'}
        </button>
      </div>

      {message && <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{message}</div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

      {banners === undefined ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-[#055C33]" /></div>
      ) : banners.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white px-6 py-14 text-center text-gray-500 shadow-sm">
          <Images className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-bold text-gray-700">لا توجد صور بنر مرفوعة بعد</p>
          <p className="mt-1 text-sm">ستبقى البنرات الحالية ظاهرة في التطبيق لحين رفع أول صورة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {banners.map((banner, index) => (
            <article key={banner.id} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div className="aspect-[2.35/1] bg-gray-100">
                {banner.imageUrl ? <img src={banner.imageUrl} alt={`بنر ${index + 1}`} className="h-full w-full object-cover" /> : null}
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-sm font-bold text-gray-700">البنر رقم {(index + 1).toLocaleString('ar-IQ')}</span>
                <button onClick={() => setDeleteId(banner.id)} className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100">
                  <Trash2 className="h-4 w-4" /> حذف
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <DeleteConfirmDialog
        open={deleteId !== null}
        title="حذف صورة البنر؟"
        description="سيتم حذف هذه الصورة من البنر في تطبيق المستخدم فوراً."
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await removeBanner({ adminTokenHash: tokenHash, id: deleteId });
          setDeleteId(null);
          setMessage('تم حذف صورة البنر بنجاح.');
        }}
      />
    </div>
  );
}
