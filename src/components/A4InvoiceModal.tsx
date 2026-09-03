import React, { useState, useEffect } from 'react';
import { 
  SaleTransaction, 
  CompanyConfig 
} from '../types/inventory';
import { 
  Printer, 
  Download, 
  FileText, 
  Eye, 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Check, 
  Copy,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { 
  downloadInvoicePDF, 
  getInvoicePDFBlobUrl, 
  numberToWords 
} from '../utils/exportUtils';

interface A4InvoiceModalProps {
  sale: SaleTransaction | null;
  company: CompanyConfig;
  isOpen: boolean;
  onClose: () => void;
  defaultViewMode?: 'paper' | 'pdf';
}

export const A4InvoiceModal: React.FC<A4InvoiceModalProps> = ({
  sale,
  company,
  isOpen,
  onClose,
  defaultViewMode = 'paper',
}) => {
  const [viewMode, setViewMode] = useState<'paper' | 'pdf'>(defaultViewMode);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isCopied, setIsCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    setViewMode(defaultViewMode);
  }, [defaultViewMode, isOpen]);

  // Generate or clean up Blob URL for PDF preview
  useEffect(() => {
    if (sale && (viewMode === 'pdf' || isOpen)) {
      try {
        const url = getInvoicePDFBlobUrl(sale, company);
        setPdfBlobUrl(url);

        return () => {
          if (url) {
            URL.revokeObjectURL(url);
          }
        };
      } catch (err) {
        console.error('Error generating PDF blob URL:', err);
      }
    }
  }, [sale, company, viewMode, isOpen]);

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    downloadInvoicePDF(sale, company);
  };

  const handleOpenPdfInNewTab = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank');
    } else {
      const url = getInvoicePDFBlobUrl(sale, company);
      window.open(url, '_blank');
    }
  };

  const handleCopyInvoiceNumber = () => {
    navigator.clipboard.writeText(sale.invoiceNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const currencyName = company.currency === '৳' ? 'Taka' : company.currency;
  const words = `${numberToWords(sale.totalAmount)} ${currencyName} Only`;

  return (
    <div 
      id="a4-invoice-modal-overlay" 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className={`bg-slate-100 rounded-2xl shadow-2xl flex flex-col border border-slate-700/50 transition-all duration-200 ${
          isFullScreen 
            ? 'w-full h-full max-w-none rounded-none' 
            : 'w-full max-w-5xl max-h-[95vh]'
        }`}
      >
        {/* Top Control Bar (Non-printable) */}
        <div className="no-print bg-slate-900 text-white px-4 py-3 sm:px-6 rounded-t-2xl flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          {/* Left: Title & Invoice tag */}
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  A4 Paper Tax Invoice
                </h2>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  #{sale.invoiceNumber}
                  <button 
                    onClick={handleCopyInvoiceNumber}
                    title="Copy invoice number"
                    className="hover:text-white transition cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Customer: <span className="text-slate-200 font-medium">{sale.customerName}</span> • Date: {sale.date}
              </p>
            </div>
          </div>

          {/* Center: Mode Switch (A4 Paper vs. View as PDF) */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              id="btn-mode-paper"
              onClick={() => setViewMode('paper')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'paper'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>A4 Paper Sheet</span>
            </button>
            <button
              id="btn-mode-pdf"
              onClick={() => setViewMode('pdf')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'pdf'
                  ? 'bg-rose-700 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-rose-300" />
              <span>View as PDF</span>
            </button>
          </div>

          {/* Right: Actions (Print, Download, Fullscreen, Close) */}
          <div className="flex items-center gap-2">
            <button
              id="btn-print-invoice"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Print standard A4 format"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Print A4</span>
            </button>

            <button
              id="btn-download-invoice-pdf"
              onClick={handleDownload}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Download official PDF file"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer ml-1"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-200 flex justify-center">
          {viewMode === 'pdf' ? (
            /* VIEW AS PDF: Interactive In-App PDF Reader */
            <div className="w-full flex flex-col items-center max-w-4xl space-y-3">
              {/* PDF Viewer Sub-toolbar */}
              <div className="w-full bg-white px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px] uppercase">
                    PDF Preview
                  </span>
                  <span className="text-slate-500 hidden sm:inline">
                    Authentic 210mm × 297mm Vector Document
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-slate-700">
                    <button
                      onClick={() => setZoomLevel(Math.max(60, zoomLevel - 15))}
                      className="p-1 hover:bg-white rounded transition cursor-pointer"
                      title="Zoom out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 font-mono text-[11px] font-semibold">{zoomLevel}%</span>
                    <button
                      onClick={() => setZoomLevel(Math.min(150, zoomLevel + 15))}
                      className="p-1 hover:bg-white rounded transition cursor-pointer"
                      title="Zoom in"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(100)}
                      className="p-1 hover:bg-white rounded transition cursor-pointer text-slate-500"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={handleOpenPdfInNewTab}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Window</span>
                  </button>
                </div>
              </div>

              {/* Embedded PDF iframe / Object Container */}
              <div 
                className="w-full bg-slate-800/80 rounded-xl p-2 sm:p-4 shadow-xl flex justify-center overflow-auto border border-slate-700"
                style={{ minHeight: '75vh' }}
              >
                {pdfBlobUrl ? (
                  <iframe
                    src={`${pdfBlobUrl}#view=FitH`}
                    title={`Invoice-${sale.invoiceNumber}`}
                    className="rounded-lg shadow-2xl bg-white border border-slate-300 transition-all duration-150"
                    style={{
                      width: `${zoomLevel}%`,
                      maxWidth: '100%',
                      height: '80vh',
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-300 space-y-3">
                    <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs">Preparing crisp vector PDF preview...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* A4 PAPER SHEET VIEW (Standard True 210mm x 297mm Proportion) */
            <div className="a4-invoice-container w-full max-w-[794px] mx-auto py-2">
              <div 
                id="printable-a4-invoice"
                className="a4-invoice-sheet bg-white text-slate-900 rounded-xl shadow-xl border border-slate-300 p-8 sm:p-12 relative overflow-hidden"
                style={{
                  minHeight: '297mm',
                  boxSizing: 'border-box',
                }}
              >
                {/* Official Watermark background seal */}
                <div className="absolute right-12 top-60 opacity-3 pointer-events-none select-none text-9xl font-black text-slate-900 rotate-[-25deg]">
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
                      Sales Officer / Prepared By: <strong className="text-slate-900">{sale.soldBy}</strong>
                    </div>
                    <div className="text-slate-700 mt-0.5">
                      Issue Date &amp; Time: <strong className="text-slate-900 font-mono">{sale.createdAt ? new Date(sale.createdAt).toLocaleString() : sale.date}</strong>
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
          )}
        </div>
      </div>
    </div>
  );
};
