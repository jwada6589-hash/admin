import { Link, useLocation } from 'react-router-dom';
import { Home, Package, ClipboardList, Tag, Menu } from 'lucide-react';

export default function BottomNav() {
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex justify-between items-center z-50 safe-area-pb">
      {navItems.map((item) => {
        const isActive = currentPath === item.path || (currentPath === '/' && item.path === '/home');
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.path} 
            to={item.path}
            className="flex flex-col items-center flex-1 py-1"
          >
            <div className={`p-1.5 rounded-full mb-1 transition-colors ${isActive ? 'bg-[#055C33]/10 text-[#055C33]' : 'text-gray-400'}`}>
              <Icon className={`w-6 h-6 stroke-[2] ${isActive ? 'fill-current' : 'fill-none'}`} />
            </div>
            <span className={`text-[10px] font-bold ${isActive ? 'text-[#055C33]' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
