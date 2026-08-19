import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';

type DeleteConfirmDialogProps = {
  open: boolean;
  title?: string;
  description: string;
  itemName?: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export default function DeleteConfirmDialog({
  open,
  title = 'تأكيد الحذف',
  description,
  itemName,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setIsDeleting(false);
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const confirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setError('');
    try {
      await onConfirm();
    } catch {
      setError('تعذر إتمام الحذف. تحقق من الاتصال وحاول مرة أخرى.');
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      dir="rtl"
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 fade-in duration-200">
        <div className="h-1.5 bg-gradient-to-l from-red-700 via-red-500 to-orange-400" />
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          aria-label="إغلاق"
          className="absolute left-4 top-5 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-6 pb-6 pt-8 text-center">
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/60">
            <Trash2 className="h-9 w-9" strokeWidth={2.2} />
            <span className="absolute -left-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>

          <h3 id="delete-dialog-title" className="text-xl font-extrabold text-gray-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
          {itemName && (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3 text-sm font-bold text-red-800">
              {itemName}
            </div>
          )}
          <p className="mt-4 text-xs font-medium text-gray-400">لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.</p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="rounded-xl bg-gray-100 py-3 font-bold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-red-700 to-red-600 py-3 font-bold text-white shadow-lg shadow-red-200 transition hover:from-red-800 hover:to-red-700 disabled:cursor-wait disabled:opacity-70"
            >
              {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
              {isDeleting ? 'جارٍ الحذف...' : 'تأكيد الحذف'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
