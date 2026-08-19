export type OrderStatus = 'NEW' | 'ACCEPTED' | 'PREPARING' | 'WITH_COURIER' | 'DELIVERED' | 'REJECTED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  image: string;
  options: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  landmark: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  rejectReason?: string;
}

export const STATUS_DETAILS: Record<OrderStatus, { label: string; color: string; next?: OrderStatus; nextLabel?: string }> = {
  NEW: { label: 'طلب جديد', color: 'bg-orange-100 text-orange-700 border-orange-200', next: 'ACCEPTED', nextLabel: 'قبول الطلب' },
  ACCEPTED: { label: 'تم القبول', color: 'bg-blue-100 text-blue-700 border-blue-200', next: 'PREPARING', nextLabel: 'بدء التجهيز' },
  PREPARING: { label: 'جاري التجهيز', color: 'bg-purple-100 text-purple-700 border-purple-200', next: 'WITH_COURIER', nextLabel: 'تسليم للمندوب' },
  WITH_COURIER: { label: 'بيد المندوب', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', next: 'DELIVERED', nextLabel: 'تم التسليم' },
  DELIVERED: { label: 'تم التسليم', color: 'bg-green-100 text-green-700 border-green-200' },
  REJECTED: { label: 'تم الرفض', color: 'bg-red-100 text-red-700 border-red-200' },
};
