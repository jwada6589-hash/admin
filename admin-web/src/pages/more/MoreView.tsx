import { useState } from 'react';
import { Truck, Edit2, X, CheckCircle, Gift, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAdmin } from '../../shared/context/AdminContext';

export default function MoreView() {
  const navigate = useNavigate();
  const { tokenHash } = useAdmin();
  const settings = useQuery(api.settings.get);
  const updateSettings = useMutation(api.settings.update);
  const deliveryFee = settings?.deliveryFee ?? 0;
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editValue, setEditValue] = useState(deliveryFee.toString());
  const [error, setError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleOpenEdit = () => {
    setEditValue(deliveryFee.toString());
    setError('');
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    // Validation
    if (editValue.trim() === '') {
      setError('لا يمكن ترك الحقل فارغاً');
      return;
    }
    const numValue = Number(editValue);
    if (isNaN(numValue)) {
      setError('يجب إدخال أرقام فقط');
      return;
    }
    if (numValue < 0) {
      setError('لا يمكن أن تكون أجرة التوصيل سالبة');
      return;
    }
    if (!Number.isInteger(numValue)) {
      setError('يجب إدخال رقم صحيح');
      return;
    }
    
    // Save
    if (!settings) return;
    await updateSettings({ adminTokenHash: tokenHash, storeName: settings.storeName, storeSubtitle: settings.storeSubtitle, whatsappNumber: settings.whatsappNumber, whatsappEnabled: settings.whatsappEnabled, whatsappButtonText: settings.whatsappButtonText, whatsappDefaultMessage: settings.whatsappDefaultMessage, deliveryFee: numValue });
    setIsEditModalOpen(false);
    
    // Show success message
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">إعدادات الطلب والتوصيل</h2>
        <p className="text-gray-500 text-sm">إدارة الإعدادات العامة للمتجر</p>
      </div>

      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="font-bold text-sm">تم تحديث أجرة التوصيل بنجاح</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Delivery Fee Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-full transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">أجرة التوصيل</h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">تكلفة التوصيل الثابتة لجميع الطلبات الجديدة</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between mb-4 border border-gray-100">
            <span className="text-sm font-bold text-gray-600">القيمة الحالية</span>
            <span className="text-xl font-black text-[#055C33]">
              {deliveryFee === 0 ? 'مجاني' : `${deliveryFee.toLocaleString('ar-IQ')} د.ع`}
            </span>
          </div>

          <button 
            onClick={handleOpenEdit}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Edit2 className="w-4 h-4" />
            تعديل
          </button>
        </div>

        {/* Gifts Management Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-full transition-all hover:shadow-md cursor-pointer" onClick={() => navigate('/more/gifts')}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">الهدايا مقابل الرصيد</h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">إدارة هدايا المحفظة وطلبات الاستبدال</p>
            </div>
          </div>
          
          <div className="mt-auto">
            <button className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-sm">
              الدخول للوحة الهدايا
            </button>
          </div>
        </div>

        {/* General Settings Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-full transition-all hover:shadow-md cursor-pointer" onClick={() => navigate('/settings')}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">الإعدادات العامة</h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">تخصيص اسم المتجر، خدمة العملاء وتسجيل الخروج</p>
            </div>
          </div>
          
          <div className="mt-auto">
            <button className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-sm">
              الذهاب للإعدادات
            </button>
          </div>
        </div>
        
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-gray-900">تعديل أجرة التوصيل</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">أجرة التوصيل الجديدة (د.ع)</label>
              <input
                type="number"
                value={editValue}
                onChange={(e) => {
                  setEditValue(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
                className={`w-full border rounded-xl px-4 py-3 font-bold text-lg focus:outline-none focus:ring-1 transition-colors ${
                  error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-[#055C33] focus:ring-[#055C33]'
                }`}
                placeholder="مثال: 3000"
                min="0"
                step="250"
              />
              {error && <p className="text-red-500 text-xs font-bold mt-2 animate-in slide-in-from-top-1">{error}</p>}
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-blue-700 text-xs leading-relaxed font-semibold">
                  ملاحظة: ضع القيمة 0 إذا كنت تريد جعل التوصيل مجانياً. تغيير هذه القيمة لن يؤثر على الطلبات القديمة التي تم تسجيلها مسبقاً.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSave} 
                className="flex-1 py-3 bg-[#055C33] text-white font-bold rounded-xl hover:bg-[#044727] transition-colors shadow-sm"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
