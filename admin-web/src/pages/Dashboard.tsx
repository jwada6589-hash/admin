import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import HomeView from './HomeView';
import ProductsView from './products/ProductsView';
import OrdersView from './orders/OrdersView';
import OffersView from './offers/OffersView';
import MoreView from './more/MoreView';
import GiftsView from './more/gifts/GiftsView';
import SettingsView from './settings/SettingsView';
import { LogOut, Home, Package, ClipboardList, Tag, Menu, Settings } from 'lucide-react';

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-32">
      <div className="text-4xl mb-4 opacity-50">🚧</div>
      <h2 className="font-bold text-xl">{title}</h2>
      <p className="text-sm mt-2">قريباً...</p>
    </div>
  );
}

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: '/home', icon: Home, label: 'الرئيسية' },
    { path: '/products', icon: Package, label: 'المنتجات' },
    { path: '/orders', icon: ClipboardList, label: 'الطلبات' },
    { path: '/offers', icon: Tag, label: 'العروض' },
    { path: '/more', icon: Menu, label: 'المزيد' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white px-4 py-4 sticky top-0 z-20 shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#055C33] text-white rounded-lg flex items-center justify-center font-bold text-sm">
              م
            </div>
            <h1 className="font-bold text-gray-900 text-lg">لوحة الإدارة</h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = currentPath === item.path || (currentPath === '/' && item.path === '/home');
              const Icon = item.icon;
              return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors font-bold text-sm ${isActive ? 'bg-[#055C33]/10 text-[#055C33]' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg font-bold text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-8 pt-6 px-4 md:px-8 max-w-7xl mx-auto w-full overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomeView />} />
          <Route path="/products/*" element={<ProductsView />} />
          <Route path="/orders/*" element={<OrdersView />} />
          <Route path="/offers/*" element={<OffersView />} />
          <Route path="/more" element={<MoreView />} />
          <Route path="/more/gifts/*" element={<GiftsView />} />
          <Route path="/settings/*" element={<SettingsView onLogout={onLogout} />} />
        </Routes>
      </main>

      {/* Bottom Nav for Mobile */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
