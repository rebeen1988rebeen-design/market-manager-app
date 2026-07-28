import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  RotateCw, 
  X, 
  Tag, 
  Barcode,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { Product, Category, Language, Currency } from '../types';
import { getTranslation } from '../utils/translations';
import { formatCurrency, generateBarcode, normalizeDigits } from '../utils/formatters';

interface InventoryViewProps {
  products: Product[];
  categories: Category[];
  lang: Language;
  currency: Currency;
  exchangeRate: number;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onRestockProduct: (id: string, additionalQty: number) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  categories,
  lang,
  currency,
  exchangeRate,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onRestockProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductObj, setDeletingProductObj] = useState<Product | null>(null);
  const [restockProductObj, setRestockProductObj] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);

  // New product form state
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    barcode: generateBarcode(),
    nameKu: '',
    nameEn: '',
    category: categories[0]?.id || 'cat-grocery',
    purchasePrice: 1000,
    sellingPrice: 1500,
    discount: 0,
    stock: 20,
    lowStockAlert: 5,
    unit: 'دانە',
  });

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const query = normalizeDigits(searchQuery).toLowerCase().trim();
    const matchesSearch =
      p.nameKu.toLowerCase().includes(query) ||
      p.nameEn.toLowerCase().includes(query) ||
      normalizeDigits(p.barcode).toLowerCase().includes(query);

    const isLow = p.stock <= p.lowStockAlert;
    const matchesLowStockFilter = !showLowStockOnly || isLow;

    return matchesCategory && matchesSearch && matchesLowStockFilter;
  });

  const handleOpenAdd = () => {
    setFormData({
      barcode: generateBarcode(),
      nameKu: '',
      nameEn: '',
      category: categories[0]?.id || 'cat-grocery',
      purchasePrice: 1000,
      sellingPrice: 1500,
      discount: 0,
      stock: 20,
      lowStockAlert: 5,
      unit: 'دانە',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameKu.trim()) {
      alert(lang === 'ku' ? 'تکایە ناوی کاڵاکە بە کوردی بنووسە!' : 'Please enter product name in Kurdish!');
      return;
    }
    onAddProduct(formData);
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProduct(editingProduct);
      setEditingProduct(null);
    }
  };

  const handleConfirmRestock = () => {
    if (restockProductObj && restockQty > 0) {
      onRestockProduct(restockProductObj.id, restockQty);
      setRestockProductObj(null);
      setRestockQty(10);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header & Actions */}
      <div className="liquid-glass p-5 rounded-3xl border border-white/80 shadow-xl shadow-slate-900/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-center font-bold shadow-lg shadow-amber-500/30 border border-amber-300/30 shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{getTranslation(lang, 'inventory')}</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {lang === 'ku'
                ? `کۆی گشتی کاڵاکان: ${products.length} کاڵا • کاڵا کەمبووەکان: ${products.filter((p) => p.stock <= p.lowStockAlert).length}`
                : `Total items: ${products.length} • Low stock items: ${products.filter((p) => p.stock <= p.lowStockAlert).length}`}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center justify-center space-x-1.5 space-x-reverse shadow-md shadow-amber-500/20 border border-amber-300/30 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{getTranslation(lang, 'addProduct')}</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getTranslation(lang, 'search')}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">{getTranslation(lang, 'allCategories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {lang === 'ku' ? c.nameKu : c.nameEn}
              </option>
            ))}
          </select>

          {/* Low Stock Filter Checkbox */}
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 space-x-reverse ${
              showLowStockOnly
                ? 'bg-amber-500 text-slate-950 border-amber-500'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{getTranslation(lang, 'lowStockOnly')}</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">{getTranslation(lang, 'barcode')}</th>
                <th className="p-4">{getTranslation(lang, 'productNameKu')}</th>
                <th className="p-4">{getTranslation(lang, 'category')}</th>
                <th className="p-4">{getTranslation(lang, 'purchasePrice')}</th>
                <th className="p-4">{getTranslation(lang, 'sellingPrice')}</th>
                <th className="p-4">{getTranslation(lang, 'stockQuantity')}</th>
                <th className="p-4 text-center">{getTranslation(lang, 'actions')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    {lang === 'ku' ? 'هیچ کاڵایەک نەدۆزرایەوە!' : 'No products match search criteria.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isOut = product.stock <= 0;
                  const isLow = product.stock > 0 && product.stock <= product.lowStockAlert;
                  const catObj = categories.find((c) => c.id === product.category);

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Barcode */}
                      <td className="p-4 font-mono font-medium text-slate-600">
                        {product.barcode}
                      </td>

                      {/* Product Name */}
                      <td className="p-4 font-bold text-slate-800">
                        <div>
                          <div>{lang === 'ku' ? product.nameKu : product.nameEn}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {product.nameEn}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4 text-slate-600 font-medium">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-[11px] text-slate-700">
                          {catObj ? (lang === 'ku' ? catObj.nameKu : catObj.nameEn) : product.category}
                        </span>
                      </td>

                      {/* Purchase Price */}
                      <td className="p-4 font-semibold text-slate-500">
                        {formatCurrency(product.purchasePrice, currency, exchangeRate)}
                      </td>

                      {/* Selling Price & Discount */}
                      <td className="p-4">
                        {product.discount && product.discount > 0 ? (
                          <div>
                            <div className="line-through text-[10px] text-slate-400 font-medium">
                              {formatCurrency(product.sellingPrice, currency, exchangeRate)}
                            </div>
                            <div className="font-bold text-amber-700">
                              {formatCurrency(product.sellingPrice - product.discount, currency, exchangeRate)}
                            </div>
                            <div className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                              <Tag className="w-2.5 h-2.5 text-amber-700" />
                              <span>-{formatCurrency(product.discount, currency, exchangeRate)}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="font-bold text-emerald-600">
                            {formatCurrency(product.sellingPrice, currency, exchangeRate)}
                          </span>
                        )}
                      </td>

                      {/* Stock Quantity */}
                      <td className="p-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span
                            className={`font-extrabold text-xs px-2.5 py-1 rounded-full ${
                              isOut
                                ? 'bg-rose-100 text-rose-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {product.stock} {product.unit}
                          </span>

                          {(isOut || isLow) && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                          {/* Restock Button */}
                          <button
                            onClick={() => {
                              setRestockProductObj(product);
                              setRestockQty(10);
                            }}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition"
                            title={getTranslation(lang, 'restock')}
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => setEditingProduct({ ...product })}
                            className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white rounded-lg transition"
                            title={getTranslation(lang, 'edit')}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeletingProductObj(product)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition cursor-pointer"
                            title={getTranslation(lang, 'delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Product */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="liquid-glass rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-white/80">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {getTranslation(lang, 'addProduct')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-white/60 hover:bg-white rounded-xl cursor-pointer transition border border-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {getTranslation(lang, 'productNameKu')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameKu}
                    onChange={(e) => setFormData({ ...formData, nameKu: e.target.value })}
                    className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                    placeholder="نموونە: چای ئالۆکۆزای"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {getTranslation(lang, 'productNameEn')}
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                    placeholder="e.g. Alokozay Tea"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {getTranslation(lang, 'category')}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {lang === 'ku' ? c.nameKu : c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {getTranslation(lang, 'barcode')}
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 font-mono text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {getTranslation(lang, 'purchasePrice')} (د.ع)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {getTranslation(lang, 'sellingPrice')} (د.ع)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 font-bold text-emerald-600 text-xs focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block flex items-center gap-1">
                    <Tag className="w-3 h-3 text-amber-600" />
                    <span>{lang === 'ku' ? 'داشکاندن (د.ع)' : 'Discount'}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.sellingPrice}
                    value={formData.discount || 0}
                    onChange={(e) => setFormData({ ...formData, discount: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-amber-50/80 border border-amber-300/80 rounded-2xl px-3.5 py-2 font-bold text-amber-800 text-xs focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {getTranslation(lang, 'stockQuantity')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {getTranslation(lang, 'lowStockLimit')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.lowStockAlert}
                    onChange={(e) => setFormData({ ...formData, lowStockAlert: Number(e.target.value) })}
                    className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {getTranslation(lang, 'unit')}
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  >
                    <option value="دانە">دانە (Pcs)</option>
                    <option value="کیلۆ">کیلۆ (Kg)</option>
                    <option value="پاکەت">پاکەت (Pack)</option>
                    <option value="کارتۆن">کارتۆن (Box)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 space-x-reverse border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white/80 text-slate-700 hover:bg-white rounded-xl font-bold transition border border-slate-200/80 cursor-pointer"
                >
                  {getTranslation(lang, 'cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold transition shadow-md shadow-amber-500/20 border border-amber-300/30 cursor-pointer active:scale-95"
                >
                  {getTranslation(lang, 'save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Product */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="liquid-glass rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-white/80">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Edit3 className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {getTranslation(lang, 'editProduct')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-white/60 hover:bg-white rounded-xl cursor-pointer transition border border-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {getTranslation(lang, 'productNameKu')}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nameKu}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameKu: e.target.value })}
                    className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {getTranslation(lang, 'productNameEn')}
                  </label>
                  <input
                    type="text"
                    value={editingProduct.nameEn}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                    className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {getTranslation(lang, 'purchasePrice')} (د.ع)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.purchasePrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, purchasePrice: Number(e.target.value) })}
                    className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {getTranslation(lang, 'sellingPrice')} (د.ع)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.sellingPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: Number(e.target.value) })}
                    className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 font-bold text-emerald-600 text-xs focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block flex items-center gap-1">
                    <Tag className="w-3 h-3 text-amber-600" />
                    <span>{lang === 'ku' ? 'داشکاندن (د.ع)' : 'Discount'}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={editingProduct.sellingPrice}
                    value={editingProduct.discount || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, discount: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-amber-50/80 border border-amber-300/80 rounded-2xl px-3.5 py-2 font-bold text-amber-800 text-xs focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {getTranslation(lang, 'stockQuantity')}
                  </label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {getTranslation(lang, 'lowStockLimit')}
                  </label>
                  <input
                    type="number"
                    value={editingProduct.lowStockAlert}
                    onChange={(e) => setEditingProduct({ ...editingProduct, lowStockAlert: Number(e.target.value) })}
                    className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 space-x-reverse border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-white/80 text-slate-700 hover:bg-white rounded-xl font-bold transition border border-slate-200/80 cursor-pointer"
                >
                  {getTranslation(lang, 'cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold transition shadow-md shadow-amber-500/20 border border-amber-300/30 cursor-pointer active:scale-95"
                >
                  {getTranslation(lang, 'save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Restock Product */}
      {restockProductObj && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <RotateCw className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {getTranslation(lang, 'restock')}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-bold">
                {lang === 'ku' ? restockProductObj.nameKu : restockProductObj.nameEn}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {lang === 'ku' ? `بڕی ئێستا لە کۆگا: ${restockProductObj.stock}` : `Current stock: ${restockProductObj.stock}`}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                {lang === 'ku' ? 'بڕی زیادکراو (+):' : 'Additional Qty (+):'}
              </label>
              <input
                type="number"
                min="1"
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
                className="w-full text-center text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl py-2 text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmRestock}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                {getTranslation(lang, 'save')}
              </button>
              <button
                onClick={() => setRestockProductObj(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                {getTranslation(lang, 'cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Product Confirmation */}
      {deletingProductObj && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{getTranslation(lang, 'delete')}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {getTranslation(lang, 'confirmDeleteProduct')}
              </p>
              <p className="text-sm font-bold text-slate-800 mt-2 bg-slate-100 py-1.5 px-3 rounded-xl inline-block">
                {lang === 'ku' ? deletingProductObj.nameKu : deletingProductObj.nameEn}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  onDeleteProduct(deletingProductObj.id);
                  setDeletingProductObj(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition active:scale-95"
              >
                {getTranslation(lang, 'delete')}
              </button>
              <button
                onClick={() => setDeletingProductObj(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                {getTranslation(lang, 'cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
