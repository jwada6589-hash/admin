import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, Package, Clock, Truck, CheckCircle } from 'lucide-react';
import { Order, OrderStatus, STATUS_DETAILS } from './types';

interface OrdersListProps {
  orders: Order[];
}

export default function OrdersList({ orders }: OrdersListProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    new: orders.filter(o => o.status === 'NEW').length,
    preparing: orders.filter(o => o.status === 'PREPARING').length,
    withCourier: orders.filter(o => o.status === 'WITH_COURIER').length,
    deliveredToday: orders.filter(o => o.status === 'DELIVERED').length, // Mock today
  };

  const filters: { label: string; value: OrderStatus | 'ALL' }[] = [
    { label: 'الكل', value: 'ALL' },
    { label: 'جديد', value: 'NEW' },
    { label: 'مقبول', value: 'ACCEPTED' },
    { label: 'جاري التجهيز', value: 'PREPARING' },
    { label: 'بيد المندوب', value: 'WITH_COURIER' },
    { label: 'تم التسليم', value: 'DELIVERED' },
    { label: 'مرفوض', value: 'REJECTED' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">الطلبات</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold mb-0.5">طلبات جديدة</p>
              <p className="text-xl font-black text-gray-900">{stats.new}</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold mb-0.5">جاري التجهيز</p>
              <p className="text-xl font-black text-gray-900">{stats.preparing}</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold mb-0.5">بيد المندوب</p>
              <p className="text-xl font-black text-gray-900">{stats.withCourier}</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold mb-0.5">تم التسليم (اليوم)</p>
              <p className="text-xl font-black text-gray-900">{stats.deliveredToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="ابحث برقم الطلب، اسم الزبون، أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pr-10 pl-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#055C33] focus:border-[#055C33] transition-colors"
          />
        </div>
        
        <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
          {filters.map(filter => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
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

      {/* Orders List / Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredOrders.map(order => {
          const statusDef = STATUS_DETAILS[order.status];
          const dateStr = new Date(order.createdAt).toLocaleString('ar-IQ', {
            hour: '2-digit', minute:'2-digit', day: 'numeric', month: 'short'
          });

          return (
            <div key={order.id} className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 transition-all hover:shadow-md">
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-gray-900 text-lg">{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500">{dateStr}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${statusDef.color}`}>
                    {statusDef.label}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div>
                    <span className="text-gray-400 block text-xs">الزبون</span>
                    <span className="font-bold text-gray-800">{order.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">رقم الهاتف</span>
                    <span className="font-bold text-gray-800" dir="ltr">{order.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">عدد المنتجات</span>
                    <span className="font-bold text-gray-800">{order.items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">المبلغ الكلي</span>
                    <span className="font-bold text-[#055C33]">{order.total.toLocaleString('ar-IQ')} د.ع</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col justify-end border-t md:border-t-0 md:border-r border-gray-100 pt-3 md:pt-0 md:pr-4">
                <button
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="flex items-center justify-center md:justify-start gap-1 w-full md:w-auto text-[#055C33] bg-[#055C33]/5 hover:bg-[#055C33]/10 py-2.5 md:py-2 px-4 rounded-xl font-bold transition-colors"
                >
                  <span>عرض التفاصيل</span>
                  <ChevronLeft className="w-5 h-5 md:w-4 md:h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-3xl border border-gray-100 border-dashed">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-bold">لا توجد طلبات مطابقة للبحث أو الفلتر</p>
          </div>
        )}
      </div>
    </div>
  );
}
