export type OfferStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DISABLED';

export interface Offer {
  id: string;
  productId: string;
  offerPrice: number;
  startDate: string; // ISO String
  endDate: string; // ISO String
  isDisabled: boolean;
}

export const OFFER_STATUS_DEF: Record<OfferStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'فعال', color: 'bg-green-100 text-green-700 border-green-200' },
  SCHEDULED: { label: 'مجدول', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  EXPIRED: { label: 'منتهي', color: 'bg-gray-100 text-gray-500 border-gray-200' },
  DISABLED: { label: 'متوقف', color: 'bg-red-100 text-red-700 border-red-200' },
};

export function getOfferStatus(offer: Offer): OfferStatus {
  if (offer.isDisabled) return 'DISABLED';
  
  const now = new Date().getTime();
  const start = new Date(offer.startDate).getTime();
  const end = new Date(offer.endDate).getTime();
  
  if (end < now) return 'EXPIRED';
  if (start > now) return 'SCHEDULED';
  return 'ACTIVE';
}
