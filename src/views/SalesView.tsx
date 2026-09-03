import React, { useState, useEffect } from 'react';
import { Product, SerialItem, SaleTransaction, CompanyConfig, User } from '../types/inventory';
import {
  ArrowUpFromLine,
  QrCode,
  User as UserIcon,
  Phone,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Printer,
  Calendar,
  CreditCard,
  Building2,
  Check,
  Search,
  FileText,
  Eye,
  Download,
  History,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { A4InvoiceSheet } from '../components/A4InvoiceSheet';
import { A4InvoiceModal } from '../components/A4InvoiceModal';
import { downloadInvoicePDF } from '../utils/exportUtils';

interface SalesViewProps {
  products: Product[];
  serials: SerialItem[];
  company: CompanyConfig;
  currentUser: User | null;
  sales?: SaleTransaction[];
  onRecordSale: (
    sale: SaleTransaction,
    updatedSerials: SerialItem[],
    updatedProducts: Product[]
  ) => void;
  onNavigateToStock: () => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  products,
  serials,
  company,
  currentUser,
  sales = [],
  onRecordSale,
  onNavigateToStock,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'history'>('create');
  const [historySearch, setHistorySearch] = useState('');

  // Invoice creation form state
  const [invoiceNumber, setInvoiceNumber] = useState(
    `SINV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Bank Transfer' | 'Mobile Pay' | 'Credit'>('Cash');
  const [notes, setNotes] = useState('Official store invoice with serial warranty record.');

  const [selectedProductId, setSelectedProductId] = useState(
    products[0]?.id || ''
  );
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [selectedSerialNumbers, setSelectedSerialNumbers] = useState<string[]>([]);
  const [serialSearchFilter, setSerialSearchFilter] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Completed sale in current session
  const [completedSale, setCompletedSale] = useState<SaleTransaction | null>(null);

  // Modal inspection state
  const [modalSale, setModalSale] = useState<SaleTransaction | null>(null);
  const [modalMode, setModalMode] = useState<'paper' | 'pdf'>('paper');

  // Available serials for selected product
  const availableSerialsForProduct = serials.filter(
    (s) => s.productId === selectedProductId && s.status === 'available'
  );

  // Update sale price when product selected
  useEffect(() => {
    const p = products.find((prod) => prod.id === selectedProductId);
    if (p) {
      setUnitPrice(p.salePrice);
      setSelectedSerialNumbers([]);
      setFormError(null);
    }
  }, [selectedProductId, products]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const quantityToSell = selectedSerialNumbers.length;
  const totalAmount = quantityToSell * unitPrice;

  // Toggle selection of a serial code
  const toggleSerialSelection = (serialNumber: string) => {
    setFormError(null);
    if (selectedSerialNumbers.includes(serialNumber)) {
      setSelectedSerialNumbers(selectedSerialNumbers.filter((s) => s !== serialNumber));
    } else {
      setSelectedSerialNumbers([...selectedSerialNumbers, serialNumber]);
    }
  };

  // Quick select all available
  const selectAllAvailable = () => {
    setFormError(null);
    setSelectedSerialNumbers(availableSerialsForProduct.map((s) => s.serialNumber));
  };

  const clearSelection = () => {
    setSelectedSerialNumbers([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (selectedSerialNumbers.length === 0) {
      setFormError('Please select at least one available serial code for this sale.');
      return;
    }

    if (!customerName.trim()) {
      setFormError('Customer Name is required to track product warranty and ownership.');
      return;
    }

    setFormError(null);

    // Mark serials as sold
    const updatedSerials = serials.map((s) => {
      if (selectedSerialNumbers.includes(s.serialNumber)) {
        return {
          ...s,
          status: 'sold' as const,
          saleInvoice: invoiceNumber,
          saleDate,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          salePrice: unitPrice,
        };
      }
      return s;
    });

    // Deduct stock from product
    const updatedProducts = products.map((p) => {
      if (p.id === selectedProduct.id) {
        return {
          ...p,
          currentStock: Math.max(0, p.currentStock - quantityToSell),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    // Create Sale Transaction
    const saleTx: SaleTransaction = {
      id: `sale-${Date.now()}`,
      invoiceNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      date: saleDate,
      paymentMethod,
      totalAmount,
      notes,
      soldBy: currentUser?.username || 'admin',
      createdAt: new Date().toISOString(),
      items: [
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          sku: selectedProduct.sku,
          quantity: quantityToSell,
          unitPrice,
          serials: selectedSerialNumbers,
        },
      ],
    };

    onRecordSale(saleTx, updatedSerials, updatedProducts);
    setCompletedSale(saleTx);
  };

  const startNewSale = () => {
    setCompletedSale(null);
    setInvoiceNumber(`SINV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setCustomerName('');
    setCustomerPhone('');
    setSelectedSerialNumbers([]);
    setFormError(null);
  };

  const handleOpenPdfModal = (sale: SaleTransaction) => {
    setModalSale(sale);
    setModalMode('pdf');
  };

  const handleOpenPaperModal = (sale: SaleTransaction) => {
    setModalSale(sale);
    setModalMode('paper');
  };

  // Filter history sales
  const filteredSales = sales.filter((s) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    const matchesInvoice = s.invoiceNumber.toLowerCase().includes(q);
    const matchesCustomer = s.customerName.toLowerCase().includes(q);
    const matchesPhone = s.customerPhone?.toLowerCase().includes(q);
    const matchesSerial = s.items.some((item) =>
      item.serials.some((sn) => sn.toLowerCase().includes(q))
    );
    const matchesProduct = s.items.some((item) =>
      item.productName.toLowerCase().includes(q)
    );
    return matchesInvoice || matchesCustomer || matchesPhone || matchesSerial || matchesProduct;
  });

  return (
    <div id="sales-view-container" className="space-y-5">
      {/* Top Header & Navigation */}
      <div className="no-print bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <ArrowUpFromLine className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                Sales Billing &amp; A4 Tax Invoicing
              </h1>
              <p className="text-xs text-slate-500">
                Generate official full A4 paper invoices, view vector PDFs, track serial warranties, and record customer orders.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sub-tab switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              id="tab-new-sale"
              onClick={() => {
                setActiveSubTab('create');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'create'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              <span>New Sale Billing</span>
            </button>
            <button
              id="tab-invoice-history"
              onClick={() => {
                setActiveSubTab('history');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-white text-blue-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Invoices History</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
                {sales.length}
              </span>
            </button>
          </div>

          <button
            onClick={onNavigateToStock}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 transition underline cursor-pointer hidden sm:inline"
          >
            &larr; Stock View
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: CREATE SALE / CURRENT COMPLETED SALE */}
      {activeSubTab === 'create' && (
        <>
          {completedSale ? (
            /* COMPLETED SALE: RENDER FULL A4 INVOICE SHEET WITH PDF VIEW */
            <div className="space-y-4">
              <div className="no-print p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Sale Invoice #{completedSale.invoiceNumber} recorded!</span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Stock decremented, serial warranty registered to customer, and full A4 tax invoice ready.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Primary Requested Button: View as PDF */}
                  <button
                    id="btn-view-pdf-top"
                    onClick={() => handleOpenPdfModal(completedSale)}
                    className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  >
                    <FileText className="w-4 h-4 text-rose-200" />
                    <span>View as PDF</span>
                  </button>

                  <button
                    onClick={startNewSale}
                    className="px-3.5 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition"
                  >
                    + Next Sale Billing
                  </button>
                </div>
              </div>

              {/* True A4 Paper Invoice Sheet */}
              <A4InvoiceSheet
                sale={completedSale}
                company={company}
                onViewAsPdf={() => handleOpenPdfModal(completedSale)}
                onNewSale={startNewSale}
                showToolbar={true}
              />
            </div>
          ) : (
            /* SALE ORDER ENTRY FORM */
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              {/* Form header */}
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Dispatch Order &amp; Invoice Billing Details
                  </h2>
                  <p className="text-xs text-slate-500">
                    Enter customer info and select serial-tracked stock units for invoice dispatch.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 bg-white border border-slate-200 text-blue-900 rounded-lg shadow-2xs">
                  #{invoiceNumber}
                </span>
              </div>

              {/* Form Error Message */}
              {formError && (
                <div className="m-5 mb-0 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="p-5 space-y-5">
                {/* Customer Information (Crucial for Warranty tracking) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Customer Full Name *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        setFormError(null);
                      }}
                      placeholder="e.g. Ashiqur Rahman (Studio 9)"
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> Customer Phone / Mobile *
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. +880 1712-445566"
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-slate-400" /> Invoice Number
                    </label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono"
                    />
                  </div>
                </div>

                {/* Date & Payment Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Sale Date
                    </label>
                    <input
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
                    >
                      <option value="Cash">Cash On Counter</option>
                      <option value="Card">Credit / Debit Card POS</option>
                      <option value="Bank Transfer">Direct Bank Transfer</option>
                      <option value="Mobile Pay">bKash / Nagad Mobile Pay</option>
                      <option value="Credit">Customer Credit (Due)</option>
                    </select>
                  </div>
                </div>

                {/* Product Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Select Product to Sell *
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {company.currency} {p.salePrice.toLocaleString()} ({p.currentStock} in stock)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Selling Price per Unit ({company.currency})
                    </label>
                    <input
                      type="number"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Math.max(0, Number(e.target.value)))}
                      min="0"
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono"
                    />
                  </div>
                </div>

                {/* Serial Codes Selection (Critical for Hardware Stock) */}
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-blue-600" />
                        <span>Available Serial Numbers for Dispatch ({availableSerialsForProduct.length} in stock)</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Click on each serial code physically being handed over. Serial numbers will be printed on the A4 invoice.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllAvailable}
                        disabled={availableSerialsForProduct.length === 0}
                        className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 cursor-pointer disabled:opacity-40"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={clearSelection}
                        disabled={selectedSerialNumbers.length === 0}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer disabled:opacity-40"
                      >
                        Clear Selection ({selectedSerialNumbers.length})
                      </button>
                    </div>
                  </div>

                  {availableSerialsForProduct.length === 0 ? (
                    <div className="p-6 text-center bg-white rounded-lg border border-dashed border-slate-300 text-slate-500 text-xs">
                      <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
                      <p className="font-semibold text-slate-700">No available serial numbers found in warehouse.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Please perform a Stock Inward first to register serial numbers for this product.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* Quick filter within available serials */}
                      {availableSerialsForProduct.length > 4 && (
                        <div className="mb-2 relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            value={serialSearchFilter}
                            onChange={(e) => setSerialSearchFilter(e.target.value)}
                            placeholder="Search serial number..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-600 font-mono"
                          />
                        </div>
                      )}

                      {/* Serial codes selection grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 border border-slate-200 rounded-lg bg-white">
                        {availableSerialsForProduct
                          .filter((s) =>
                            !serialSearchFilter ||
                            s.serialNumber.toLowerCase().includes(serialSearchFilter.toLowerCase())
                          )
                          .map((s) => {
                            const isSelected = selectedSerialNumbers.includes(s.serialNumber);

                            return (
                              <div
                                key={s.id}
                                onClick={() => toggleSerialSelection(s.serialNumber)}
                                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs font-medium'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="font-mono font-bold tracking-wide text-xs truncate">
                                    {s.serialNumber}
                                  </div>
                                  <div className="text-[10px] text-slate-500 truncate">
                                    Inward: {s.purchaseDate} | Sup: {s.supplier}
                                  </div>
                                </div>
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ml-2 ${
                                    isSelected
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3" />}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Selection Summary Box */}
                  <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      Units to Dispatch: <strong className="text-slate-900 text-sm font-mono">{quantityToSell}</strong>
                    </div>
                    <div>
                      Invoice Total: <strong className="text-emerald-700 text-base font-bold font-mono">{company.currency} {totalAmount.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Submit */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Sales Officer: <strong className="text-slate-800">{currentUser?.fullName}</strong> ({company.branchLocation})
                </div>

                <button
                  id="btn-submit-sales"
                  type="submit"
                  disabled={quantityToSell === 0 || !customerName.trim()}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                    quantityToSell > 0 && customerName.trim()
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  <ArrowUpFromLine className="w-4 h-4" />
                  <span>Complete Sale &amp; Generate A4 Invoice</span>
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* SUB-TAB 2: INVOICES HISTORY (Browse, View as PDF, or Print Any Past Invoice) */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <span>Sales Invoices Registry &amp; A4 Documents</span>
              </h2>
              <p className="text-xs text-slate-500">
                All completed sales transactions. View, reprint, or download official A4 PDF invoices.
              </p>
            </div>

            {/* History Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search invoice, customer, serial..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          {filteredSales.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-medium">No sales invoices found matching your search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer Info</th>
                    <th className="px-4 py-3">Items &amp; Serials</th>
                    <th className="px-4 py-3 text-right">Total Amount</th>
                    <th className="px-4 py-3 text-center">Payment</th>
                    <th className="px-4 py-3 text-center">A4 / PDF Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((sale) => {
                    const totalItemsCount = sale.items.reduce((acc, i) => acc + i.quantity, 0);
                    const totalSerialsCount = sale.items.reduce((acc, i) => acc + (i.serials?.length || 0), 0);

                    return (
                      <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-mono font-bold text-blue-900">
                          #{sale.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">
                          {sale.date}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{sale.customerName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {sale.customerPhone || 'No contact provided'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-800 truncate max-w-xs font-medium">
                            {sale.items.map((i) => i.productName).join(', ')}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded border border-blue-200 font-semibold">
                              {totalItemsCount} pcs
                            </span>
                            {totalSerialsCount > 0 && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 font-semibold">
                                {totalSerialsCount} Serials Tracked
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {company.currency} {sale.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View as PDF Button */}
                            <button
                              onClick={() => handleOpenPdfModal(sale)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Open interactive vector PDF viewer"
                            >
                              <FileText className="w-3 h-3 text-rose-600" />
                              <span>View as PDF</span>
                            </button>

                            {/* View A4 Paper Sheet */}
                            <button
                              onClick={() => handleOpenPaperModal(sale)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="View A4 Paper Layout"
                            >
                              <Eye className="w-3 h-3 text-blue-700" />
                              <span>A4 Sheet</span>
                            </button>

                            {/* Direct Download PDF */}
                            <button
                              onClick={() => downloadInvoicePDF(sale, company)}
                              className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
                              title="Download PDF file"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
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
      )}

      {/* A4 Invoice & PDF Viewer Modal */}
      <A4InvoiceModal
        isOpen={Boolean(modalSale)}
        sale={modalSale}
        company={company}
        onClose={() => setModalSale(null)}
        defaultViewMode={modalMode}
      />
    </div>
  );
};
