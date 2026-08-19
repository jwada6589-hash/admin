export type GiftStatus = 'ACTIVE' | 'DISABLED' | 'OUT_OF_STOCK';

export interface Gift {
  id: string;
  name: string;
  description: string;
  image: string;
  requiredBalance: number;
  quantity: number;
  redemptionCount: number;
  isDisabled: boolean;
}

export type GiftRequestStatus = 'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';

export interface GiftRequest {
  id: string;
  requestNumber: string;
  customerName: string;
  phone: string;
  giftName: string;
  usedBalance: number;
  createdAt: string; // ISO String
  status: GiftRequestStatus;
}

export const GIFT_STATUS_DEF: Record<GiftStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'متاحة', color: 'bg-green-100 text-green-700 border-green-200' },
  DISABLED: { label: 'متوقفة', color: 'bg-red-100 text-red-700 border-red-200' },
  OUT_OF_STOCK: { label: 'نفدت الكمية', color: 'bg-gray-100 text-gray-500 border-gray-200' },
};

export function getGiftStatus(gift: Gift): GiftStatus {
  if (gift.isDisabled) return 'DISABLED';
  if (gift.quantity <= 0) return 'OUT_OF_STOCK';
  return 'ACTIVE';
}

export const REQUEST_STATUS_DEF: Record<GiftRequestStatus, { label: string; color: string; next?: GiftRequestStatus; nextLabel?: string }> = {
  PENDING: { label: 'قيد المراجعة', color: 'bg-orange-100 text-orange-700 border-orange-200', next: 'APPROVED', nextLabel: 'موافقة' },
  APPROVED: { label: 'تمت الموافقة', color: 'bg-blue-100 text-blue-700 border-blue-200', next: 'RECEIVED', nextLabel: 'تم الاستلام' },
  RECEIVED: { label: 'تم استلام الهدية', color: 'bg-green-100 text-green-700 border-green-200' },
  CANCELLED: { label: 'ملغي', color: 'bg-red-100 text-red-700 border-red-200' },
};
