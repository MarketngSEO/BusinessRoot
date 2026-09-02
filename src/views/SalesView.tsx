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
  Search
} from 'lucide-react';

interface SalesViewProps {
  products: Product[];
  serials: SerialItem[];
  company: CompanyConfig;
  currentUser: User | null;
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
  onRecordSale,
  onNavigateToStock,
}) => {
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

  // Invoice preview state
  const [completedSale, setCompletedSale] = useState<SaleTransaction | null>(null);

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
    }
  }, [selectedProductId, products]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const quantityToSell = selectedSerialNumbers.length;
  const totalAmount = quantityToSell * unitPrice;

  // Toggle selection of a serial code
  const toggleSerialSelection = (serialNumber: string) => {
    if (selectedSerialNumbers.includes(serialNumber)) {
      setSelectedSerialNumbers(selectedSerialNumbers.filter((s) => s !== serialNumber));
    } else {
      setSelectedSerialNumbers([...selectedSerialNumbers, serialNumber]);
    }
  };

  // Quick select all available
  const selectAllAvailable = () => {
    setSelectedSerialNumbers(availableSerialsForProduct.map((s) => s.serialNumber));
  };

  const clearSelection = () => {
    setSelectedSerialNumbers([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (selectedSerialNumbers.length === 0) {
      alert('Please select at least one available serial code for this sale.');
      return;
    }

    if (!customerName.trim()) {
      alert('Customer Name is required to track product warranty and ownership.');
      return;
    }

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

  // Handle printing receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  const startNewSale = () => {
    setCompletedSale(null);
    setInvoiceNumber(`SINV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setCustomerName('');
    setCustomerPhone('');
    setSelectedSerialNumbers([]);
  };

  return (
    <div id="sales-view-container" className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <ArrowUpFromLine className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                Sales Order &amp; Stock Outward Billing
              </h1>
              <p className="text-xs text-slate-500">
                Dispatch items, record customer details, assign serial numbers, and print warranty receipt.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onNavigateToStock}
          className="text-xs font-semibold text-blue-700 hover:text-blue-800 transition underline cursor-pointer"
        >
          &larr; View Stock Inventory
        </button>
      </div>

      {/* If Completed Sale: Show Printable Invoice Receipt */}
      {completedSale ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Sale Invoice <strong>#{completedSale.invoiceNumber}</strong> successfully recorded! Inventory and serial tracking updated.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintReceipt}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={startNewSale}
                className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded text-xs font-semibold cursor-pointer"
              >
                New Sale
              </button>
            </div>
          </div>

          {/* Printable Invoice Card */}
          <div id="printable-sales-receipt" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm print:p-0 print:border-none">
            {/* Invoice Top Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{company.companyName}</h2>
                <p className="text-xs text-slate-500">{company.tagline}</p>
                <p className="text-xs text-slate-600 mt-1">{company.branchLocation}</p>
                <p className="text-xs text-slate-500">Phone: {company.phone} | VAT: {company.vatNumber}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold px-2 py-1 bg-slate-100 rounded text-slate-800 border border-slate-200">
                  OFFICIAL TAX INVOICE
                </span>
                <div className="text-sm font-bold text-blue-900 mt-2 font-mono">
                  #{completedSale.invoiceNumber}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Date: {completedSale.date}</div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                  Billed To:
                </span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{completedSale.customerName}</div>
                {completedSale.customerPhone && (
                  <div className="text-slate-600 mt-0.5 font-mono">Contact: {completedSale.customerPhone}</div>
                )}
              </div>
              <div className="text-right">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                  Payment Details:
                </span>
                <div className="font-medium text-slate-800 mt-0.5">Method: {completedSale.paymentMethod}</div>
                <div className="text-slate-500 mt-0.5">Handled By: {completedSale.soldBy}</div>
              </div>
            </div>

            {/* Line Items Table with Serial Codes */}
            <div className="py-4">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2">Item Description &amp; Serial Numbers</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedSale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3">
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        <div className="text-slate-500 text-[11px] font-mono">SKU: {item.sku}</div>
                        {/* Serial Codes printed for warranty claim */}
                        <div className="mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded text-[11px]">
                          <span className="font-semibold text-slate-700 block mb-1">
                            Assigned Serial Numbers (Keep for Warranty Claims):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {item.serials.map((sn) => (
                              <span key={sn} className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 font-bold text-blue-900">
                                {sn}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center font-bold font-mono">{item.quantity}</td>
                      <td className="py-3 text-right font-mono text-slate-700">
                        {company.currency} {item.unitPrice.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900">
                        {company.currency} {(item.quantity * item.unitPrice).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-800 text-xs font-bold">
                    <td colSpan={3} className="py-3 text-right text-slate-700 uppercase">
                      Total Invoice Amount:
                    </td>
                    <td className="py-3 text-right font-mono text-base text-blue-900">
                      {company.currency} {completedSale.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Footer notes & sign */}
            <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between items-end">
              <div>
                <p className="font-semibold text-slate-700">Terms &amp; Warranty Conditions:</p>
                <p>1. Warranty void if serial number label is damaged or missing.</p>
                <p>2. Keep this invoice for claiming manufacturer warranty replacement.</p>
              </div>
              <div className="text-center pt-8 border-t border-slate-300 w-44">
                <span className="text-slate-600 font-semibold block">Authorized Signature</span>
                <span className="text-[10px] text-slate-400">Computer Village ER</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Sale Order Form */
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
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
                  onChange={(e) => setCustomerName(e.target.value)}
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
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono"
                />
              </div>
            </div>

            {/* SELECT SPECIFIC SERIAL NUMBERS (CRUCIAL REQUIREMENT) */}
            <div className="pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    Pick Available Serial Number(s) for Customer *
                  </label>
                  <p className="text-xs text-slate-500">
                    Each selected serial code will be marked as SOLD and tied to this customer invoice.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllAvailable}
                    className="px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 rounded border border-slate-200 transition"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {availableSerialsForProduct.length === 0 ? (
                <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-center text-xs text-rose-700">
                  <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-1.5" />
                  <p className="font-semibold">No available serial numbers found for this product in stock!</p>
                  <p className="text-[11px] text-rose-600 mt-0.5">
                    Please receive inventory first under "Purchase (Stock In)" to register serial codes.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Quick filter within available serials */}
                  {availableSerialsForProduct.length > 5 && (
                    <div className="mb-2 relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={serialSearchFilter}
                        onChange={(e) => setSerialSearchFilter(e.target.value)}
                        placeholder="Filter serials..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md"
                      />
                    </div>
                  )}

                  {/* Serial codes selection grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-lg bg-slate-50">
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
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
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
              <div className="mt-3 p-3 bg-slate-100 rounded-lg flex items-center justify-between text-xs">
                <div>
                  Quantity to Dispatch: <strong className="text-slate-900 text-sm font-mono">{quantityToSell}</strong> units
                </div>
                <div>
                  Total Bill: <strong className="text-emerald-700 text-base font-bold font-mono">{company.currency} {totalAmount.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Cashier / Sold By: <strong className="text-slate-800">{currentUser?.fullName}</strong>
            </div>

            <button
              id="btn-submit-sales"
              type="submit"
              disabled={quantityToSell === 0 || !customerName.trim()}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-xs transition flex items-center gap-2 cursor-pointer ${
                quantityToSell > 0 && customerName.trim()
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              <ArrowUpFromLine className="w-4 h-4" />
              <span>Complete Sale &amp; Print Invoice</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
