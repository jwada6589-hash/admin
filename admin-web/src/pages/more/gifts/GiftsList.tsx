import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Power, PowerOff, X, Image as ImageIcon, Gift as GiftIcon } from 'lucide-react';
import { Gift, GiftStatus, GIFT_STATUS_DEF, getGiftStatus } from './types';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useAdmin } from '../../../shared/context/AdminContext';
import { useStorageUpload } from '../../../shared/useStorageUpload';
import DeleteConfirmDialog from '../../../components/DeleteConfirmDialog';

export default function GiftsList() {
  const { tokenHash } = useAdmin();
  const gifts = (useQuery(api.admin.gifts, { adminTokenHash: tokenHash }) ?? []) as Gift[];
  const saveGift = useMutation(api.admin.saveGift);
  const deleteGift = useMutation(api.admin.deleteGift);
  const upload = useStorageUpload();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GiftStatus | 'ALL'>('ALL');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGiftId, setEditingGiftId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [requiredBalance, setRequiredBalance] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isDisabled, setIsDisabled] = useState(false);
  const [formError, setFormError] = useState('');

  const enrichedGifts = gifts.map(g => ({ ...g, status: getGiftStatus(g) }));

  const filteredGifts = enrichedGifts.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openAddForm = () => {
    setEditingGiftId(null);
    setName('');
    setDescription('');
    setImage('');
    setRequiredBalance('');
    setQuantity('');
    setIsDisabled(false);
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (gift: Gift) => {
    setEditingGiftId(gift.id);
    setName(gift.name);
    setDescription(gift.description);
    setImage(gift.image);
    setRequiredBalance(gift.requiredBalance.toString());
    setQuantity(gift.quantity.toString());
    setIsDisabled(gift.isDisabled);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { setFormError('الاسم مطلوب'); return; }
    
    const reqBal = Number(requiredBalance);
    const qty = Number(quantity);

    if (isNaN(reqBal) || reqBal < 0) { setFormError('الرصيد المطلوب غير صالح'); return; }
    if (isNaN(qty) || qty < 0 || !Number.isInteger(qty)) { setFormError('الكمية غير صالحة'); return; }

    const imageStorageId = await upload(imageFile);
    await saveGift({ adminTokenHash: tokenHash, id: editingGiftId as any || undefined, name, description, imageStorageId: imageStorageId as any, requiredBalance: reqBal, stock: qty, isActive: !isDisabled });
    setIsFormOpen(false);
  };

  const toggleStatus = async (id: string, currentIsDisabled: boolean) => {
    const gift = gifts.find(g => g.id === id);
    if (!gift) return;
    await saveGift({ adminTokenHash: tokenHash, id: id as any, name: gift.name, description: gift.description, requiredBalance: gift.requiredBalance, stock: gift.quantity, isActive: currentIsDisabled });
  };

  const handleDelete = async () => {
    if (isDeleteOpen) {
      await deleteGift({ adminTokenHash: tokenHash, id: isDeleteOpen as any });
      setIsDeleteOpen(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 md:w-64 md:flex-none">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="بحث عن هدية..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pr-10 pl-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#055C33] focus:border-[#055C33] sm:text-sm transition-colors"
          />
        </div>
        <button
          onClick={openAddForm}
          className="bg-[#055C33] hover:bg-[#044727] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة هدية</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
        {[{ label: 'الكل', value: 'ALL' }, ...Object.entries(GIFT_STATUS_DEF).map(([k, v]) => ({ label: v.label, value: k }))].map(filter => (
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

      {/* List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredGifts.map(gift => {
          const statusDef = GIFT_STATUS_DEF[gift.status];

          return (
            <div key={gift.id} className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 transition-all hover:shadow-md">
              <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center text-4xl border border-gray-100 shrink-0 self-start">
                {gift.image ? <img src={gift.image} alt="" className="w-full h-full object-cover rounded-xl" /> : '🎁'}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 truncate text-lg pr-2">{gift.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{gift.description}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold shrink-0 border ${statusDef.color}`}>
                    {statusDef.label}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 text-sm pt-2">
                  <div>
                    <span className="text-gray-400 block text-xs">الرصيد المطلوب</span>
                    <span className="font-black text-[#055C33]">{gift.requiredBalance.toLocaleString('ar-IQ')} د.ع</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">الكمية المتوفرة</span>
                    <span className="font-bold text-gray-800">{gift.quantity}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400 block text-xs">عدد الاستبدالات السابقة</span>
                    <span className="font-bold text-gray-600">{gift.redemptionCount} مرة</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100 mt-2">
                  <button 
                    onClick={() => openEditForm(gift)}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2 rounded-xl text-sm transition-colors border border-gray-100"
                  >
                    تعديل
                  </button>
                  <button 
                    onClick={() => toggleStatus(gift.id, gift.isDisabled)}
                    className={`flex-1 font-bold py-2 rounded-xl text-sm transition-colors border flex items-center justify-center gap-1.5
                      ${gift.isDisabled 
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                        : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                      }`}
                  >
                    {gift.isDisabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    {gift.isDisabled ? 'تفعيل' : 'إيقاف'}
                  </button>
                  <button 
                    onClick={() => setIsDeleteOpen(gift.id)}
                    className="w-10 bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center rounded-xl transition-colors border border-red-100 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredGifts.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-3xl border border-gray-100 border-dashed">
            <GiftIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-bold">لا توجد هدايا مطابقة</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/50 backdrop-blur-sm sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-lg">{editingGiftId ? 'تعديل الهدية' : 'إضافة هدية جديدة'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm font-bold border border-red-100">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">اسم الهدية</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33]"
                  placeholder="مثال: علبة عصير طبيعي"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">صورة الهدية</label>
                <div className="flex gap-2">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl border border-gray-200 shrink-0">
                    {image || <ImageIcon className="w-5 h-5 text-gray-400" />}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setImageFile(e.target.files?.[0] || null)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">وصف الهدية</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33] resize-none h-20"
                  placeholder="وصف مختصر للهدية..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الرصيد المطلوب (د.ع)</label>
                  <input
                    type="number"
                    value={requiredBalance}
                    onChange={e => setRequiredBalance(e.target.value)}
                    min="0"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33]"
                    placeholder="3000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الكمية المتوفرة</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    min="0"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33]"
                    placeholder="20"
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
                  <span className="mr-3 text-sm font-bold text-gray-700">تفعيل الهدية</span>
                </label>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 shrink-0">
              <button onClick={() => setIsFormOpen(false)} className="px-4 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">
                إلغاء
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2.5 bg-[#055C33] hover:bg-[#044727] text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                حفظ الهدية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        open={Boolean(isDeleteOpen)}
        title="حذف الهدية؟"
        description="سيتم حذف الهدية فورًا من لوحة الإدارة وتطبيق المستخدم."
        itemName={gifts.find((gift) => gift.id === isDeleteOpen)?.name}
        onCancel={() => setIsDeleteOpen(null)}
        onConfirm={handleDelete}
      />

    </div>
  );
}
