import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, ArrowRight, Package, Image as ImageIcon, X } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAdmin } from '../../shared/context/AdminContext';
import { useStorageUpload } from '../../shared/useStorageUpload';
import DeleteConfirmDialog from '../../components/DeleteConfirmDialog';

export default function BranchesList() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  
  const { tokenHash } = useAdmin();
  const categories = useQuery(api.admin.categories, { adminTokenHash: tokenHash }) ?? [];
  const category = categories.find(c => c.id === categoryId);
  const branches = useQuery(api.admin.subcategories, categoryId ? { adminTokenHash: tokenHash, categoryId: categoryId as any } : 'skip') ?? [];
  const saveSubcategory = useMutation(api.admin.saveSubcategory);
  const deleteSubcategory = useMutation(api.admin.deleteSubcategory);
  const upload = useStorageUpload();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form State
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchImage, setNewBranchImage] = useState('');
  const [newBranchFile, setNewBranchFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!category) {
    return <div className="p-8 text-center text-gray-500">القسم غير موجود</div>;
  }

  const filteredBranches = branches.filter(b => 
    b.name.includes(searchQuery)
  );

  const handleAddBranch = async () => {
    if (!newBranchName.trim()) return;
    const imageStorageId = await upload(newBranchFile);
    await saveSubcategory({ adminTokenHash: tokenHash, id: editingId as any || undefined, categoryId: category.id as any, name: newBranchName, imageStorageId: imageStorageId as any });
    setIsAddModalOpen(false);
    setEditingId(null);
    setNewBranchName('');
    setNewBranchImage('');
    setNewBranchFile(null);
  };

  const handleDelete = async (id: string) => {
    await deleteSubcategory({ adminTokenHash: tokenHash, id: id as any });
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/products')}
            className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{category.image}</span>
              <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
            </div>
            <p className="text-gray-500 text-sm mt-1">إدارة فروع القسم</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="بحث عن فرع..."
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
            <span className="hidden sm:inline">إضافة فرع جديد</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBranches.map(branch => {
          const productsCount = branch.productsCount;
          
          return (
            <div key={branch.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md cursor-pointer group" onClick={() => navigate(`/products/branches/${branch.id}`)}>
              <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-3xl border border-gray-100 shrink-0">
                {branch.image ? <img src={branch.image} alt="" className="w-full h-full object-cover rounded-xl" /> : '📁'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate text-lg group-hover:text-[#055C33] transition-colors">{branch.name}</h3>
                <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                  <Package className="w-4 h-4" />
                  <span>{productsCount} منتج</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setEditingId(branch.id); setNewBranchName(branch.name); setIsAddModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setDeleteConfirm(branch.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {filteredBranches.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">
            لا توجد فروع مطابقة للبحث
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg">إضافة فرع جديد</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">اسم الفرع</label>
                <input
                  type="text"
                  value={newBranchName}
                  onChange={e => setNewBranchName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33]"
                  placeholder="مثال: الخبز العربي"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">صورة الفرع</label>
                <div className="flex gap-2">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl border border-gray-200 shrink-0">
                    {newBranchImage || <ImageIcon className="w-5 h-5 text-gray-400" />}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setNewBranchFile(e.target.files?.[0] || null)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#055C33] focus:ring-1 focus:ring-[#055C33]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">القسم التابع له</label>
                <input
                  type="text"
                  value={category.name}
                  disabled
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">
                إلغاء
              </button>
              <button onClick={handleAddBranch} className="px-4 py-2 bg-[#055C33] hover:bg-[#044727] text-white font-bold rounded-xl transition-colors">
                حفظ الفرع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <DeleteConfirmDialog
        open={Boolean(deleteConfirm)}
        title="حذف الفرع؟"
        description="سيُحذف الفرع مع جميع المنتجات الموجودة داخله فورًا."
        itemName={branches.find((branch) => branch.id === deleteConfirm)?.name}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm!)}
      />
    </div>
  );
}
