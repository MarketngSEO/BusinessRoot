import React, { useState } from 'react';
import { SaleTransaction, CompanyConfig } from '../types/inventory';
import { 
  Printer, 
  Download, 
  FileText, 
  ShieldCheck, 
  Check, 
  Copy
} from 'lucide-react';
import { 
  downloadInvoicePDF, 
  numberToWords 
} from '../utils/exportUtils';

interface A4InvoiceSheetProps {
  sale: SaleTransaction;
  company: CompanyConfig;
  onViewAsPdf?: () => void;
  onNewSale?: () => void;
  showToolbar?: boolean;
}

export const A4InvoiceSheet: React.FC<A4InvoiceSheetProps> = ({
  sale,
  company,
  onViewAsPdf,
  onNewSale,
  showToolbar = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    downloadInvoicePDF(sale, company);
  };

  const handleCopyInvoiceNumber = () => {
    navigator.clipboard.writeText(sale.invoiceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currencyName = company.currency === '৳' ? 'Taka' : company.currency;
  const words = `${numberToWords(sale.totalAmount)} ${currencyName} Only`;

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar (Clean ERP Action Bar) */}
      {showToolbar && (
        <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-700">
              Tax Invoice Generated:
            </span>
            <span className="font-mono font-bold text-xs bg-slate-100 text-blue-900 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
              #{sale.invoiceNumber}
              <button
                onClick={handleCopyInvoiceNumber}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Copy invoice number"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Requested Feature: View as PDF */}
            {onViewAsPdf && (
              <button
                id="btn-view-as-pdf"
                onClick={onViewAsPdf}
                className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Preview full vector PDF document in viewer"
              >
                <FileText className="w-4 h-4 text-rose-200" />
                <span>View as PDF</span>
              </button>
            )}

            {/* Print A4 Invoice */}
            <button
              id="btn-print-a4-sheet"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Print on standard A4 paper size"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print A4 Invoice</span>
            </button>

            {/* Download PDF file */}
            <button
              id="btn-download-pdf-direct"
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Save official PDF file"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            {/* New Sale Button */}
            {onNewSale && (
              <button
                onClick={onNewSale}
                className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                + New Sale
              </button>
            )}
          </div>
        </div>
      )}

      {/* A4 Document Outer Frame */}
      <div className="a4-invoice-container w-full max-w-[794px] mx-auto">
        <div 
          id="printable-a4-invoice"
          className="a4-invoice-sheet bg-white text-slate-900 rounded-xl shadow-md border border-slate-300 p-6 sm:p-10 relative overflow-hidden"
          style={{
            minHeight: '297mm',
            boxSizing: 'border-box',
          }}
        >
          {/* Subtle Watermark seal */}
          <div className="absolute right-10 top-56 opacity-3 pointer-events-none select-none text-9xl font-black text-slate-900 rotate-[-25deg]">
            VERIFIED
          </div>

          {/* Top Company Header (A4 Enterprise Letterhead) */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-900 text-white font-bold text-base flex items-center justify-center font-mono">
                  CV
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                  {company.companyName}
                </h1>
              </div>
              <p className="text-xs text-blue-900 font-semibold tracking-wide mt-1 uppercase">
                {company.tagline}
              </p>
              <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                <p>{company.address} • {company.branchLocation}</p>
                <p>Hotline: <strong className="text-slate-800 font-mono">{company.phone}</strong> | Tax/BIN: <strong className="text-slate-800 font-mono">{company.vatNumber}</strong></p>
                <p>Branch: <strong className="text-slate-800">{company.branchLocation}</strong></p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-0 border-slate-200 w-full sm:w-auto">
              <span className="inline-block px-3 py-1 bg-blue-900 text-white text-[11px] font-bold rounded tracking-wider uppercase">
                Official Tax Invoice &amp; Memo
              </span>
              <div className="mt-2 text-base font-mono font-bold text-blue-950">
                #{sale.invoiceNumber}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Date: <strong className="text-slate-900 font-mono">{sale.date}</strong>
              </div>
              <div className="text-xs text-slate-600">
                Payment Mode: <span className="font-semibold text-slate-800">{sale.paymentMethod}</span>
              </div>
              <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200">
                <Check className="w-3 h-3" />
                <span>PAID IN FULL</span>
              </div>
            </div>
          </div>

          {/* Customer Information & Billing Reference Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs">
            {/* Billed To */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Customer / Billed To:
              </div>
              <div className="text-sm font-bold text-slate-900">
                {sale.customerName}
              </div>
              {sale.customerPhone && (
                <div className="text-slate-700 mt-1 font-mono">
                  Phone / Contact: <strong className="text-slate-900">{sale.customerPhone}</strong>
                </div>
              )}
              <div className="text-slate-600 mt-0.5">
                Delivery: Store Counter Handover ({company.branchLocation})
              </div>
            </div>

            {/* Order Meta & Cashier */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 sm:text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Order Reference:
              </div>
              <div className="text-slate-700">
                Sales Officer / Handled By: <strong className="text-slate-900">{sale.soldBy}</strong>
              </div>
              <div className="text-slate-700 mt-0.5">
                Issue Timestamp: <strong className="text-slate-900 font-mono">{sale.createdAt ? new Date(sale.createdAt).toLocaleString() : sale.date}</strong>
              </div>
              <div className="text-slate-700 mt-0.5">
                Warranty Coverage: <strong className="text-blue-900">Official Distributor Policy</strong>
              </div>
            </div>
          </div>

          {/* Line Items Table with Serial Numbers */}
          <div className="py-5">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-700 font-bold uppercase text-[11px] bg-slate-100">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Item Description &amp; Serial Numbers</th>
                  <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 w-28 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sale.items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 text-center font-bold text-slate-500 align-top">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3 align-top">
                      <div className="font-bold text-slate-900 text-[13px]">
                        {item.productName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        SKU: {item.sku}
                      </div>

                      {/* Serial Numbers Box (Crucial for Warranty!) */}
                      {item.serials && item.serials.length > 0 ? (
                        <div className="mt-2 p-2 bg-blue-50/70 border border-blue-200 rounded-md">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-blue-900 mb-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span>Assigned Serial Numbers (Keep for Warranty Claims):</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {item.serials.map((sn) => (
                              <span 
                                key={sn} 
                                className="font-mono text-xs font-bold px-2 py-0.5 bg-white border border-blue-300 text-blue-950 rounded shadow-2xs"
                              >
                                {sn}
                              </span>
                            ))}
                          </div>
                          <div className="text-[10px] text-blue-700 mt-1 font-medium">
                            Coverage: 1 Year Official Distributor Replacement &amp; Service Warranty
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 mt-1 italic">
                          General hardware item without individual serial registration.
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold font-mono text-slate-800 align-top">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 align-top">
                      {company.currency} {item.unitPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 align-top">
                      {company.currency} {(item.quantity * item.unitPrice).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Amount in Words */}
          <div className="p-2.5 bg-slate-100 rounded-md text-xs text-slate-800 border border-slate-200 font-medium">
            <span className="font-bold text-slate-900">In Words: </span>
            <span className="italic">{words}</span>
          </div>

          {/* Bottom Section: Terms & Conditions (Left) and Financial Totals (Right) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 pt-4 border-t border-slate-200 text-xs">
            {/* Terms & Warranty Policies */}
            <div className="space-y-1.5 text-slate-600 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900 text-xs flex items-center gap-1 mb-1 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>Warranty Terms &amp; Conditions:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                1. This original physical or digital A4 invoice is compulsory for all warranty claims and RMA replacements.
              </p>
              <p className="text-[11px] leading-relaxed">
                2. Warranty covers manufacturer hardware defects. Serial number stickers must remain intact and untampered.
              </p>
              <p className="text-[11px] leading-relaxed">
                3. Physically damaged, burned, liquid-spilled, or unauthorized-repaired components are void of warranty.
              </p>
              <p className="text-[11px] leading-relaxed">
                4. Goods once inspected and sold are non-refundable. Service takes 7–21 business days as per distributor policy.
              </p>
            </div>

            {/* Financial Calculation Box */}
            <div className="space-y-2">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {company.currency} {sale.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>VAT / Tax (0% Inclusive):</span>
                  <span className="font-mono text-slate-500">
                    {company.currency} 0.00
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Discount:</span>
                  <span className="font-mono text-slate-500">
                    {company.currency} 0.00
                  </span>
                </div>

                {/* Prominent Grand Total */}
                <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-sm uppercase">
                    Total Payable:
                  </span>
                  <span className="font-mono font-black text-lg text-blue-900">
                    {company.currency} {sale.totalAmount.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-emerald-700 font-semibold text-[11px] pt-1">
                  <span>Amount Received:</span>
                  <span className="font-mono font-bold">
                    {company.currency} {sale.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>Balance Due:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {company.currency} 0.00
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures & Seal Verification Block */}
          <div className="grid grid-cols-2 gap-8 mt-16 pt-6 text-xs">
            {/* Customer Signature */}
            <div className="text-center pt-8 border-t border-dashed border-slate-400">
              <span className="font-bold text-slate-800 block">Customer Acceptance</span>
              <span className="text-[10px] text-slate-500 block">
                Received all items in satisfactory operating condition
              </span>
            </div>

            {/* Authorized Signatory */}
            <div className="text-center pt-8 border-t border-dashed border-slate-400 relative">
              {/* Official Stamp */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-3 py-1 border-2 border-blue-700 rounded text-blue-700 font-bold text-[10px] uppercase tracking-wider rotate-[-5deg] bg-white shadow-2xs">
                Official Verified Seal
              </div>
              <span className="font-bold text-slate-900 block">Authorized Signatory</span>
              <span className="text-[10px] text-slate-500 block">
                For {company.companyName} ({company.branchLocation})
              </span>
            </div>
          </div>

          {/* Bottom A4 Footer */}
          <div className="mt-12 pt-4 border-t border-slate-200 text-[10px] text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div>
              Thank you for choosing <strong className="text-slate-600">{company.companyName}</strong>! Support hotline: {company.phone}
            </div>
            <div>
              Official Computer-Generated Tax Invoice • Page 1 of 1 (A4 Standard)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
