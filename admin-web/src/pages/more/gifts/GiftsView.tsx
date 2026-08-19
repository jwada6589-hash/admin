import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import GiftsList from './GiftsList';
import GiftRequestsList from './GiftRequestsList';
import { ArrowRight, Gift as GiftIcon, ClipboardList } from 'lucide-react';

export default function GiftsView() {
  const navigate = useNavigate();
  const location = useLocation();

  const isRequestsTab = location.pathname.includes('/requests');

  return (
    <div className="space-y-6 pb-20 md:pb-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/more')}
            className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">الهدايا مقابل الرصيد</h2>
            <p className="text-gray-500 text-sm">إدارة هدايا المحفظة وطلبات الاستبدال</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl p-1 border border-gray-200 w-full md:w-auto self-start">
        <button
          onClick={() => navigate('/more/gifts')}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-colors ${
            !isRequestsTab ? 'bg-[#055C33] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <GiftIcon className="w-4 h-4" />
          الهدايا
        </button>
        <button
          onClick={() => navigate('/more/gifts/requests')}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-colors ${
            isRequestsTab ? 'bg-[#055C33] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          طلبات الاستبدال
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        <Routes>
          <Route path="/" element={<GiftsList />} />
          <Route path="/requests" element={<GiftRequestsList />} />
        </Routes>
      </div>
    </div>
  );
}
