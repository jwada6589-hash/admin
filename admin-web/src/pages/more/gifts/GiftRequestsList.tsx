import { useState } from 'react';
import { Search, X, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { GiftRequest, GiftRequestStatus, REQUEST_STATUS_DEF } from './types';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useAdmin } from '../../../shared/context/AdminContext';

export default function GiftRequestsList() {
  const { tokenHash } = useAdmin();
  const requests = (useQuery(api.gifts.adminListRedemptions, { adminTokenHash: tokenHash }) ?? []) as GiftRequest[];
  const updateStatus = useMutation(api.gifts.updateRedemptionStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GiftRequestStatus | 'ALL'>('ALL');

  const [isCancelModalOpen, setIsCancelModalOpen] = useState<string | null>(null);

  const filteredRequests = requests.filter(r => {
    const matchesSearch = 
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleNextStep = async (reqId: string, currentStatus: GiftRequestStatus) => {
    const statusDef = REQUEST_STATUS_DEF[currentStatus];
    if (!statusDef.next) return;

    await updateStatus({ adminTokenHash: tokenHash, redemptionId: reqId as any, status: statusDef.next! });
  };

  const handleCancel = async () => {
    if (isCancelModalOpen) {
      await updateStatus({ adminTokenHash: tokenHash, redemptionId: isCancelModalOpen as any, status: 'CANCELLED' });
      setIsCancelModalOpen(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="relative md:w-96">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="بحث عن مستخدم أو رقم هاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pr-10 pl-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#055C33] focus:border-[#055C33] sm:text-sm transition-colors"
          />
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
          {[{ label: 'الكل', value: 'ALL' }, ...Object.entries(REQUEST_STATUS_DEF).map(([k, v]) => ({ label: v.label, value: k }))].map(filter => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors border ${
                statusFilter === filter.value 
                  ? 'bg-[#055C33] text-white border-[#055C33]' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRequests.map(req => {
          const statusDef = REQUEST_STATUS_DEF[req.status];
          const dateStr = new Date(req.createdAt).toLocaleString('ar-IQ', {
            hour: '2-digit', minute:'2-digit', day: 'numeric', month: 'short'
          });

          return (
            <div key={req.id} className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col gap-4 transition-all hover:shadow-md">
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-black text-gray-900 text-lg">{req.requestNumber}</h3>
                  <p className="text-sm text-gray-500">{dateStr}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${statusDef.color}`}>
                  {statusDef.label}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <span className="text-gray-400 block text-xs">الزبون</span>
                  <span className="font-bold text-gray-800">{req.customerName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">رقم الهاتف</span>
                  <span className="font-bold text-gray-800" dir="ltr">{req.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">الهدية المطلوبة</span>
                  <span className="font-bold text-gray-800">{req.giftName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">الرصيد المخصوم</span>
                  <span className="font-black text-rose-600">{req.usedBalance.toLocaleString('ar-IQ')} د.ع</span>
                </div>
              </div>

              {/* Actions */}
              {(req.status === 'PENDING' || req.status === 'APPROVED') && (
                <div className="flex gap-2 pt-3 border-t border-gray-100 mt-1">
                  {statusDef.next && (
                    <button 
                      onClick={() => handleNextStep(req.id, req.status)}
                      className="flex-1 bg-[#055C33] hover:bg-[#044727] text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm"
                    >
                      {statusDef.nextLabel}
                    </button>
                  )}
                  <button 
                    onClick={() => setIsCancelModalOpen(req.id)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-xl text-sm transition-colors border border-red-100"
                  >
                    إلغاء الطلب
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredRequests.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-3xl border border-gray-100 border-dashed">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-bold">لا توجد طلبات استبدال مطابقة</p>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-xl mb-2 text-gray-900">تأكيد الإلغاء</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              هل أنت متأكد من إلغاء طلب الاستبدال هذا؟
              <br />
              <span className="font-bold text-gray-700 mt-2 block text-xs">ملاحظة مستقبلية: سيقوم النظام لاحقاً بإعادة الرصيد للمستخدم بشكل تلقائي وآمن من خلال الـ Backend.</span>
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsCancelModalOpen(null)} 
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                تراجع
              </button>
              <button 
                onClick={handleCancel} 
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm"
              >
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
