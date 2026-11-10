import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit,
  Trash2,
  Layers,
  ArrowUpDown,
  Upload,
  Download,
  CheckCircle2,
  X
} from 'lucide-react';
import { api } from '../api/axiosClient.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { BigButton } from '../components/BigButton.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';

const CATEGORIES = [
  'All',
  'Pipe',
  'Hand Pump',
  'Tap',
  'Motor',
  'Submersible',
  'Fitting',
  'Other'
];

const UNITS = ['piece', 'meter', 'set', 'kg', 'packet', 'bundle', 'feet'];

export const Products = () => {
  const { t, lang } = useLanguage();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockAdjustItem, setStockAdjustItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState('IN');
  const [adjustReason, setAdjustReason] = useState('');
  const [productToDelete, setProductToDelete] = useState(null);

  // Form State
  const initialForm = {
    name: '',
    category: 'Pipe',
    brand: '',
    sizeModel: '',
    unit: 'piece',
    purchasePrice: '',
    sellingPrice: '',
    gstRate: 18,
    hsnCode: '',
    stockQuantity: '',
    lowStockLevel: 5
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 50,
        search,
        category: selectedCategory === 'All' ? '' : selectedCategory,
        lowStock: lowStockOnly ? 'true' : 'false'
      });
      const res = await api.get(`/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.data);
        setTotalCount(res.data.pagination.totalCount);
      }
    } catch (err) {
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, selectedCategory, lowStockOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleOpenAddModal = () => {
    setFormData(initialForm);
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      brand: product.brand || '',
      sizeModel: product.sizeModel || '',
      unit: product.unit || 'piece',
      purchasePrice: product.purchasePrice || '',
      sellingPrice: product.sellingPrice,
      gstRate: product.gstRate,
      hsnCode: product.hsnCode || '',
      stockQuantity: product.stockQuantity,
      lowStockLevel: product.lowStockLevel
    });
    setShowAddModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sellingPrice) {
      showToast('Please enter product name and selling price', 'error');
      return;
    }

    try {
      const payload = {
        ...formData,
        purchasePrice: Number(formData.purchasePrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        gstRate: Number(formData.gstRate) || 0,
        stockQuantity: Number(formData.stockQuantity) || 0,
        lowStockLevel: Number(formData.lowStockLevel) || 5
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
        showToast('Product updated successfully', 'success');
      } else {
        await api.post('/products', payload);
        showToast('Product added successfully', 'success');
      }

      setShowAddModal(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save product', 'error');
    }
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustQty || Number(adjustQty) <= 0 || !adjustReason.trim()) {
      showToast('Please enter valid quantity and reason', 'error');
      return;
    }

    try {
      await api.patch(`/products/${stockAdjustItem._id}/stock`, {
        quantity: Number(adjustQty),
        type: adjustType,
        reason: adjustReason.trim()
      });
      showToast(t('stockAdjustSuccess'), 'success');
      setStockAdjustItem(null);
      setAdjustQty('');
      setAdjustReason('');
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to adjust stock', 'error');
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await api.delete(`/products/${productToDelete._id}`);
      showToast('Product deactivated successfully', 'success');
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      showToast('Failed to deactivate product', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-brand-600 stroke-[2.3]" />
            <span>{t('productList')}</span>
          </h1>
          <p className="text-base text-slate-500 font-medium mt-1">
            {lang === 'hi'
              ? 'दुकान के सभी पाइप, मोटर, समरसेबल, फिटिंग एवं नल का स्टॉक संभालें'
              : 'Manage pipes, pumps, motors, submersibles, taps, and fittings inventory'}
          </p>
        </div>

        {isAdmin && (
          <BigButton
            variant="primary"
            onClick={handleOpenAddModal}
            icon={Plus}
            className="py-3 px-6 text-lg"
          >
            {t('addProduct')}
          </BigButton>
        )}
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              setPage(1);
            }}
            className={`px-5 py-2.5 rounded-xl font-bold text-base whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-brand-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[280px] relative">
          <Search className="w-6 h-6 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchProduct')}
            className="w-full pl-12 pr-4 py-3 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-900"
          />
        </form>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200 px-4 py-3 rounded-xl border border-slate-300 font-bold text-base text-slate-800 transition">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => {
                setLowStockOnly(e.target.checked);
                setPage(1);
              }}
              className="w-5 h-5 rounded text-rose-600"
            />
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>{lang === 'hi' ? 'कम स्टॉक वाले' : 'Low Stock Only'}</span>
          </label>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xl font-bold">
            {t('loading')}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xl font-medium">
            No products found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white text-base font-bold uppercase">
                  <th className="py-4 px-4">Product Name</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Brand / Model</th>
                  <th className="py-4 px-4 text-right">Selling Rate</th>
                  {isAdmin && <th className="py-4 px-4 text-right">Purchase Rate</th>}
                  <th className="py-4 px-4 text-center">GST %</th>
                  <th className="py-4 px-4 text-center">Stock</th>
                  {isAdmin && <th className="py-4 px-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-base">
                {products.map((p) => {
                  const isLow = p.stockQuantity <= p.lowStockLevel;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-lg">{p.name}</div>
                        {p.hsnCode && (
                          <div className="text-xs text-slate-500">HSN: {p.hsnCode}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-700">
                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-sm">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        <span className="font-semibold text-slate-800">{p.brand || '-'}</span>
                        {p.sizeModel && (
                          <span className="text-xs block text-slate-500">{p.sizeModel}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right font-black text-slate-900 text-xl">
                        ₹{p.sellingPrice.toFixed(2)}
                        <span className="text-xs font-normal text-slate-500"> / {p.unit}</span>
                      </td>
                      {isAdmin && (
                        <td className="py-4 px-4 text-right font-medium text-slate-600">
                          ₹{(p.purchasePrice || 0).toFixed(2)}
                        </td>
                      )}
                      <td className="py-4 px-4 text-center font-bold text-slate-600">
                        {p.gstRate}%
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-base ${
                            isLow
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                          <span>
                            {p.stockQuantity} {p.unit}
                          </span>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setStockAdjustItem(p);
                                setAdjustQty('');
                                setAdjustType('IN');
                                setAdjustReason('Stock Inward / Purchase');
                              }}
                              className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition font-bold text-xs"
                              title="Adjust Stock"
                            >
                              <ArrowUpDown className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition"
                              title="Edit Product"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setProductToDelete(p)}
                              className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl transition"
                              title="Deactivate Product"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between p-6 bg-slate-800 text-white">
              <h3 className="text-2xl font-bold">
                {editingProduct ? t('editProduct') : t('addProduct')}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-300 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    {t('itemName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Finolex PVC Pipe 1 inch"
                    className="w-full px-4 py-2.5 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    {t('category')} *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-900"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    {t('brand')}
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Finolex, Jaquar, Kirloskar"
                    className="w-full px-4 py-2.5 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Size / Model
                  </label>
                  <input
                    type="text"
                    value={formData.sizeModel}
                    onChange={(e) => setFormData({ ...formData, sizeModel: e.target.value })}
                    placeholder="e.g. 1 inch, 0.5 HP, 100m"
                    className="w-full px-4 py-2.5 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    {t('unit')} *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2.5 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-900"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    {t('sellingPrice')} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    placeholder="₹ Rate to customer"
                    className="w-full px-4 py-2.5 text-lg font-bold border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    {t('purchasePrice')} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    placeholder="₹ Cost from supplier"
                    className="w-full px-4 py-2.5 text-lg font-bold border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    {t('gstPercent')}
                  </label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-900"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    {t('hsnCode')}
                  </label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    placeholder="e.g. 8413, 3917"
                    className="w-full px-4 py-2.5 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-900"
                  />
                </div>

                {!editingProduct && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      {t('currentStock')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stockQuantity}
                      onChange={(e) =>
                        setFormData({ ...formData, stockQuantity: e.target.value })
                      }
                      placeholder="Opening stock quantity"
                      className="w-full px-4 py-2.5 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-900"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    {t('minStockLevel')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lowStockLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, lowStockLevel: e.target.value })
                    }
                    placeholder="Alert when stock falls below"
                    className="w-full px-4 py-2.5 text-lg border-2 border-slate-300 rounded-xl focus:border-brand-600 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <BigButton
                  variant="secondary"
                  onClick={() => setShowAddModal(false)}
                  className="py-3 px-6 text-base"
                >
                  {t('cancel')}
                </BigButton>
                <BigButton variant="primary" type="submit" className="py-3 px-6 text-base">
                  {t('save')}
                </BigButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {stockAdjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-2xl font-bold text-slate-900">
              {t('adjustStock')}: {stockAdjustItem.name}
            </h3>
            <p className="text-base text-slate-600">
              Current Stock: <span className="font-bold text-slate-900 text-lg">{stockAdjustItem.stockQuantity} {stockAdjustItem.unit}</span>
            </p>

            <form onSubmit={handleStockAdjustment} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Adjustment Type
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-xl font-medium"
                >
                  <option value="IN">+ Add Stock (Inward / Purchase)</option>
                  <option value="OUT">- Reduce Stock (Damage / Breakage)</option>
                  <option value="ADJUSTMENT">= Set Exact Stock Count</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="Quantity"
                  className="w-full px-4 py-3 text-xl font-bold border-2 border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Reason *
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. New stock arrived from supplier"
                  className="w-full px-4 py-2.5 text-base border-2 border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <BigButton
                  variant="secondary"
                  onClick={() => setStockAdjustItem(null)}
                  className="py-3 px-6 text-base"
                >
                  {t('cancel')}
                </BigButton>
                <BigButton variant="primary" type="submit" className="py-3 px-6 text-base">
                  Update Stock
                </BigButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <ConfirmModal
          isOpen={!!productToDelete}
          title="Deactivate Product"
          message={`Are you sure you want to deactivate "${productToDelete.name}"? It will no longer appear in new billing searches.`}
          confirmText="Yes, Deactivate"
          cancelText="No, Keep It"
          danger={true}
          onConfirm={handleDeleteProduct}
          onClose={() => setProductToDelete(null)}
        />
      )}
    </div>
  );
};
