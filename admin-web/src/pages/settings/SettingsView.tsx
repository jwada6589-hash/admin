import { useState, useEffect } from 'react';
import { Store, MessageCircle, Moon, Sun, LogOut, CheckCircle, Save } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAdmin } from '../../shared/context/AdminContext';

export default function SettingsView({ onLogout }: { onLogout: () => void }) {
  const { tokenHash } = useAdmin();
  const remoteSettings = useQuery(api.settings.get);
  const updateSettings = useMutation(api.settings.update);
  const [settings, setSettings] = useState({ storeName: '', storeSubtitle: '', whatsappNumber: '', whatsappEnabled: false, whatsappButtonText: '', whatsappDefaultMessage: '', deliveryFee: 0, adminTheme: localStorage.getItem('adminTheme') === 'dark' ? 'dark' : 'light' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!remoteSettings) return;
    setSettings(current => ({ ...current, storeName: remoteSettings.storeName, storeSubtitle: remoteSettings.storeSubtitle, whatsappNumber: remoteSettings.whatsappNumber, whatsappEnabled: remoteSettings.whatsappEnabled, whatsappButtonText: remoteSettings.whatsappButtonText, whatsappDefaultMessage: remoteSettings.whatsappDefaultMessage, deliveryFee: remoteSettings.deliveryFee }));
  }, [remoteSettings]);

  useEffect(() => {
    // Apply theme on mount and change
    if (settings.adminTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('adminTheme', settings.adminTheme);
  }, [settings.adminTheme]);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (settings.whatsappEnabled && !settings.whatsappNumber.trim()) {
      newErrors.whatsappNumber = 'يجب إدخال رقم الواتساب عند تفعيل الخدمة';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    await updateSettings({ adminTokenHash: tokenHash, storeName: settings.storeName, storeSubtitle: settings.storeSubtitle, whatsappNumber: settings.whatsappNumber, whatsappEnabled: settings.whatsappEnabled, whatsappButtonText: settings.whatsappButtonText, whatsappDefaultMessage: settings.whatsappDefaultMessage, deliveryFee: settings.deliveryFee });
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleLogout = async () => {
    await onLogout();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">الإعدادات العامة</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">إدارة معلومات المتجر وخدمة العملاء</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-[#055C33] hover:bg-[#044727] text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Save className="w-5 h-5" />
          حفظ التعديلات
        </button>
      </div>

      {showSuccess && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-2xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="font-bold text-sm">تم حفظ الإعدادات بنجاح</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Store Information */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <Store className="w-5 h-5 text-[#055C33] dark:text-green-500" />
            معلومات المتجر الأساسية
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">اسم المتجر</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={e => setSettings(s => ({ ...s, storeName: e.target.value }))}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="مثال: ماركت المرتضى"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">النص التعريفي للمتجر</label>
              <input
                type="text"
                value={settings.storeSubtitle}
                onChange={e => setSettings(s => ({ ...s, storeSubtitle: e.target.value }))}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="مثال: كل احتياجاتك اليومية بمكان واحد"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              خدمة العملاء (WhatsApp)
            </h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.whatsappEnabled}
                onChange={() => setSettings(s => ({ ...s, whatsappEnabled: !s.whatsappEnabled }))}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
          
          <div className={`space-y-4 transition-opacity ${!settings.whatsappEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">رقم خدمة العملاء (مع رمز الدولة)</label>
              <input
                type="text"
                dir="ltr"
                value={settings.whatsappNumber}
                onChange={e => {
                  setSettings(s => ({ ...s, whatsappNumber: e.target.value }));
                  if (errors.whatsappNumber) setErrors(e => ({ ...e, whatsappNumber: '' }));
                }}
                className={`w-full border ${errors.whatsappNumber ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500'} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left`}
                placeholder="+9647712345678"
              />
              {errors.whatsappNumber && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.whatsappNumber}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">نص زر خدمة العملاء</label>
              <input
                type="text"
                value={settings.whatsappButtonText}
                onChange={e => setSettings(s => ({ ...s, whatsappButtonText: e.target.value }))}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="تواصل معنا عبر واتساب"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">رسالة خدمة العملاء الافتراضية</label>
              <textarea
                value={settings.whatsappDefaultMessage}
                onChange={e => setSettings(s => ({ ...s, whatsappDefaultMessage: e.target.value }))}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none h-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="الرسالة التي ستظهر للمستخدم في الواتساب عند الضغط على الزر..."
              />
            </div>
          </div>
        </div>

        {/* System Settings & Logout */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">إعدادات النظام</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                  {settings.adminTheme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">الوضع الليلي للإدارة</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">تغيير مظهر لوحة التحكم</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.adminTheme === 'dark'}
                  onChange={() => setSettings(s => ({ ...s, adminTheme: s.adminTheme === 'dark' ? 'light' : 'dark' }))}
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-bold w-full"
            >
              <LogOut className="w-5 h-5" />
              تسجيل الخروج من لوحة الإدارة
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
