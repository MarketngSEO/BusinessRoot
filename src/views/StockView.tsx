import React, { useState, useMemo } from 'react';
import { Product, SerialItem, CompanyConfig, User } from '../types/inventory';
import { exportStockToExcel, exportStockToPDF } from '../utils/exportUtils';
import {
  Search,
  FileSpreadsheet,
  FileText,
  Plus,
  AlertTriangle,
  Boxes,
  QrCode,
  Edit2,
  Trash2,
  Check,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  DollarSign
} from 'lucide-react';

interface StockViewProps {
  products: Product[];
  serials: SerialItem[];
  company: CompanyConfig;
  currentUser: User | null;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onOpenStockIn: (productId?: string) => void;
}

export const StockView: React.FC<StockViewProps> = ({
  products,
  serials,
  company,
  currentUser,
  onSaveProduct,
  onDeleteProduct,
  onOpenStockIn,
}) => {
  // Search & Find filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'instock' | 'low' | 'out'>('all');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Serial codes viewer modal
  const [viewingProductSerials, setViewingProductSerials] = useState<Product | null>(null);
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered products logic (The "Find Option")
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return products.filter((p) => {
      // Find matches across SKU, Name, Category, Brand, or any of its attached serial codes
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        serials.some(
          (s) =>
            s.productId === p.id &&
            s.serialNumber.toLowerCase().includes(q)
        );

      const matchesCategory =
        selectedCategory === 'All' || p.category === selectedCategory;

      let matchesStatus = true;
      if (statusFilter === 'instock') {
        matchesStatus = p.currentStock > p.minStockAlert;
      } else if (statusFilter === 'low') {
        matchesStatus = p.currentStock > 0 && p.currentStock <= p.minStockAlert;
      } else if (statusFilter === 'out') {
        matchesStatus = p.currentStock <= 0;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, serials, searchQuery, selectedCategory, statusFilter]);

  // Totals for filtered selection
  const totalStockUnits = filteredProducts.reduce((acc, p) => acc + p.currentStock, 0);
  const totalValuation = filteredProducts.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0);

  // Handle Export to Excel
  const handleExportExcel = () => {
    exportStockToExcel(filteredProducts, serials, company, searchQuery);
  };

  // Handle Export to PDF
  const handleExportPDF = () => {
    exportStockToPDF(filteredProducts, serials, company, currentUser?.fullName || 'Saikat Rahman');
  };

  // Copy serial number helper
  const handleCopySerial = (serial: string) => {
    navigator.clipboard.writeText(serial);
    setCopiedSerial(serial);
    setTimeout(() => setCopiedSerial(null), 2000);
  };

  return (
    <div id="stock-view-container" className="space-y-4">
      {/* Top Header & Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-700" />
            <h1 className="text-lg font-bold text-slate-900">
              Stock Inventory &amp; Records
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock ledger with serial number tracking, valuation, and instant exports.
          </p>
        </div>

        {/* Export & Add Product Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Convert to Excel */}
          <button
            id="btn-stock-export-excel"
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            title="Download full stock and serial codes as Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Convert to Excel</span>
          </button>

          {/* Convert to PDF */}
          <button
            id="btn-stock-export-pdf"
            onClick={handleExportPDF}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            title="Download printable stock report as PDF"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Convert to PDF</span>
          </button>

          {/* Add Product Button */}
          <button
            id="btn-stock-add-new-product"
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* Find Option & Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Find input */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="input-find-stock-query"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find option: Search by product name, SKU, category, brand, or serial code..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs w-full md:w-auto shrink-0 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setStatusFilter('instock')}
              className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                statusFilter === 'instock'
                  ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setStatusFilter('low')}
              className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                statusFilter === 'low'
                  ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Low Alert
            </button>
            <button
              onClick={() => setStatusFilter('out')}
              className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                statusFilter === 'out'
                  ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-slate-600">
          <span className="text-[11px] font-semibold uppercase text-slate-400 mr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-0.5 rounded-full border text-xs whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Valuation Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-100 rounded-lg text-xs text-slate-600 border border-slate-200">
        <div>
          Showing <strong className="text-slate-900">{filteredProducts.length}</strong> items
          {searchQuery && <span> matching "<span className="text-blue-700 font-semibold">{searchQuery}</span>"</span>}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            Total Stock: <strong className="text-slate-900">{totalStockUnits} units</strong>
          </div>
          <div className="text-slate-300">|</div>
          <div>
            Filtered Valuation: <strong className="text-blue-800 font-mono font-bold">{company.currency} {totalValuation.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Products Stock Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No matching stock items found</p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your find query or category filters, or click "Add New Item".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="table-stock-inventory" className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none">
                <tr>
                  <th className="px-4 py-3">SKU &amp; Product Details</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Stock Level</th>
                  <th className="px-4 py-3 text-right">Cost Price</th>
                  <th className="px-4 py-3 text-right">Sale Price</th>
                  <th className="px-4 py-3 text-right">Stock Valuation</th>
                  <th className="px-4 py-3 text-center">Serial Numbers</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => {
                  const prodSerials = serials.filter((s) => s.productId === prod.id);
                  const availableSerials = prodSerials.filter((s) => s.status === 'available');

                  const isLow = prod.currentStock > 0 && prod.currentStock <= prod.minStockAlert;
                  const isOut = prod.currentStock <= 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition">
                      {/* Product Name & SKU */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{prod.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 border border-slate-200">
                            {prod.sku}
                          </span>
                          {prod.brand && <span>Brand: <strong>{prod.brand}</strong></span>}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {prod.category}
                        </span>
                      </td>

                      {/* Stock Level & Status Badge */}
                      <td className="px-4 py-3 text-center">
                        <div className="font-bold font-mono text-sm text-slate-900">
                          {prod.currentStock} <span className="text-[11px] font-normal text-slate-500">{prod.unit}</span>
                        </div>
                        <div className="mt-0.5">
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              In Stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cost Price */}
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {company.currency} {prod.costPrice.toLocaleString()}
                      </td>

                      {/* Sale Price */}
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                        {company.currency} {prod.salePrice.toLocaleString()}
                      </td>

                      {/* Valuation */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-blue-900">
                        {company.currency} {(prod.currentStock * prod.costPrice).toLocaleString()}
                      </td>

                      {/* Serial Numbers Button */}
                      <td className="px-4 py-3 text-center">
                        <button
                          id={`btn-view-serials-${prod.id}`}
                          onClick={() => setViewingProductSerials(prod)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer"
                          title="View individual serial numbers recorded for this product"
                        >
                          <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{availableSerials.length} Available</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`btn-stock-in-${prod.id}`}
                            onClick={() => onOpenStockIn(prod.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Stock Inward (Purchase)"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-edit-prod-${prod.id}`}
                            onClick={() => {
                              setEditingProduct(prod);
                              setIsProductModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition"
                            title="Edit Product Info"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {currentUser?.role === 'admin' && (
                            <button
                              id={`btn-del-prod-${prod.id}`}
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${prod.name}? This will remove it from inventory.`)) {
                                  onDeleteProduct(prod.id);
                                }
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition"
                              title="Delete Product (Admin Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Serial Numbers Inspector Modal */}
      {viewingProductSerials && (
        <div 
          id="modal-view-serials" 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Serial Numbers for {viewingProductSerials.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    SKU: {viewingProductSerials.sku} | In-Stock Units: {viewingProductSerials.currentStock}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingProductSerials(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {(() => {
                const prodSerials = serials.filter(
                  (s) => s.productId === viewingProductSerials.id
                );

                if (prodSerials.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-500">
                      <QrCode className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold">No serial codes stored for this item yet.</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Go to "Purchase (Stock In)" to register serial codes when receiving inventory.
                      </p>
                      <button
                        onClick={() => {
                          setViewingProductSerials(null);
                          onOpenStockIn(viewingProductSerials.id);
                        }}
                        className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold"
                      >
                        Stock In with Serials
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-500 flex justify-between items-center mb-1">
                      <span>Total Serial Codes Recorded: <strong>{prodSerials.length}</strong></span>
                      <span className="text-emerald-700 font-medium">
                        {prodSerials.filter((s) => s.status === 'available').length} In Stock (Available)
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      {prodSerials.map((s) => (
                        <div
                          key={s.id}
                          className={`p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                            s.status === 'sold' ? 'bg-slate-50 opacity-80' : 'bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 text-sm tracking-wide">
                                {s.serialNumber}
                              </span>
                              <button
                                onClick={() => handleCopySerial(s.serialNumber)}
                                className="text-slate-400 hover:text-slate-600 p-0.5"
                                title="Copy serial code"
                              >
                                {copiedSerial === s.serialNumber ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                  s.status === 'available'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : s.status === 'sold'
                                    ? 'bg-slate-200 text-slate-700'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {s.status}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                              <span>Purchased: <strong>{s.purchaseDate}</strong></span>
                              <span>Supplier: <strong>{s.supplier}</strong></span>
                              <span>Cost: {company.currency} {s.purchaseCost.toLocaleString()}</span>
                            </div>

                            {s.status === 'sold' && (
                              <div className="text-[11px] text-blue-700 bg-blue-50/80 p-1.5 rounded mt-1.5">
                                Sold on <strong>{s.saleDate}</strong> (Inv: #{s.saleInvoice}) to <strong>{s.customerName}</strong>
                                {s.customerPhone && ` (${s.customerPhone})`}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setViewingProductSerials(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <ProductFormModal
          product={editingProduct}
          company={company}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={(prod) => {
            onSaveProduct(prod);
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
};

// Modal for Adding or Editing a Product
interface ProductFormModalProps {
  product: Product | null;
  company: CompanyConfig;
  onClose: () => void;
  onSave: (product: Product) => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  company,
  onClose,
  onSave,
}) => {
  const [sku, setSku] = useState(product?.sku || '');
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || 'Hardware');
  const [brand, setBrand] = useState(product?.brand || '');
  const [unit, setUnit] = useState(product?.unit || 'Pcs');
  const [costPrice, setCostPrice] = useState(product?.costPrice || 0);
  const [salePrice, setSalePrice] = useState(product?.salePrice || 0);
  const [minStockAlert, setMinStockAlert] = useState(product?.minStockAlert || 2);
  const [description, setDescription] = useState(product?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) return;

    const newOrUpdated: Product = {
      id: product?.id || `prod-${Date.now()}`,
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category: category.trim(),
      brand: brand.trim(),
      unit: unit.trim() || 'Pcs',
      costPrice: Number(costPrice) || 0,
      salePrice: Number(salePrice) || 0,
      currentStock: product?.currentStock || 0,
      minStockAlert: Number(minStockAlert) || 1,
      description: description.trim(),
      createdAt: product?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newOrUpdated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">
            {product ? 'Edit Product Details' : 'Add New Product to Inventory'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Item Code / SKU *
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. CPU-INT-14700K"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Intel, Asus, Samsung"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Product Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Intel Core i7-14700K 20-Core Processor"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Processors, Storage, RAM..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Unit of Measure
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
              >
                <option value="Pcs">Pcs (Pieces)</option>
                <option value="Box">Box</option>
                <option value="Kit">Kit / Set</option>
                <option value="Meter">Meter</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Cost Price ({company.currency})
              </label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Sale Price ({company.currency})
              </label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Min Stock Alert
              </label>
              <input
                type="number"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Specification / Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical specifications, socket, warranty details..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-xs transition cursor-pointer"
            >
              {product ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
