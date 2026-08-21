import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, Folder, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAdmin } from '../../shared/context/AdminContext';
import { useStorageUpload } from '../../shared/useStorageUpload';
import DeleteConfirmDialog from '../../components/DeleteConfirmDialog';

export default function CategoriesList() {
  const navigate = useNavigate();
  const { tokenHash } = useAdmin();
  const categories = useQuery(api.admin.categories, { adminTokenHash: tokenHash }) ?? [];
  const saveCategory = useMutation(api.admin.saveCategory);
  const deleteCategory = useMutation(api.admin.deleteCategory);
  const upload = useStorageUpload();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatFile, setNewCatFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const filteredCategories = categories.filter(c => 
    c.name.includes(searchQuery)
  );

  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      setFormError('اكتب اسم القسم أولاً.');
      return;
    }
    setIsSaving(true);
    setFormError('');
    try {
      const imageStorageId = await upload(newCatFile, { maxDimension: 640, targetBytes: 140 * 1024 });
      await saveCategory({ adminTokenHash: tokenHash, id: editingId as any || undefined, name: newCatName, imageStorageId: imageStorageId as any });
      setIsAddModalOpen(false);
      setEditingId(null);
      setNewCatName('');
      setNewCatImage('');
      setNewCatFile(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'تعذر حفظ القسم. حاول مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCategory({ adminTokenHash: tokenHash, id: id as any });
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">الأقسام الرئيسية</h2>
          <p className="text-gray-500 text-sm mt-1">إدارة الأقسام وتصنيفات المتجر</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="بحث عن قسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pr-10 pl-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#055C33] focus:border-[#055C33] sm:text-sm transition-colors"
            />
          </div>
          <button
            onClick={() => { setFormError(''); setIsAddModalOpen(true); }}
            className="bg-[#055C33] hover:bg-[#044727] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">إضافة قسم جديد</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map(category => {
          const branchesCount = category.branchesCount;
          
          return (
            <div key={category.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md cursor-pointer group" onClick={() => navigate(`/products/categories/${category.id}`)}>
              <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-3xl border border-gray-100 shrink-0">
                {category.image ? <img src={category.image} alt="" className="w-full h-full object-cover rounded-xl" /> : '📁'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate text-lg group-hover:text-[#055C33] transition-colors">{category.name}</h3>
                <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                  <Folder className="w-4 h-4" />
                  <span>{branchesCount} فرع</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setFormError(''); setEditingId(category.id); setNewCatName(category.name); setIsAddModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setDeleteConfirm(category.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {filteredCategories.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">
            لا توجد أقسام مطابقة للبحث
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg">{editingId ? 'تعديل القسم' : 'إضافة قسم جديد'}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {formError && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">{formError}</div>}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">اسم القسم</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33]"
                  placeholder="مثال: المخبوزات"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">صورة القسم</label>
                <div className="flex gap-2">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl border border-gray-200 shrink-0">
                    {newCatImage || <ImageIcon className="w-5 h-5 text-gray-400" />}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e => { setFormError(''); setNewCatFile(e.target.files?.[0] || null); }}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33]"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">JPG أو PNG أو WebP — تُضغط الصورة تلقائياً قبل الرفع.</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">
                إلغاء
              </button>
              <button disabled={isSaving} onClick={handleAddCategory} className="px-4 py-2 bg-[#055C33] hover:bg-[#044727] text-white font-bold rounded-xl transition-colors disabled:cursor-wait disabled:opacity-70 flex items-center gap-2">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSaving ? 'جارٍ الضغط والحفظ...' : 'حفظ القسم'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <DeleteConfirmDialog
        open={Boolean(deleteConfirm)}
        title="حذف القسم؟"
        description="سيُحذف القسم مع جميع الفروع والمنتجات الموجودة داخله فورًا."
        itemName={categories.find((category) => category.id === deleteConfirm)?.name}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm!)}
      />
    </div>
  );
}
