import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Tag, Calendar, X, Power, PowerOff } from 'lucide-react';
import { Offer, OfferStatus, OFFER_STATUS_DEF, getOfferStatus } from './types';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAdmin } from '../../shared/context/AdminContext';
import DeleteConfirmDialog from '../../components/DeleteConfirmDialog';

// Helper to format date for datetime-local input
const toDatetimeLocal = (isoString: string) => {
  const d = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function OffersView() {
  const { tokenHash } = useAdmin();
  const offers = (useQuery(api.admin.offers, { adminTokenHash: tokenHash }) ?? []) as Offer[];
  const products = useQuery(api.admin.products, { adminTokenHash: tokenHash }) ?? [];
  const categories = useQuery(api.admin.categories, { adminTokenHash: tokenHash }) ?? [];
  const branches = useQuery(api.admin.subcategories, { adminTokenHash: tokenHash }) ?? [];
  const saveOfferMutation = useMutation(api.admin.saveOffer);
  const deleteOffer = useMutation(api.admin.deleteOffer);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OfferStatus | 'ALL'>('ALL');
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<string | null>(null);

  // Form state
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [selCategoryId, setSelCategoryId] = useState('');
  const [selBranchId, setSelBranchId] = useState('');
  const [selProductId, setSelProductId] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDisabled, setIsDisabled] = useState(false);

  // Derived filtered options for the form
  const branchesForCat = branches.filter(b => b.categoryId === selCategoryId);
  const productsForBranch = products.filter(p => p.branchId === selBranchId);
  const selectedProduct = products.find(p => p.id === selProductId);

  // Filters logic
  const enrichedOffers = offers.map(offer => {
    const product = products.find(p => p.id === offer.productId);
    const status = getOfferStatus(offer);
    const originalPrice = product?.price || 0;
    const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - offer.offerPrice) / originalPrice) * 100) : 0;
    
    return { ...offer, product, status, originalPrice, discountPercent };
  }).filter(offer => offer.product); // Only show offers where product exists

  const filteredOffers = enrichedOffers.filter(o => {
    const matchesSearch = o.product!.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openAddForm = () => {
    setEditingOfferId(null);
    setSelCategoryId('');
    setSelBranchId('');
    setSelProductId('');
    setOfferPrice('');
    
    // Default dates: start now, end tomorrow
    const now = new Date();
    setStartDate(toDatetimeLocal(now.toISOString()));
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setEndDate(toDatetimeLocal(tomorrow.toISOString()));
    setIsDisabled(false);
    
    setIsFormOpen(true);
  };

  const openEditForm = (offer: typeof enrichedOffers[0]) => {
    setEditingOfferId(offer.id);
    const prod = offer.product!;
    setSelCategoryId(prod.categoryId);
    setSelBranchId(prod.branchId);
    setSelProductId(prod.id);
    setOfferPrice(offer.offerPrice.toString());
    setStartDate(toDatetimeLocal(offer.startDate));
    setEndDate(toDatetimeLocal(offer.endDate));
    setIsDisabled(offer.isDisabled);
    setIsFormOpen(true);
  };

  const saveOffer = async () => {
    if (!selProductId || !offerPrice || !startDate || !endDate) return;
    
    const numOfferPrice = Number(offerPrice);
    if (selectedProduct && numOfferPrice > selectedProduct.price) {
      alert('سعر العرض يجب أن يكون أقل من أو يساوي السعر الأصلي.');
      return;
    }

    const start = new Date(startDate).toISOString();
    const end = new Date(endDate).toISOString();

    if (new Date(start).getTime() >= new Date(end).getTime()) {
      alert('تاريخ انتهاء العرض يجب أن يكون بعد تاريخ البداية.');
      return;
    }

    await saveOfferMutation({ adminTokenHash: tokenHash, id: editingOfferId as any || undefined, productId: selProductId as any, offerPrice: numOfferPrice, startAt: new Date(start).getTime(), endAt: new Date(end).getTime(), isEnabled: !isDisabled });
    setIsFormOpen(false);
  };

  const toggleStatus = async (id: string, currentIsDisabled: boolean) => {
    const offer = offers.find(o => o.id === id);
    if (!offer) return;
    await saveOfferMutation({ adminTokenHash: tokenHash, id: id as any, productId: offer.productId as any, offerPrice: offer.offerPrice, startAt: new Date(offer.startDate).getTime(), endAt: new Date(offer.endDate).getTime(), isEnabled: currentIsDisabled });
  };

  const handleDelete = async () => {
    if (isDeleteOpen) {
      await deleteOffer({ adminTokenHash: tokenHash, id: isDeleteOpen as any });
      setIsDeleteOpen(null);
    }
  };

  // Live discount calculation for the form
  const formDiscount = (selectedProduct && offerPrice) 
    ? Math.max(0, Math.round(((selectedProduct.price - Number(offerPrice)) / selectedProduct.price) * 100))
    : 0;

  return (
    <div className="space-y-6 pb-20 md:pb-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">العروض اليومية</h2>
          <p className="text-gray-500 text-sm">إدارة الخصومات المرتبطة بالمنتجات</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ابحث باسم المنتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pr-10 pl-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#055C33] focus:border-[#055C33] sm:text-sm transition-colors"
            />
          </div>
          <button
            onClick={openAddForm}
            className="bg-[#055C33] hover:bg-[#044727] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">إضافة عرض جديد</span>
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
        {[{ label: 'الكل', value: 'ALL' }, ...Object.entries(OFFER_STATUS_DEF).map(([k, v]) => ({ label: v.label, value: k }))].map(filter => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value as any)}
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

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredOffers.map(offer => {
          const statusDef = OFFER_STATUS_DEF[offer.status];
          const sd = new Date(offer.startDate).toLocaleString('ar-IQ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
          const ed = new Date(offer.endDate).toLocaleString('ar-IQ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

          return (
            <div key={offer.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3 transition-all hover:shadow-md relative overflow-hidden group">
              {/* Discount Badge */}
              <div className="absolute top-0 left-0 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-br-xl shadow-sm z-10">
                خصم {offer.discountPercent}%
              </div>

              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-3xl border border-gray-100 shrink-0">
                  {offer.product!.image}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 truncate text-lg pr-2">{offer.product!.name}</h3>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 border ${statusDef.color}`}>
                      {statusDef.label}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-0.5 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-400 line-through">
                      <span>{offer.originalPrice.toLocaleString('ar-IQ')} د.ع</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-black text-rose-600 text-lg">
                      <span>{offer.offerPrice.toLocaleString('ar-IQ')} د.ع</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1.5 mt-2">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> يبدأ:</div>
                  <span className="font-bold">{sd}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> ينتهي:</div>
                  <span className="font-bold text-gray-900">{ed}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-1">
                <button 
                  onClick={() => openEditForm(offer)}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2 rounded-xl text-sm transition-colors border border-gray-100"
                >
                  تعديل
                </button>
                <button 
                  onClick={() => toggleStatus(offer.id, offer.isDisabled)}
                  className={`flex-1 font-bold py-2 rounded-xl text-sm transition-colors border flex items-center justify-center gap-1.5
                    ${offer.isDisabled 
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                      : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                    }`}
                >
                  {offer.isDisabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  {offer.isDisabled ? 'تفعيل' : 'إيقاف'}
                </button>
                <button 
                  onClick={() => setIsDeleteOpen(offer.id)}
                  className="w-10 bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center rounded-xl transition-colors border border-red-100 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredOffers.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-3xl border border-gray-100 border-dashed">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-bold">لا توجد عروض مطابقة</p>
          </div>
        )}
      </div>

      {/* Offer Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/50 backdrop-blur-sm sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-lg">{editingOfferId ? 'تعديل العرض' : 'إضافة عرض جديد'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4">
              
              {/* Product Selection */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#055C33]" />
                  اختيار المنتج
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">القسم</label>
                    <select 
                      value={selCategoryId} 
                      onChange={e => { setSelCategoryId(e.target.value); setSelBranchId(''); setSelProductId(''); }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#055C33]"
                    >
                      <option value="">-- اختر القسم --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">الفرع</label>
                    <select 
                      value={selBranchId} 
                      onChange={e => { setSelBranchId(e.target.value); setSelProductId(''); }}
                      disabled={!selCategoryId}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#055C33] disabled:bg-gray-100"
                    >
                      <option value="">-- اختر الفرع --</option>
                      {branchesForCat.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">المنتج</label>
                    <select 
                      value={selProductId} 
                      onChange={e => setSelProductId(e.target.value)}
                      disabled={!selBranchId}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#055C33] disabled:bg-gray-100 font-bold text-gray-900"
                    >
                      <option value="">-- اختر المنتج --</option>
                      {productsForBranch.map(p => <option key={p.id} value={p.id}>{p.name} - ({p.price.toLocaleString()} د.ع)</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing & Dates */}
              {selectedProduct && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <label className="block text-xs font-bold text-gray-500 mb-1">السعر الأصلي</label>
                      <p className="font-black text-gray-400 text-lg line-through">{selectedProduct.price.toLocaleString('ar-IQ')} د.ع</p>
                    </div>
                    <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100">
                      <label className="block text-xs font-bold text-rose-500 mb-1">الخصم المحسوب</label>
                      <p className="font-black text-rose-600 text-lg">%{formDiscount}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">سعر العرض (د.ع)</label>
                    <input
                      type="number"
                      value={offerPrice}
                      onChange={e => setOfferPrice(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-3 font-bold text-lg focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33]"
                      placeholder="أدخل السعر الجديد..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ بداية العرض</label>
                      <input
                        type="datetime-local"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#055C33] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ انتهاء العرض</label>
                      <input
                        type="datetime-local"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#055C33] text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={!isDisabled}
                        onChange={() => setIsDisabled(!isDisabled)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#055C33]"></div>
                      <span className="mr-3 text-sm font-bold text-gray-700">العرض مفعل</span>
                    </label>
                  </div>
                </div>
              )}

            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 shrink-0">
              <button onClick={() => setIsFormOpen(false)} className="px-4 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">
                إلغاء
              </button>
              <button 
                onClick={saveOffer}
                disabled={!selectedProduct || !offerPrice || !startDate || !endDate}
                className="px-6 py-2.5 bg-[#055C33] hover:bg-[#044727] text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                حفظ العرض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        open={Boolean(isDeleteOpen)}
        title="حذف العرض؟"
        description="سيُحذف العرض فورًا من لوحة الإدارة وتطبيق المستخدم، ولن يُحذف المنتج الأصلي."
        itemName={enrichedOffers.find((offer) => offer.id === isDeleteOpen)?.product?.name}
        onCancel={() => setIsDeleteOpen(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
