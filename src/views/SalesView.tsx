import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, SerialItem, PurchaseTransaction, SaleTransaction, CompanyConfig, User } from '../types/inventory';
import {
  ArrowUpFromLine,
  QrCode,
  User as UserIcon,
  Phone,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CreditCard,
  Building2,
  Check,
  Search,
  FileText,
  Eye,
  Download,
  History,
  Lock,
  Boxes,
  TrendingUp,
  AlertTriangle,
  PackageCheck,
  Tag,
  Truck,
  Plus
} from 'lucide-react';
import { A4InvoiceSheet } from '../components/A4InvoiceSheet';
import { A4InvoiceModal } from '../components/A4InvoiceModal';
import { downloadInvoicePDF, generateNextUniqueInvoiceNumber } from '../utils/exportUtils';

interface SalesViewProps {
  products: Product[];
  serials: SerialItem[];
  purchases?: PurchaseTransaction[];
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
  purchases = [],
  company,
  currentUser,
  sales = [],
  onRecordSale,
  onNavigateToStock,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'history'>('create');
  const [historySearch, setHistorySearch] = useState('');

  // 1. AUTOMATIC & UNIQUE INVOICE NUMBER (Locked, cannot be changed)
  const [invoiceNumber, setInvoiceNumber] = useState<string>(() =>
    generateNextUniqueInvoiceNumber(sales)
  );

  // Sync invoice number if sales list updates
  useEffect(() => {
    if (!completedSale) {
      setInvoiceNumber(generateNextUniqueInvoiceNumber(sales));
    }
  }, [sales]);

  // Customer & Payment Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Bank Transfer' | 'Mobile Pay' | 'Credit'>('Cash');
  const [notes, setNotes] = useState('Official store invoice with serial warranty record.');

