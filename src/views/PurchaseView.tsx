import React, { useState, useEffect } from 'react';
import { Product, SerialItem, PurchaseTransaction, CompanyConfig, User } from '../types/inventory';
import {
  ArrowDownToLine,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Plus,
  Wand2,
  Barcode,
  Trash2,
  Calendar,
  Building,
  DollarSign
} from 'lucide-react';

interface PurchaseViewProps {
  products: Product[];
  company: CompanyConfig;
  currentUser: User | null;
  initialProductId?: string;
  onRecordPurchase: (
    purchase: PurchaseTransaction,
    newSerials: SerialItem[],
    updatedProducts: Product[]
  ) => void;
  onNavigateToStock: () => void;
}

export const PurchaseView: React.FC<PurchaseViewProps> = ({
  products,
  company,
  currentUser,
  initialProductId,
  onRecordPurchase,
  onNavigateToStock,
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState(
    `PINV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [supplier, setSupplier] = useState('Smart Technologies BD Ltd.');
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedProductId, setSelectedProductId] = useState(
    initialProductId || products[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [warrantyMonths, setWarrantyMonths] = useState<number>(36);
  const [notes, setNotes] = useState('');

  // Serial codes raw input text
  const [serialInputText, setSerialInputText] = useState('');
  const [parsedSerials, setParsedSerials] = useState<string[]>([]);

  // Feedback state
  const [successMessage, setSuccessMessage] = useState('');

  // Update default cost when product selected
  useEffect(() => {
    const p = products.find((prod) => prod.id === selectedProductId);
    if (p) {
      setUnitCost(p.costPrice);
    }
  }, [selectedProductId, products]);

  // Sync parsed serials whenever serialInputText changes
  useEffect(() => {
    const list = serialInputText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    // remove duplicates within the same batch
    const unique = Array.from(new Set(list));
    setParsedSerials(unique);
  }, [serialInputText]);

  // Auto-generate sequential serials helper
  const handleGenerateSequentialSerials = () => {
    const p = products.find((prod) => prod.id === selectedProductId);
    const prefix = p ? p.sku.split('-')[0] || 'SN' : 'SN';
    const timestamp = Date.now().toString().slice(-4);
    const generated: string[] = [];
    for (let i = 1; i <= quantity; i++) {
      generated.push(`${prefix}-${timestamp}-${String(i).padStart(3, '0')}`);
    }
    setSerialInputText(generated.join('\n'));
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const serialsNeeded = quantity;
  const serialsCount = parsedSerials.length;
  const isSerialCountValid = serialsCount === serialsNeeded;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (serialsCount !== serialsNeeded) {
      alert(`Serial codes count (${serialsCount}) must match purchase quantity (${serialsNeeded}). Please add or adjust.`);
      return;
    }

    // Build new SerialItem records
    const newSerialItems: SerialItem[] = parsedSerials.map((sn) => ({
      id: `ser-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      serialNumber: sn,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      status: 'available',
      purchaseInvoice: invoiceNumber,
      purchaseDate,
      supplier,
      purchaseCost: unitCost,
      warrantyMonths,
    }));

    // Update product stock and cost
    const updatedProducts = products.map((prod) => {
      if (prod.id === selectedProduct.id) {
        return {
          ...prod,
          currentStock: prod.currentStock + quantity,
          costPrice: unitCost > 0 ? unitCost : prod.costPrice,
          updatedAt: new Date().toISOString(),
        };
      }
      return prod;
    });

    // Create Purchase Transaction
    const purchaseTx: PurchaseTransaction = {
      id: `pur-${Date.now()}`,
      invoiceNumber,
      supplier,
      date: purchaseDate,
      totalAmount: quantity * unitCost,
      notes,
      createdBy: currentUser?.username || 'admin',
      createdAt: new Date().toISOString(),
      items: [
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          sku: selectedProduct.sku,
          quantity,
          unitCost,
          serials: parsedSerials,
        },
      ],
    };

    onRecordPurchase(purchaseTx, newSerialItems, updatedProducts);

    setSuccessMessage(
      `Successfully recorded purchase #${invoiceNumber} for ${quantity}x ${selectedProduct.name} with ${serialsCount} unique serial codes!`
    );

    // Reset form for next entry
    setInvoiceNumber(`PINV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setSerialInputText('');
    setNotes('');
  };

  return (
    <div id="purchase-view-container" className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                Purchase / Stock Inward Entry
              </h1>
              <p className="text-xs text-slate-500">
                Receive new merchandise, update warehouse stock, and register individual serial codes.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onNavigateToStock}
          className="text-xs font-semibold text-blue-700 hover:text-blue-800 transition underline cursor-pointer"
        >
          &larr; Return to Stock View
        </button>
      </div>

      {/* Success Alert Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 space-y-5">
          {/* Supplier & Invoice metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Barcode className="w-3.5 h-3.5 text-slate-400" /> Inward Invoice No *
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" /> Supplier / Vendor *
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. Smart Technologies, Global Brand"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Purchase Date
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Product Selection & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Product to Inward *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — SKU: {p.sku} (Current Stock: {p.currentStock} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity to Inward *
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  setQuantity(val);
                }}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono font-bold"
              />
            </div>
          </div>

          {/* Cost & Warranty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Purchase Cost ({company.currency})
              </label>
              <input
                type="number"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Total Inward Cost: <strong>{company.currency} {(quantity * unitCost).toLocaleString()}</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier Warranty Coverage
              </label>
              <select
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
              >
                <option value={12}>1 Year (12 Months)</option>
                <option value={24}>2 Years (24 Months)</option>
                <option value={36}>3 Years (36 Months)</option>
                <option value={60}>5 Years (60 Months)</option>
                <option value={0}>No Warranty</option>
              </select>
            </div>
          </div>

          {/* Serial Codes Management Section (CRUCIAL REQUIREMENT) */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-600" />
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Record Serial Numbers for Inward Items *
                </label>
              </div>

              <button
                type="button"
                id="btn-auto-generate-serials"
                onClick={handleGenerateSequentialSerials}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Auto-Generate {quantity} Serial Codes</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-2">
              Paste or type serial numbers below (one per line, or comma separated), or use a barcode scanner.
            </p>

            <textarea
              id="textarea-serial-codes-input"
              rows={4}
              value={serialInputText}
              onChange={(e) => setSerialInputText(e.target.value)}
              placeholder={`Enter exactly ${quantity} serial code(s), e.g.:\nSN-${selectedProduct?.sku.split('-')[0] || 'HW'}-8821901\nSN-${selectedProduct?.sku.split('-')[0] || 'HW'}-8821902`}
              required
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono"
            />

            {/* Serial codes count status feedback */}
            <div className="mt-2 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Serial Codes Read:</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-mono font-bold text-xs ${
                    isSerialCountValid
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {serialsCount} of {serialsNeeded} required
                </span>
              </div>

              {!isSerialCountValid && (
                <div className="text-amber-700 text-xs flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>
                    {serialsCount < serialsNeeded
                      ? `Need ${serialsNeeded - serialsCount} more serial code(s)`
                      : `You have ${serialsCount - serialsNeeded} excess serial code(s)`}
                  </span>
                </div>
              )}
            </div>

            {/* Parsed Serials Preview Chips */}
            {parsedSerials.length > 0 && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500 mb-1.5 uppercase">
                  Parsed Serial Numbers ({parsedSerials.length}):
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {parsedSerials.map((sn, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono text-[11px] text-slate-800 flex items-center gap-1"
                    >
                      <span className="text-slate-400 text-[9px] font-sans">#{idx + 1}</span>
                      <span>{sn}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Procurement Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Official distributor batch, verified sealed packaging"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Recorded by: <strong className="text-slate-800">{currentUser?.fullName}</strong>
          </div>

          <button
            id="btn-submit-purchase"
            type="submit"
            disabled={!isSerialCountValid}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-xs transition flex items-center gap-2 cursor-pointer ${
              isSerialCountValid
                ? 'bg-blue-700 hover:bg-blue-800'
                : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Confirm &amp; Record Stock Inward</span>
          </button>
        </div>
      </form>
    </div>
  );
};
