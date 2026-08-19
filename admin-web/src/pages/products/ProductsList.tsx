import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, ArrowRight, X, Image as ImageIcon } from 'lucide-react';
import { Product, ProductOption } from './types';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAdmin } from '../../shared/context/AdminContext';
import { useStorageUpload } from '../../shared/useStorageUpload';

export default function ProductsList() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  
  const { tokenHash } = useAdmin();
  const categories = useQuery(api.admin.categories, { adminTokenHash: tokenHash }) ?? [];
  const allBranches = useQuery(api.admin.subcategories, { adminTokenHash: tokenHash }) ?? [];
  const branch = allBranches.find(b => b.id === branchId);
  const category = branch ? categories.find(c => c.id === branch.categoryId) : undefined;
  const products = (useQuery(api.admin.products, branchId ? { adminTokenHash: tokenHash, subcategoryId: branchId as any } : 'skip') ?? []) as Product[];
  const saveProduct = useMutation(api.admin.saveProduct);
  const deleteProduct = useMutation(api.admin.deleteProduct);
  const upload = useStorageUpload();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdFile, setNewProdFile] = useState<File | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Options State
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [currentOptionName, setCurrentOptionName] = useState('');
  const [currentOptionValue, setCurrentOptionValue] = useState('');

  if (!branch || !category) {
    return <div className="p-8 text-center text-gray-500">الفرع غير موجود</div>;
  }

  const filteredProducts = products.filter(p => 
    p.name.includes(searchQuery) || p.description.includes(searchQuery)
  );

  const handleAddOptionValue = () => {
    if (!currentOptionName.trim() || !currentOptionValue.trim()) return;
    
    setOptions(prev => {
      const existingOption = prev.find(o => o.name === currentOptionName);
      if (existingOption) {
        if (!existingOption.values.includes(currentOptionValue)) {
          return prev.map(o => o.name === currentOptionName ? { ...o, values: [...o.values, currentOptionValue] } : o);
        }
        return prev;
      } else {
        return [...prev, { name: currentOptionName, values: [currentOptionValue] }];
      }
    });
    setCurrentOptionValue('');
  };

  const handleRemoveOption = (optName: string) => {
    setOptions(options.filter(o => o.name !== optName));
  };

  const handleAddProduct = async () => {
    if (!newProdName.trim() || !newProdPrice) return;
    const imageStorageId = await upload(newProdFile);
    await saveProduct({ adminTokenHash: tokenHash, id: editingId as any || undefined, categoryId: category.id as any, subcategoryId: branch.id as any, name: newProdName, description: newProdDesc, price: Number(newProdPrice), imageStorageId: imageStorageId as any, options, isActive: isAvailable });
    setIsAddModalOpen(false);
    setEditingId(null);
    // Reset form
    setNewProdName('');
    setNewProdDesc('');
    setNewProdPrice('');
    setNewProdImage('');
    setNewProdFile(null);
    setIsAvailable(true);
    setOptions([]);
    setCurrentOptionName('');
    setCurrentOptionValue('');
  };

  const handleDelete = async (id: string) => {
    await deleteProduct({ adminTokenHash: tokenHash, id: id as any });
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/products/categories/${category.id}`)}
            className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{branch.image}</span>
              <h2 className="text-2xl font-bold text-gray-900">{branch.name}</h2>
            </div>
            <p className="text-gray-500 text-sm mt-1">{category.name} / إدارة المنتجات</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="بحث عن منتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pr-10 pl-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#055C33] focus:border-[#055C33] sm:text-sm transition-colors"
            />
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#055C33] hover:bg-[#044727] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">إضافة منتج جديد</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 transition-all hover:shadow-md group">
            <div className="w-24 h-24 bg-gray-50 rounded-xl flex items-center justify-center text-5xl border border-gray-100 shrink-0">
              {product.image ? <img src={product.image} alt="" className="w-full h-full object-cover rounded-xl" /> : '📦'}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900 truncate text-lg">{product.name}</h3>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {product.isAvailable ? 'متوفر' : 'غير متوفر'}
                  </span>
                </div>
                <p className="text-gray-500 text-xs line-clamp-2 mb-2 leading-relaxed">{product.description}</p>
                
                {product.options.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {product.options.map((opt, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded border border-gray-200">
                        {opt.name}: {opt.values.join('، ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-[#055C33]">{product.price.toLocaleString('ar-IQ')} د.ع</span>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingId(product.id); setNewProdName(product.name); setNewProdDesc(product.description); setNewProdPrice(String(product.price)); setIsAvailable(product.isAvailable); setOptions(product.options); setIsAddModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setDeleteConfirm(product.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">
            لا توجد منتجات مطابقة للبحث
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/50 backdrop-blur-sm sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-lg">{editingId ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">اسم المنتج</label>
                  <input
                    type="text"
                    value={newProdName}
                    onChange={e => setNewProdName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33]"
                    placeholder="مثال: بيبسي"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">السعر (د.ع)</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={e => setNewProdPrice(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33]"
                    placeholder="500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">صورة المنتج</label>
                <div className="flex gap-2">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl border border-gray-200 shrink-0">
                    {newProdImage || <ImageIcon className="w-5 h-5 text-gray-400" />}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setNewProdFile(e.target.files?.[0] || null)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الوصف المخصتر</label>
                <textarea
                  value={newProdDesc}
                  onChange={e => setNewProdDesc(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33] resize-none h-20"
                  placeholder="وصف مكونات المنتج..."
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="text-sm font-bold text-gray-700">حالة المنتج:</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAvailable(true)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${isAvailable ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500'}`}
                  >
                    متوفر
                  </button>
                  <button
                    onClick={() => setIsAvailable(false)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${!isAvailable ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-500'}`}
                  >
                    غير متوفر
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h4 className="font-bold text-gray-900 mb-3">خيارات المنتج (الحجم، اللون، النوع...)</h4>
                
                {/* Options List */}
                <div className="space-y-3 mb-4">
                  {options.map((opt, idx) => (
                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex justify-between items-start">
                      <div>
                        <span className="font-bold text-sm block mb-1">{opt.name}:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {opt.values.map((v, i) => (
                            <span key={i} className="bg-white border border-gray-200 text-gray-700 text-xs px-2 py-1 rounded-md">
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => handleRemoveOption(opt.name)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {options.length === 0 && (
                    <p className="text-sm text-gray-400 italic">لا توجد خيارات مضافة</p>
                  )}
                </div>

                {/* Add Option Form */}
                <div className="bg-white border border-dashed border-gray-300 rounded-xl p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">اسم الخيار</label>
                      <input
                        type="text"
                        value={currentOptionName}
                        onChange={e => setCurrentOptionName(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33]"
                        placeholder="مثال: الحجم"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">القيمة</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentOptionValue}
                          onChange={e => setCurrentOptionValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddOptionValue()}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33]"
                          placeholder="مثال: كبير"
                        />
                        <button 
                          onClick={handleAddOptionValue}
                          disabled={!currentOptionName.trim() || !currentOptionValue.trim()}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
                        >
                          إضافة
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500">ملاحظة: يمكنك إضافة عدة قيم لنفس الخيار بكتابة نفس اسم الخيار.</p>
                </div>
              </div>

            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 shrink-0">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">
                إلغاء
              </button>
              <button onClick={handleAddProduct} className="px-4 py-2 bg-[#055C33] hover:bg-[#044727] text-white font-bold rounded-xl transition-colors">
                حفظ المنتج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg mb-2">هل أنت متأكد من الحذف؟</h3>
            <p className="text-gray-500 text-sm mb-6">سيتم حذف هذا المنتج نهائياً.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                إلغاء
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors">
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
