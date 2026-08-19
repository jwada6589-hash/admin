import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { AlertTriangle, ArrowRight, Check, Clock3, Loader2, UserRoundX, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { useAdmin } from '../../../shared/context/AdminContext';

const statusLabels = {
  PENDING: { label: 'قيد المراجعة', style: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: 'تمت الموافقة', style: 'bg-blue-50 text-blue-700 border-blue-200' },
  REJECTED: { label: 'مرفوض', style: 'bg-red-50 text-red-700 border-red-200' },
  COMPLETED: { label: 'اكتمل الحذف', style: 'bg-green-50 text-green-700 border-green-200' },
} as const;

export default function AccountDeletionRequestsView() {
  const navigate = useNavigate();
  const { tokenHash } = useAdmin();
  const requests = useQuery(api.accountDeletionRequests.adminList, { adminTokenHash: tokenHash });
  const approve = useMutation(api.accountDeletionRequests.approve);
  const reject = useMutation(api.accountDeletionRequests.reject);
  const [approveId, setApproveId] = useState<Id<'accountDeletionRequests'> | null>(null);
  const [processingId, setProcessingId] = useState<Id<'accountDeletionRequests'> | null>(null);
  const [error, setError] = useState('');

  const confirmApproval = async () => {
    if (!approveId) return;
    setProcessingId(approveId);
    setError('');
    try {
      await approve({ adminTokenHash: tokenHash, requestId: approveId });
      setApproveId(null);
    } catch {
      setError('تعذر تنفيذ الموافقة. تحقق من الاتصال وحاول مرة أخرى.');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectRequest = async (requestId: Id<'accountDeletionRequests'>) => {
    setProcessingId(requestId);
    setError('');
    try {
      await reject({ adminTokenHash: tokenHash, requestId });
    } catch {
      setError('تعذر رفض الطلب. تحقق من الاتصال وحاول مرة أخرى.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">طلبات حذف الحساب</h2>
          <p className="mt-1 text-sm text-gray-500">الموافقة تنفذ تعطيل الحساب وحذف بياناته الشخصية من Convex.</p>
        </div>
        <button onClick={() => navigate('/more')} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
          <ArrowRight className="h-4 w-4" /> رجوع
        </button>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

      {requests === undefined ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-[#055C33]" /></div>
      ) : requests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-16 text-center text-gray-400">
          <UserRoundX className="mx-auto mb-3 h-11 w-11 opacity-30" />
          <p className="font-bold">لا توجد طلبات حذف حساب</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {requests.map((request) => {
            const status = statusLabels[request.status];
            const isProcessing = processingId === request.id;
            return (
              <article key={request.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="font-black text-gray-900">{request.userName}</h3>
                    <p className="mt-1 text-sm font-bold text-gray-600" dir="ltr">{request.phone || '—'}</p>
                  </div>
                  <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${status.style}`}>{status.label}</span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <Clock3 className="h-4 w-4" />
                  <span>تاريخ الطلب: {new Date(request.requestedAt).toLocaleString('ar-IQ')}</span>
                </div>
                {request.status === 'PENDING' && (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button disabled={isProcessing} onClick={() => setApproveId(request.id)} className="flex items-center justify-center gap-2 rounded-xl bg-[#055C33] py-3 text-sm font-bold text-white hover:bg-[#044727] disabled:opacity-60">
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} موافقة
                    </button>
                    <button disabled={isProcessing} onClick={() => rejectRequest(request.id)} className="flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-3 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-60">
                      <X className="h-4 w-4" /> رفض
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {approveId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600"><AlertTriangle className="h-8 w-8" /></div>
            <h3 className="text-xl font-black text-gray-900">الموافقة على حذف الحساب؟</h3>
            <p className="mt-2 text-sm leading-6 text-gray-500">سيتم تعطيل تسجيل الدخول وحذف البيانات الشخصية من Backend. لا يمكن التراجع بعد اكتمال العملية.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button disabled={processingId !== null} onClick={() => setApproveId(null)} className="rounded-xl bg-gray-100 py-3 font-bold text-gray-700">إلغاء</button>
              <button disabled={processingId !== null} onClick={confirmApproval} className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-bold text-white disabled:opacity-60">
                {processingId ? <Loader2 className="h-5 w-5 animate-spin" /> : null} تأكيد الموافقة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
