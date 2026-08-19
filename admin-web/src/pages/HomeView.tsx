import { 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  ShoppingBag, 
  LayoutGrid, 
  Store, 
  Percent 
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAdmin } from '../shared/context/AdminContext';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  NEW: { label: 'طلب جديد', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  ACCEPTED: { label: 'تم قبول الطلب', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  PREPARING: { label: 'جاري التجهيز', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  WITH_COURIER: { label: 'بيد المندوب', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  DELIVERED: { label: 'تم التسليم', color: 'bg-green-100 text-green-700 border-green-200' },
  REJECTED: { label: 'تم الرفض', color: 'bg-red-100 text-red-700 border-red-200' },
};

export default function HomeView() {
  const { tokenHash } = useAdmin();
  const dashboard = useQuery(api.admin.dashboard, { adminTokenHash: tokenHash });
  const stats = dashboard?.stats ?? { newOrders: 0, preparing: 0, withCourier: 0, delivered: 0, products: 0, categories: 0, branches: 0, activeOffers: 0 };
  const recentOrders = dashboard?.recentOrders ?? [];
  const statCards = [
    { title: 'طلبات جديدة', value: stats.newOrders, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-100' },
    { title: 'جاري التجهيز', value: stats.preparing, icon: Package, color: 'text-purple-500', bg: 'bg-purple-100' },
    { title: 'بيد المندوب', value: stats.withCourier, icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-100' },
    { title: 'تم التسليم', value: stats.delivered, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
    { title: 'المنتجات', value: stats.products, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-100' },
    { title: 'الأقسام', value: stats.categories, icon: LayoutGrid, color: 'text-teal-500', bg: 'bg-teal-100' },
    { title: 'الفروع', value: stats.branches, icon: Store, color: 'text-pink-500', bg: 'bg-pink-100' },
    { title: 'عروض فعالة', value: stats.activeOffers, icon: Percent, color: 'text-rose-500', bg: 'bg-rose-100' },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      
      {/* Header section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">نظرة عامة</h2>
        <p className="text-gray-500 text-sm mt-1">إحصائيات وأداء المتجر اليوم</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between items-start transition-transform hover:-translate-y-1">
              <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-gray-500 text-xs md:text-sm font-semibold mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString('ar-IQ')}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-lg text-gray-900">أحدث الطلبات</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">رقم الطلب</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">الزبون</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">المبلغ</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">الحالة</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">الوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((order: any, idx: number) => {
                const status = STATUS_MAP[order.status] || STATUS_MAP.NEW;
                return (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 font-semibold text-gray-900 whitespace-nowrap">
                      {order.id}
                    </td>
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                      {order.customer}
                    </td>
                    <td className="px-4 py-4 font-bold text-[#055C33] whitespace-nowrap">
                      {order.total.toLocaleString('ar-IQ')} د.ع
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleString('ar-IQ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {recentOrders.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              لا توجد طلبات حديثة
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
