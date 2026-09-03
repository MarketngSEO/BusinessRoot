import React, { useState, useMemo } from 'react';
import { SerialItem, Product, CompanyConfig, User, SaleTransaction } from '../types/inventory';
import {
  QrCode,
  Search,
  CheckCircle,
  Clock,
  ShieldCheck,
  User as UserIcon,
  Building,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Tag,
  ArrowRight,
  FileText
} from 'lucide-react';

interface SerialTrackerViewProps {
  serials: SerialItem[];
  products: Product[];
  company: CompanyConfig;
  currentUser: User | null;
  sales?: SaleTransaction[];
  onUpdateSerialStatus: (serialId: string, newStatus: SerialItem['status']) => void;
  onViewInvoice?: (sale: SaleTransaction, mode?: 'paper' | 'pdf') => void;
}

export const SerialTrackerView: React.FC<SerialTrackerViewProps> = ({
  serials,
  products,
  company,
  currentUser,
  sales = [],
  onUpdateSerialStatus,
  onViewInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'sold' | 'defective'>('all');
  const [selectedSerial, setSelectedSerial] = useState<SerialItem | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Filtered serials
  const filteredSerials = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return serials.filter((s) => {
      const matchesQuery =
        !q ||
        s.serialNumber.toLowerCase().includes(q) ||
        s.productName.toLowerCase().includes(q) ||
        s.sku.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.supplier && s.supplier.toLowerCase().includes(q)) ||
        (s.saleInvoice && s.saleInvoice.toLowerCase().includes(q)) ||
        (s.purchaseInvoice && s.purchaseInvoice.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [serials, searchTerm, statusFilter]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const activeSerial = selectedSerial || filteredSerials[0] || null;

  // Calculate warranty expiry date
  const getWarrantyInfo = (s: SerialItem) => {
    if (!s.warrantyMonths || s.warrantyMonths === 0) return { text: 'No Warranty', isValid: false };
    const baseDateStr = s.saleDate || s.purchaseDate;
    if (!baseDateStr) return { text: `${s.warrantyMonths} Months`, isValid: true };

    const baseDate = new Date(baseDateStr);
    const expiryDate = new Date(baseDate.setMonth(baseDate.getMonth() + s.warrantyMonths));
    const isStillValid = expiryDate > new Date();

    return {
      text: `${s.warrantyMonths} Months (Valid until ${expiryDate.toISOString().split('T')[0]})`,
      isValid: isStillValid,
      expiryDateStr: expiryDate.toISOString().split('T')[0],
    };
  };

  return (
    <div id="serial-tracker-container" className="space-y-4">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-700">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              Serial Code Lifecycle &amp; Warranty Tracker
            </h1>
            <p className="text-xs text-slate-500">
              Search any serial number or barcode to inspect procurement history, customer sale, and warranty.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold font-mono">
            Total Serials: {serials.length}
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold font-mono">
            {serials.filter((s) => s.status === 'available').length} In Stock
          </span>
          <span className="px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold font-mono">
            {serials.filter((s) => s.status === 'sold').length} Sold
          </span>
        </div>
      </div>

      {/* Main Grid: Left List (2 cols) & Right Lifecycle Timeline (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Search & Serial Table (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Find input and status buttons */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                id="input-search-serial-codes"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Scan or find serial number, customer name, invoice..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-md transition font-medium cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Serials ({serials.length})
              </button>
              <button
                onClick={() => setStatusFilter('available')}
                className={`px-3 py-1 rounded-md transition font-medium cursor-pointer ${
                  statusFilter === 'available'
                    ? 'bg-emerald-700 text-white font-semibold'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Available (In Stock)
              </button>
              <button
                onClick={() => setStatusFilter('sold')}
                className={`px-3 py-1 rounded-md transition font-medium cursor-pointer ${
                  statusFilter === 'sold'
                    ? 'bg-blue-700 text-white font-semibold'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                Sold (Customer Dispatched)
              </button>
              <button
                onClick={() => setStatusFilter('defective')}
                className={`px-3 py-1 rounded-md transition font-medium cursor-pointer ${
                  statusFilter === 'defective'
                    ? 'bg-rose-700 text-white font-semibold'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Defective / RMA
              </button>
            </div>
          </div>

          {/* Table list */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs text-slate-500 font-medium">
              <span>Showing {filteredSerials.length} serial records</span>
              <span>Click a row to trace details</span>
            </div>

            <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100">
              {filteredSerials.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No serial codes found matching "{searchTerm}".
                </div>
              ) : (
                filteredSerials.map((s) => {
                  const isSelected = activeSerial?.id === s.id;

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSerial(s)}
                      className={`p-3 text-xs cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50/90 border-l-4 border-l-blue-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {s.serialNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              s.status === 'available'
                                ? 'bg-emerald-100 text-emerald-800'
                                : s.status === 'sold'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {s.status}
                          </span>
                        </div>
                        <div className="font-medium text-slate-700 truncate mt-0.5">
                          {s.productName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          SKU: {s.sku} | Inward: #{s.purchaseInvoice}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {s.status === 'sold' ? (
                          <div className="text-[11px] text-blue-700">
                            <span className="font-semibold block">{s.customerName}</span>
                            <span className="text-[10px] text-slate-500">Sold: {s.saleDate}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded">
                            In Warehouse
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Full Lifecycle Trace Inspector (5 cols) */}
        <div className="lg:col-span-5">
          {activeSerial ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4 sticky top-20">
              <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Serial Lifecycle Record
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base font-bold font-mono text-slate-900">
                      {activeSerial.serialNumber}
                    </span>
                    <button
                      onClick={() => handleCopy(activeSerial.serialNumber)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      title="Copy serial number"
                    >
                      {copiedText === activeSerial.serialNumber ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="text-xs font-semibold text-blue-900 mt-1">
                    {activeSerial.productName}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    SKU: {activeSerial.sku}
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                    activeSerial.status === 'available'
                      ? 'bg-emerald-100 text-emerald-800'
                      : activeSerial.status === 'sold'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {activeSerial.status}
                </span>
              </div>

              {/* Lifecycle Step 1: Procurement / Inward */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Procurement &amp; Inward</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-500 block">Supplier:</span>
                    <strong className="text-slate-800">{activeSerial.supplier}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Inward Date:</span>
                    <strong className="text-slate-800">{activeSerial.purchaseDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Purchase Invoice:</span>
                    <span className="font-mono text-slate-700">{activeSerial.purchaseInvoice}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Unit Cost:</span>
                    <span className="font-mono text-slate-700 font-bold">
                      {company.currency} {activeSerial.purchaseCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lifecycle Step 2: Customer Outward & Sale (If sold) */}
              <div className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                activeSerial.status === 'sold'
                  ? 'bg-blue-50/70 border-blue-200'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}>
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Sales Order &amp; Dispatch</span>
                </div>

                {activeSerial.status === 'sold' ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-500 block">Customer Name:</span>
                      <strong className="text-slate-900">{activeSerial.customerName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Phone:</span>
                      <span className="font-mono text-slate-800">{activeSerial.customerPhone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Sale Invoice:</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-blue-900 font-bold">#{activeSerial.saleInvoice}</span>
                        {onViewInvoice && (
                          <button
                            type="button"
                            onClick={() => {
                              const match = sales.find(s => s.invoiceNumber === activeSerial.saleInvoice);
                              if (match) {
                                onViewInvoice(match, 'pdf');
                              } else {
                                // Create synthetic sale for viewing
                                const fallbackSale: SaleTransaction = {
                                  id: `sale-serial-${activeSerial.id}`,
                                  invoiceNumber: activeSerial.saleInvoice || 'SINV-RECORD',
                                  customerName: activeSerial.customerName || 'Retail Customer',
                                  customerPhone: activeSerial.customerPhone,
                                  date: activeSerial.saleDate || '2026-02-20',
                                  paymentMethod: 'Cash',
                                  totalAmount: activeSerial.salePrice || 0,
                                  soldBy: 'Distribution Staff',
                                  createdAt: new Date().toISOString(),
                                  items: [{
                                    productId: activeSerial.productId,
                                    productName: activeSerial.productName,
                                    sku: activeSerial.sku,
                                    quantity: 1,
                                    unitPrice: activeSerial.salePrice || 0,
                                    serials: [activeSerial.serialNumber],
                                  }]
                                };
                                onViewInvoice(fallbackSale, 'pdf');
                              }
                            }}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 hover:bg-rose-200 transition cursor-pointer flex items-center gap-0.5"
                            title="View official A4 PDF invoice"
                          >
                            <FileText className="w-2.5 h-2.5" />
                            <span>PDF</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Sale Date:</span>
                      <span className="text-slate-800 font-medium">{activeSerial.saleDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Billed Price:</span>
                      <span className="font-mono text-emerald-700 font-bold">
                        {company.currency} {activeSerial.salePrice?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 pt-1 italic">
                    Not sold yet. Item currently available in warehouse inventory.
                  </p>
                )}
              </div>

              {/* Lifecycle Step 3: Warranty Coverage */}
              <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>3. Warranty Status</span>
                </div>
                {(() => {
                  const w = getWarrantyInfo(activeSerial);
                  return (
                    <div className="text-[11px] pt-1">
                      <div className="text-slate-700 font-medium">{w.text}</div>
                      <div className="mt-1">
                        {w.isValid ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Active Warranty Protection
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-700">
                            Expired / Out of Warranty
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Quick Status Override (e.g. mark Defective / Return) */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Update Serial Status
                </label>
                <div className="flex items-center gap-2">
                  {activeSerial.status !== 'available' && (
                    <button
                      onClick={() => onUpdateSerialStatus(activeSerial.id, 'available')}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold cursor-pointer"
                    >
                      Return to Stock
                    </button>
                  )}
                  {activeSerial.status !== 'defective' && (
                    <button
                      onClick={() => onUpdateSerialStatus(activeSerial.id, 'defective')}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold cursor-pointer"
                    >
                      Mark Defective / RMA
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              Select a serial code from the list to view its complete lifecycle.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
