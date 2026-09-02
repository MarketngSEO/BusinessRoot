import React, { useState, useMemo } from 'react';
import { Product, SerialItem, CompanyConfig } from '../types/inventory';
import { Search, X, QrCode, Boxes, ArrowRight } from 'lucide-react';
import { NavTab } from './Sidebar';

interface QuickFindModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  serials: SerialItem[];
  company: CompanyConfig;
  onNavigate: (tab: NavTab) => void;
}

export const QuickFindModal: React.FC<QuickFindModalProps> = ({
  isOpen,
  onClose,
  products,
  serials,
  company,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return { matchedProducts: [], matchedSerials: [] };

    const matchedProducts = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
    );

    const matchedSerials = serials.filter(
      (s) =>
        s.serialNumber.toLowerCase().includes(q) ||
        s.sku.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q))
    );

    return { matchedProducts, matchedSerials };
  }, [query, products, serials]);

  if (!isOpen) return null;

  return (
    <div 
      id="modal-quick-find"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 px-4"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-3 border-b border-slate-200 flex items-center gap-2.5">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Universal Find: Type serial number, product name, or SKU..."
            autoFocus
            className="flex-1 text-sm bg-transparent border-none outline-hidden text-slate-900 placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs hover:bg-slate-200 font-medium"
          >
            Esc
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 text-xs">
          {!query.trim() ? (
            <div className="text-center py-8 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-medium text-slate-600">Start typing to find anything in the system</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Search across all registered products, SKU codes, and customer serial numbers.
              </p>
            </div>
          ) : results.matchedProducts.length === 0 && results.matchedSerials.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No matching products or serial codes found for "{query}".
            </div>
          ) : (
            <>
              {/* Matched Products */}
              {results.matchedProducts.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-blue-600" />
                    <span>Matching Products ({results.matchedProducts.length})</span>
                  </div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {results.matchedProducts.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onClose();
                          onNavigate('stock');
                        }}
                        className="p-2.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            SKU: {p.sku} | In Stock: <strong>{p.currentStock} {p.unit}</strong>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-900">
                            {company.currency} {p.salePrice.toLocaleString()}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Serial Codes */}
              {results.matchedSerials.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Matching Serial Numbers ({results.matchedSerials.length})</span>
                  </div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {results.matchedSerials.slice(0, 5).map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          onClose();
                          onNavigate('serials');
                        }}
                        className="p-2.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {s.serialNumber}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase ${
                                s.status === 'available'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {s.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 truncate mt-0.5">
                            {s.productName}
                          </div>
                          {s.status === 'sold' && s.customerName && (
                            <div className="text-[10px] text-blue-700 mt-0.5">
                              Sold to: {s.customerName} (Inv: #{s.saleInvoice})
                            </div>
                          )}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
