import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Phone, User, Package, AlertTriangle, AlertCircle } from 'lucide-react';
import { Order, OrderStatus, STATUS_DETAILS } from './types';

interface OrderDetailProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus, rejectReason?: string) => Promise<void>;
}

export default function OrderDetail({ orders, onUpdateStatus }: OrderDetailProps) {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const order = orders.find(o => o.id === orderId);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isConfirmDeliverModalOpen, setIsConfirmDeliverModalOpen] = useState(false);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 mb-4">الطلب غير موجود</p>
        <button onClick={() => navigate('/orders')} className="text-[#055C33] font-bold">العودة للطلبات</button>
      </div>
    );
  }

  const statusDef = STATUS_DETAILS[order.status];
  const dateStr = new Date(order.createdAt).toLocaleString('ar-IQ', {
    hour: '2-digit', minute:'2-digit', day: 'numeric', month: 'long', year: 'numeric'
  });

  const handleNextStep = async () => {
    if (!statusDef.next) return;
    if (statusDef.next === 'DELIVERED') {
      setIsConfirmDeliverModalOpen(true);
    } else {
      await onUpdateStatus(order.id, statusDef.next);
    }
  };

  const confirmDeliver = async () => {
    await onUpdateStatus(order.id, 'DELIVERED');
    setIsConfirmDeliverModalOpen(false);
  };

  const handleReject = async () => {
    await onUpdateStatus(order.id, 'REJECTED', rejectReason);
    setIsRejectModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/orders')}
          className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-gray-900">الطلب {order.orderNumber}</h2>
          <p className="text-gray-500 text-sm mt-1">{dateStr}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main details) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Customer Details Card */}
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#055C33]" />
              بيانات الزبون
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">الاسم</p>
                <p className="font-bold text-gray-900">{order.customerName}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">رقم الهاتف</p>
                <p className="font-bold text-gray-900" dir="ltr">{order.phone}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl md:col-span-2">
                <p className="text-xs text-gray-500 mb-1">العنوان</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-900 leading-relaxed">{order.address}</p>
                    {order.landmark && (
                      <p className="text-sm text-gray-500 mt-1">أقرب نقطة دالة: {order.landmark}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items Card */}
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#055C33]" />
              محتوى الطلب
            </h3>
            
            <div className="space-y-4">
              {order.items.map(item => (
                <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl border border-gray-100 shrink-0">
                    {item.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-gray-900 truncate pr-2">{item.productName}</h4>
                      <span className="font-bold text-gray-900 shrink-0 whitespace-nowrap">
                        {item.total.toLocaleString('ar-IQ')} د.ع
                      </span>
                    </div>
                    {item.options && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.options}</p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-lg">الكمية: {item.quantity}</span>
                      <span className="text-xs text-gray-400">سعر الوحدة: {item.unitPrice.toLocaleString('ar-IQ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Status & Summary) */}
        <div className="space-y-6">
          
          {/* Status Actions Card */}
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">حالة الطلب</h3>
            
            <div className={`p-4 rounded-2xl border mb-6 flex items-center justify-center text-center ${statusDef.color}`}>
              <span className="font-black text-lg">{statusDef.label}</span>
            </div>

            {order.status === 'REJECTED' && order.rejectReason && (
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-6 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-red-500 font-bold mb-1">سبب الرفض</p>
                  <p className="text-sm text-red-700">{order.rejectReason}</p>
                </div>
              </div>
            )}

            {(order.status !== 'DELIVERED' && order.status !== 'REJECTED') && (
              <div className="space-y-3">
                {statusDef.next && (
                  <button 
                    onClick={handleNextStep}
                    className="w-full bg-[#055C33] hover:bg-[#044727] text-white font-bold py-3.5 rounded-2xl transition-colors shadow-sm"
                  >
                    تغيير إلى: {statusDef.nextLabel}
                  </button>
                )}
                
                <button 
                  onClick={() => setIsRejectModalOpen(true)}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3.5 rounded-2xl transition-colors"
                >
                  رفض الطلب
                </button>
              </div>
            )}
            
            {(order.status === 'DELIVERED' || order.status === 'REJECTED') && (
              <p className="text-center text-gray-400 text-sm italic">لا يمكن تغيير حالة هذا الطلب.</p>
            )}
          </div>

          {/* Payment Summary Card */}
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">الفاتورة</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-gray-600">
                <span>مجموع المنتجات</span>
                <span className="font-bold">{order.subtotal.toLocaleString('ar-IQ')} د.ع</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>أجرة التوصيل</span>
                <span className="font-bold">{order.deliveryFee.toLocaleString('ar-IQ')} د.ع</span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="font-black text-gray-900">المبلغ النهائي</span>
                <span className="font-black text-xl text-[#055C33]">{order.total.toLocaleString('ar-IQ')} د.ع</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-xl p-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-xl mb-2 text-center text-gray-900">رفض الطلب</h3>
            <p className="text-gray-500 text-sm mb-6 text-center">لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.</p>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">سبب الرفض (اختياري)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none h-24 text-sm"
                placeholder="مثال: المنتج غير متوفر، عنوان غير واضح..."
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsRejectModalOpen(false)} 
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                تراجع
              </button>
              <button 
                onClick={handleReject} 
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Deliver Modal */}
      {isConfirmDeliverModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-gray-900">تأكيد التسليم</h3>
            <p className="text-gray-600 text-sm mb-2 leading-relaxed">
              هل أنت متأكد من تسجيل الطلب كتم التسليم؟
            </p>
            <div className="bg-orange-50 text-orange-700 text-xs p-3 rounded-xl mb-6 font-semibold">
              سيتم لاحقاً احتساب الاسترجاع النقدي (1%) إلى محفظة الزبون تلقائياً عند تغيير الحالة.
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsConfirmDeliverModalOpen(false)} 
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={confirmDeliver} 
                className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-sm"
              >
                نعم، تم التسليم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