  // 2. PRODUCT SEARCH & SELECTION FROM IN-STOCK SUGGESTIONS
  // Find first product with available stock
  const initialAvailableProduct = products.find(
    (p) => p.currentStock > 0 && serials.some((s) => s.productId === p.id && s.status === 'available')
  ) || products[0];

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialAvailableProduct?.id || ''
  );
  const [productSearchTerm, setProductSearchTerm] = useState(
    initialAvailableProduct?.name || ''
  );
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productSearchContainerRef = useRef<HTMLDivElement>(null);

  // 3. SELLING PRICE STATE (Must not be less than product cost)
  const [unitPrice, setUnitPrice] = useState<number>(initialAvailableProduct?.salePrice || 0);
  const [selectedSerialNumbers, setSelectedSerialNumbers] = useState<string[]>([]);
  const [serialSearchFilter, setSerialSearchFilter] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Completed sale in current session
  const [completedSale, setCompletedSale] = useState<SaleTransaction | null>(null);

  // Modal inspection state
  const [modalSale, setModalSale] = useState<SaleTransaction | null>(null);
  const [modalMode, setModalMode] = useState<'paper' | 'pdf'>('paper');

  // Selected product object
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Close product search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productSearchContainerRef.current &&
        !productSearchContainerRef.current.contains(event.target as Node)
      ) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update default price and clear serial selection when product changes
  useEffect(() => {
    if (selectedProduct) {
      setUnitPrice(selectedProduct.salePrice);
      setSelectedSerialNumbers([]);
      setFormError(null);
      setProductSearchTerm(selectedProduct.name);
    }
  }, [selectedProductId]);

  // Serials for the selected product currently available in stock
  const availableSerialsForProduct = useMemo(() => {
    if (!selectedProductId) return [];
    return serials.filter(
      (s) => s.productId === selectedProductId && s.status === 'available'
    );
  }, [selectedProductId, serials]);

  // 4. PURCHASE DATA / INWARD BATCHES FOR SELECTED PRODUCT
  // Groups available units by their purchase inward batch so user can click & select
  const purchaseBatches = useMemo(() => {
    if (!selectedProduct) return [];
    const batchMap = new Map<string, {
      purchaseInvoice: string;
      purchaseDate: string;
      supplier: string;
      purchaseCost: number;
      warrantyMonths: number;
      availableSerials: SerialItem[];
    }>();

    availableSerialsForProduct.forEach((s) => {
      const key = s.purchaseInvoice || 'INWARD-STOCK';
      if (!batchMap.has(key)) {
        const pTx = purchases.find((p) => p.invoiceNumber === key);
        batchMap.set(key, {
          purchaseInvoice: key,
          purchaseDate: s.purchaseDate || pTx?.date || 'N/A',
          supplier: s.supplier || pTx?.supplier || 'Authorized Supplier',
          purchaseCost: s.purchaseCost || selectedProduct.costPrice,
          warrantyMonths: s.warrantyMonths || 12,
          availableSerials: [],
        });
      }
      batchMap.get(key)!.availableSerials.push(s);
    });

    return Array.from(batchMap.values());
  }, [selectedProduct, availableSerialsForProduct, purchases]);

  // Product suggestions based on search term
  const suggestedProducts = useMemo(() => {
    if (!productSearchTerm.trim()) {
      return products;
    }
    const query = productSearchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }, [products, productSearchTerm]);

  // Cost and margin calculations
  const productCost = selectedProduct ? selectedProduct.costPrice : 0;
  const isPriceBelowCost = selectedProduct ? unitPrice < productCost : false;
  const profitMarginPerUnit = unitPrice - productCost;
  const profitMarginPercent = productCost > 0 ? Math.round((profitMarginPerUnit / productCost) * 100) : 0;

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

  // Select all available from a specific purchase batch
  const togglePurchaseBatchSerials = (batchSerials: SerialItem[]) => {
    setFormError(null);
    const batchSnList = batchSerials.map((s) => s.serialNumber);
    const allSelected = batchSnList.every((sn) => selectedSerialNumbers.includes(sn));

    if (allSelected) {
      // Deselect this batch
      setSelectedSerialNumbers(selectedSerialNumbers.filter((sn) => !batchSnList.includes(sn)));
    } else {
      // Add all from this batch
      const combined = Array.from(new Set([...selectedSerialNumbers, ...batchSnList]));
      setSelectedSerialNumbers(combined);
    }
  };

  // Quick select all available in warehouse
  const selectAllAvailable = () => {
    setFormError(null);
    setSelectedSerialNumbers(availableSerialsForProduct.map((s) => s.serialNumber));
  };

  const clearSelection = () => {
    setSelectedSerialNumbers([]);
  };

  // Handle selecting a suggested in-stock product
  const handleSelectSuggestedProduct = (prod: Product) => {
    const availableCount = serials.filter(
      (s) => s.productId === prod.id && s.status === 'available'
    ).length;

    if (prod.currentStock <= 0 || availableCount <= 0) {
      setFormError(`Product "${prod.name}" is currently Out of Stock (0 units available in warehouse).`);
      return;
    }

    setSelectedProductId(prod.id);
    setProductSearchTerm(prod.name);
    setUnitPrice(prod.salePrice);
    setSelectedSerialNumbers([]);
    setIsProductDropdownOpen(false);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setFormError('Please select a valid product available on stock.');
      return;
    }

    // STRICT CHECK 1: Product stock
    if (selectedProduct.currentStock <= 0 || availableSerialsForProduct.length === 0) {
      setFormError(`Cannot sell "${selectedProduct.name}" because it is out of stock.`);
      return;
    }

    // STRICT CHECK 2: Serial Selection
    if (selectedSerialNumbers.length === 0) {
      setFormError('Please click and select at least one available serial code from the purchase stock to sell.');
      return;
    }

    // STRICT CHECK 3: Selling Price cannot be less than cost
    if (unitPrice < productCost) {
      setFormError(
        `Pricing Rule: Selling price (${company.currency} ${unitPrice.toLocaleString()}) cannot be less than product purchase cost (${company.currency} ${productCost.toLocaleString()}).`
      );
      return;
    }

    if (!customerName.trim()) {
      setFormError('Customer Full Name is required to register warranty and dispatch A4 invoice.');
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
      invoiceNumber, // guaranteed unique, auto-generated
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
    // Auto-generate next sequential unique invoice number
    setInvoiceNumber(generateNextUniqueInvoiceNumber(sales));
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
                System-assigned unique invoices, live warehouse stock &amp; purchase verification, and cost-protected selling prices.
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
                    <span className="font-bold">Sale Invoice #{completedSale.invoiceNumber} successfully recorded!</span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Warehouse stock decremented, purchase-linked serial warranties registered to customer, and full A4 tax invoice ready.
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
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Dispatch Order &amp; Invoice Billing Details
                  </h2>
                  <p className="text-xs text-slate-500">
                    All sales originate strictly from inward warehouse purchases. Invoice numbers are sequential and locked.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Assigned Invoice:</span>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 bg-white border border-slate-300 text-blue-900 rounded-lg shadow-2xs flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>#{invoiceNumber}</span>
                  </span>
                </div>
              </div>

              {/* Form Error Message */}
              {formError && (
                <div className="m-5 mb-0 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="p-5 space-y-6">
                {/* 1. Customer & System Locked Invoice Section */}
                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>1. Customer &amp; Tax Invoice Registry</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Customer Full Name *
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

                    {/* Auto-created locked unique invoice number */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-slate-500" /> Invoice Number (Locked)
                        </label>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          Auto-Unique
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={invoiceNumber}
                          readOnly
                          title="Invoice numbers are automatically generated in sequence and permanently locked to guarantee unique audit records."
                          className="w-full pl-8 pr-3 py-2 text-xs bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-mono font-bold cursor-not-allowed select-all"
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        System-generated sequential number. Cannot be changed manually.
                      </p>
                    </div>
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

                {/* 2. PRODUCT SELECTION (Type to search & select from in-stock suggestions) */}
                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5 text-blue-600" />
                      <span>2. Product Selection (Live Warehouse Stock Check)</span>
                    </div>
                    {selectedProduct && (
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        selectedProduct.currentStock > 0 && availableSerialsForProduct.length > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {selectedProduct.currentStock > 0 ? `${selectedProduct.currentStock} Units Available` : 'Out of Stock'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    {/* Searchable Product Typeahead */}
                    <div className="md:col-span-2 relative" ref={productSearchContainerRef}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Type Product Name &amp; Select From Available Stock *
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="text"
                          value={productSearchTerm}
                          onFocus={() => setIsProductDropdownOpen(true)}
                          onChange={(e) => {
                            setProductSearchTerm(e.target.value);
                            setIsProductDropdownOpen(true);
                            setFormError(null);
                          }}
                          placeholder="Type product name (e.g. Intel, Asus, SSD)..."
                          className="w-full pl-9 pr-24 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                          className="absolute right-1.5 top-1.5 px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-semibold cursor-pointer shadow-2xs"
                        >
                          Browse Stock ({products.filter((p) => p.currentStock > 0).length})
                        </button>
                      </div>

                      {/* Dropdown suggestions list */}
                      {isProductDropdownOpen && (
                        <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-slate-300 shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100">
                          <div className="p-2 bg-slate-50 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                            <span>Available Warehouse Products (Click to select &amp; load stock)</span>
                            <span>Stock / Unit Cost</span>
                          </div>

                          {suggestedProducts.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400">
                              No matching products found in catalog. (Products can only be inwarded via Purchase).
                            </div>
                          ) : (
                            suggestedProducts.map((p) => {
                              const availableCount = serials.filter(
                                (s) => s.productId === p.id && s.status === 'available'
                              ).length;
                              const isInStock = p.currentStock > 0 && availableCount > 0;
                              const isCurrentSelected = p.id === selectedProductId;

                              return (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    if (isInStock) {
                                      handleSelectSuggestedProduct(p);
                                    }
                                  }}
                                  className={`p-3 text-xs transition flex items-center justify-between gap-3 ${
                                    !isInStock
                                      ? 'opacity-50 bg-slate-50 cursor-not-allowed'
                                      : isCurrentSelected
                                      ? 'bg-blue-50/80 cursor-pointer font-medium'
                                      : 'hover:bg-slate-50 cursor-pointer'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900 truncate">
                                        {p.name}
                                      </span>
                                      {isCurrentSelected && (
                                        <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded text-[10px] font-bold">
                                          Active
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                      SKU: {p.sku} | Brand: {p.brand} | Cat: {p.category}
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    {isInStock ? (
                                      <>
                                        <div className="flex items-center justify-end gap-1.5">
                                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                                            ✓ {availableCount} In Stock
                                          </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                          Cost: {company.currency} {p.costPrice.toLocaleString()} | Sale: {company.currency} {p.salePrice.toLocaleString()}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                                        Out of Stock (0 pcs)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}

                      {/* Currently selected product banner */}
                      {selectedProduct && (
                        <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-slate-700">
                              Selected: <strong className="text-slate-900">{selectedProduct.name}</strong> ({selectedProduct.sku})
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">
                            Warehouse Stock: <strong className="text-slate-800">{availableSerialsForProduct.length} Units</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 3. SELLING PRICE PER UNIT (CANNOT BE LESS THAN PRODUCT COST) */}
                    <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-800">
                          Selling Price per Unit *
                        </label>
                        <span className="text-[10px] font-mono text-slate-500 font-semibold">
                          Cost: {company.currency} {productCost.toLocaleString()}
                        </span>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          value={unitPrice}
                          min={productCost}
                          onChange={(e) => {
                            setUnitPrice(Number(e.target.value));
                            setFormError(null);
                          }}
                          required
                          className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border focus:ring-2 focus:bg-white text-slate-900 ${
                            isPriceBelowCost
                              ? 'border-rose-500 bg-rose-50/60 focus:ring-rose-500 text-rose-900'
                              : 'border-slate-300 bg-white focus:ring-blue-600'
                          }`}
                        />
                        <span className="absolute right-2.5 top-2 text-xs font-mono text-slate-400 font-bold">
                          {company.currency}
                        </span>
                      </div>

                      {/* Validation & Margin Display */}
                      {isPriceBelowCost ? (
                        <div className="p-2 bg-rose-100 border border-rose-300 rounded text-[11px] text-rose-900 flex items-start gap-1.5 font-medium leading-tight">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0 mt-0.5" />
                          <span>
                            <strong>Price Error:</strong> Cannot sell below product cost of {company.currency} {productCost.toLocaleString()}!
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-600">
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Margin: +{company.currency} {profitMarginPerUnit.toLocaleString()}</span>
                          </span>
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                            +{profitMarginPercent}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. PURCHASE INWARD DATA (Click & Select Batches / Serials) */}
                <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <span>Inward Purchase Batches &amp; Serials for this Product</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-mono font-bold">
                          {availableSerialsForProduct.length} Units in Stock
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Shows supplier purchase record, unit inward cost, and physical serial units. Click batches or serials to select.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllAvailable}
                        disabled={availableSerialsForProduct.length === 0}
                        className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 cursor-pointer disabled:opacity-40"
                      >
                        Select All ({availableSerialsForProduct.length})
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

                  {/* If no stock available */}
                  {availableSerialsForProduct.length === 0 ? (
                    <div className="p-6 text-center bg-white rounded-lg border border-dashed border-slate-300 text-slate-500 text-xs">
                      <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
                      <p className="font-semibold text-slate-700">No available serial numbers found in warehouse for this product.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Please perform a Stock Inward first in Purchase to add stock and serials.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Filter inside serials if large */}
                      {availableSerialsForProduct.length > 4 && (
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            value={serialSearchFilter}
                            onChange={(e) => setSerialSearchFilter(e.target.value)}
                            placeholder="Filter serial numbers in this product..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-600 font-mono"
                          />
                        </div>
                      )}

                      {/* Display Purchase Batches Grouped */}
                      <div className="space-y-3">
                        {purchaseBatches.map((batch) => {
                          const batchSerials = batch.availableSerials.filter(
                            (s) =>
                              !serialSearchFilter ||
                              s.serialNumber.toLowerCase().includes(serialSearchFilter.toLowerCase())
                          );

                          if (batchSerials.length === 0) return null;

                          const selectedCountInBatch = batchSerials.filter((s) =>
                            selectedSerialNumbers.includes(s.serialNumber)
                          ).length;
                          const isBatchFullySelected = selectedCountInBatch === batchSerials.length;

                          return (
                            <div
                              key={batch.purchaseInvoice}
                              className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-2.5 shadow-2xs"
                            >
                              {/* Purchase Batch Header Info */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <div className="p-1 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-200">
                                    INWARD: #{batch.purchaseInvoice}
                                  </div>
                                  <div className="text-xs text-slate-700">
                                    Supplier: <strong className="text-slate-900">{batch.supplier}</strong>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                                  <span>Date: <strong className="text-slate-700">{batch.purchaseDate}</strong></span>
                                  <span>Cost: <strong className="text-slate-800">{company.currency} {batch.purchaseCost.toLocaleString()}</strong></span>
                                  <span>Warranty: <strong className="text-slate-800">{batch.warrantyMonths} Mo</strong></span>

                                  {/* Quick Select Batch Button */}
                                  <button
                                    type="button"
                                    onClick={() => togglePurchaseBatchSerials(batchSerials)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                                      isBatchFullySelected
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                                    }`}
                                  >
                                    {isBatchFullySelected ? 'Deselect Batch' : `Select Batch (${batchSerials.length})`}
                                  </button>
                                </div>
                              </div>

                              {/* Serial Items within this batch */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {batchSerials.map((s) => {
                                  const isSelected = selectedSerialNumbers.includes(s.serialNumber);

                                  return (
                                    <div
                                      key={s.id}
                                      onClick={() => toggleSerialSelection(s.serialNumber)}
                                      className={`p-2 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between select-none ${
                                        isSelected
                                          ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-2xs font-bold ring-1 ring-blue-500'
                                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="min-w-0 pr-1">
                                        <div className="font-mono text-xs tracking-wide truncate">
                                          {s.serialNumber}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                                          Cost: {company.currency} {s.purchaseCost || batch.purchaseCost}
                                        </div>
                                      </div>
                                      <div
                                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ml-1.5 ${
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
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Selection Summary Box */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3">
                      <div>
                        Units to Dispatch: <strong className="text-slate-900 text-sm font-mono">{quantityToSell}</strong>
                      </div>
                      <span className="text-slate-300">|</span>
                      <div>
                        Unit Selling Price: <strong className="text-slate-900 font-mono">{company.currency} {unitPrice.toLocaleString()}</strong>
                      </div>
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
                  disabled={quantityToSell === 0 || !customerName.trim() || isPriceBelowCost}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                    quantityToSell > 0 && customerName.trim() && !isPriceBelowCost
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
