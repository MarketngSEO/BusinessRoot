import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, SerialItem, CompanyConfig, SaleTransaction } from '../types/inventory';

export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  const integerPart = Math.floor(Math.abs(num));
  return inWords(integerPart);
}

/**
 * Automatically generates a guaranteed unique, sequential tax invoice number.
 * e.g. SINV-2026-0109, SINV-2026-0110...
 * User cannot alter this, guaranteeing strictly audited serial uniqueness.
 */
export function generateNextUniqueInvoiceNumber(sales: SaleTransaction[] = []): string {
  const currentYear = new Date().getFullYear();
  const prefix = `SINV-${currentYear}-`;
  let maxSeq = 100;

  for (const s of sales) {
    if (s.invoiceNumber && s.invoiceNumber.startsWith(prefix)) {
      const numPart = s.invoiceNumber.replace(prefix, '');
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    } else if (s.invoiceNumber && s.invoiceNumber.includes('-')) {
      const parts = s.invoiceNumber.split('-');
      const lastPart = parts[parts.length - 1];
      const parsed = parseInt(lastPart, 10);
      if (!isNaN(parsed) && parsed > maxSeq && parsed < 100000) {
        maxSeq = Math.max(maxSeq, parsed);
      }
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  const existingNumbers = new Set(sales.map(s => s.invoiceNumber));

  while (existingNumbers.has(candidate)) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  return candidate;
}

export function exportStockToExcel(
  products: Product[],
  serials: SerialItem[],
  company: CompanyConfig,
  filterQuery?: string
): void {
  // Sheet 1: Stock Inventory Summary
  const stockRows = products.map((p) => {
    const availableSerials = serials.filter(
      (s) => s.productId === p.id && s.status === 'available'
    );
    const soldSerials = serials.filter(
      (s) => s.productId === p.id && s.status === 'sold'
    );
    const stockStatus =
      p.currentStock <= 0
        ? 'OUT OF STOCK'
        : p.currentStock <= p.minStockAlert
        ? 'LOW STOCK'
        : 'IN STOCK';

    return {
      SKU: p.sku,
      'Product Name': p.name,
      Category: p.category,
      Brand: p.brand,
      'Current Stock': p.currentStock,
      Unit: p.unit,
      [`Cost Price (${company.currency})`]: p.costPrice,
      [`Sale Price (${company.currency})`]: p.salePrice,
      [`Stock Valuation (${company.currency})`]: p.currentStock * p.costPrice,
      'Min Reorder Alert': p.minStockAlert,
      Status: stockStatus,
      'Active Serial Codes': availableSerials.map((s) => s.serialNumber).join(', '),
      'Sold Serial Count': soldSerials.length,
    };
  });

  // Sheet 2: All Individual Serial Numbers
  const serialRows = serials.map((s) => {
    return {
      'Serial Number': s.serialNumber,
      SKU: s.sku,
      'Product Name': s.productName,
      Status: s.status.toUpperCase(),
      'Purchase Date': s.purchaseDate,
      'Purchase Invoice': s.purchaseInvoice,
      Supplier: s.supplier,
      [`Purchase Cost (${company.currency})`]: s.purchaseCost,
      'Sale Date': s.saleDate || '-',
      'Sale Invoice': s.saleInvoice || '-',
      Customer: s.customerName || '-',
      'Customer Phone': s.customerPhone || '-',
      [`Sale Price (${company.currency})`]: s.salePrice ?? '-',
      'Warranty (Months)': s.warrantyMonths ?? 12,
    };
  });

  const wb = XLSX.utils.book_new();

  const wsStock = XLSX.utils.json_to_sheet(stockRows);
  const wsSerials = XLSX.utils.json_to_sheet(serialRows);

  // Set column widths for readability
  wsStock['!cols'] = [
    { wch: 18 }, // SKU
    { wch: 38 }, // Name
    { wch: 16 }, // Category
    { wch: 14 }, // Brand
    { wch: 14 }, // Stock
    { wch: 10 }, // Unit
    { wch: 16 }, // Cost
    { wch: 16 }, // Sale
    { wch: 20 }, // Valuation
    { wch: 16 }, // Alert
    { wch: 14 }, // Status
    { wch: 45 }, // Active Serials
    { wch: 16 }, // Sold Serials
  ];

  wsSerials['!cols'] = [
    { wch: 25 }, // Serial
    { wch: 18 }, // SKU
    { wch: 35 }, // Name
    { wch: 14 }, // Status
    { wch: 14 }, // Purchase Date
    { wch: 18 }, // Purchase Inv
    { wch: 25 }, // Supplier
    { wch: 16 }, // Cost
    { wch: 14 }, // Sale Date
    { wch: 18 }, // Sale Inv
    { wch: 25 }, // Customer
    { wch: 18 }, // Phone
    { wch: 16 }, // Sale Price
    { wch: 16 }, // Warranty
  ];

  XLSX.utils.book_append_sheet(wb, wsStock, 'Stock Inventory');
  XLSX.utils.book_append_sheet(wb, wsSerials, 'Serial Numbers Registry');

  const todayStr = new Date().toISOString().split('T')[0];
  const fileName = `Stock_Report_${company.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${todayStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportStockToPDF(
  products: Product[],
  serials: SerialItem[],
  company: CompanyConfig,
  currentUserName: string
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const today = new Date().toLocaleString();
  const totalStockUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalValuation = products.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0);
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStockAlert).length;
  const activeSerialsCount = serials.filter((s) => s.status === 'available').length;

  // Header Box
  doc.setFillColor(30, 58, 138); // Deep Navy #1e3a8a
  doc.rect(0, 0, 297, 24, 'F');

  // Title & Company
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(company.companyName.toUpperCase(), 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${company.tagline} | Location: ${company.branchLocation}`, 14, 18);

  doc.setFontSize(9);
  doc.text(`Generated on: ${today} by ${currentUserName}`, 283, 11, { align: 'right' });
  doc.text(`Official Stock & Serial Inventory Report`, 283, 18, { align: 'right' });

  // Metric Summary Bar
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(14, 28, 269, 14, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(14, 28, 269, 14, 2, 2, 'D');

  doc.setTextColor(51, 65, 85); // slate-700
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PRODUCTS (SKUS):', 20, 36);
  doc.setFont('helvetica', 'normal');
  doc.text(`${products.length}`, 65, 36);

  doc.setFont('helvetica', 'bold');
  doc.text('IN-STOCK QUANTITY:', 80, 36);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalStockUnits} units`, 118, 36);

  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL VALUATION:', 140, 36);
  doc.setFont('helvetica', 'normal');
  doc.text(`${company.currency} ${totalValuation.toLocaleString()}`, 174, 36);

  doc.setFont('helvetica', 'bold');
  doc.text('SERIAL CODES TRACKED:', 215, 36);
  doc.setFont('helvetica', 'normal');
  doc.text(`${activeSerialsCount} available`, 258, 36);

  // Table Data
  const tableData = products.map((p, idx) => {
    const pSerials = serials
      .filter((s) => s.productId === p.id && s.status === 'available')
      .map((s) => s.serialNumber);

    const serialsSummary =
      pSerials.length > 0
        ? pSerials.slice(0, 3).join(', ') + (pSerials.length > 3 ? ` (+${pSerials.length - 3} more)` : '')
        : 'None registered';

    const statusText =
      p.currentStock <= 0
        ? 'Out of Stock'
        : p.currentStock <= p.minStockAlert
        ? 'LOW STOCK'
        : 'Normal';

    return [
      (idx + 1).toString(),
      p.sku,
      p.name,
      p.category,
      `${p.currentStock} ${p.unit}`,
      `${company.currency} ${p.costPrice.toLocaleString()}`,
      `${company.currency} ${p.salePrice.toLocaleString()}`,
      `${company.currency} ${(p.currentStock * p.costPrice).toLocaleString()}`,
      statusText,
      serialsSummary,
    ];
  });

  autoTable(doc, {
    startY: 46,
    head: [
      [
        '#',
        'SKU',
        'Item Description',
        'Category',
        'Stock',
        'Cost Price',
        'Sale Price',
        'Total Valuation',
        'Status',
        'Sample Serial Codes',
      ],
    ],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 55 },
      3: { cellWidth: 24 },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
      8: { cellWidth: 22, halign: 'center' },
      9: { cellWidth: 45, fontSize: 7 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 8) {
        const val = data.cell.raw as string;
        if (val === 'LOW STOCK') {
          data.cell.styles.textColor = [194, 65, 12]; // orange-700
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'Out of Stock') {
          data.cell.styles.textColor = [185, 28, 28]; // red-700
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [21, 128, 61]; // green-700
        }
      }
    },
    didDrawPage: (data) => {
      // Footer page numbers
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} - ${company.companyName} Confidential Inventory Document`,
        14,
        205
      );
    },
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const fileName = `Stock_Report_${company.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${todayStr}.pdf`;
  doc.save(fileName);
}

export function generateSaleInvoicePDF(
  sale: SaleTransaction,
  company: CompanyConfig
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210mm x 297mm
  });

  // Top Dark Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  // Accent highlight line
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 31, 210, 1.5, 'F');

  // Left Company Brand Details
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(company.companyName.toUpperCase(), 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(191, 219, 254); // blue-200
  doc.text(company.tagline, 14, 17);

  doc.setTextColor(203, 213, 225); // slate-300
  doc.setFontSize(7.5);
  doc.text(`${company.address} • ${company.branchLocation}`, 14, 22);
  doc.text(`Phone: ${company.phone} | VAT/BIN: ${company.vatNumber}`, 14, 27);

  // Right Header Invoice Info
  doc.setFillColor(30, 58, 138); // blue-900
  doc.roundedRect(138, 5, 58, 8, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL TAX INVOICE', 167, 10.5, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${sale.invoiceNumber}`, 196, 20, { align: 'right' });

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${sale.date}`, 196, 26, { align: 'right' });

  // Customer Details & Order Details Cards (A4 standard)
  const metaY = 37;

  // Card 1: Billed To Customer
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, metaY, 88, 26, 2, 2, 'FD');

  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('BILLED TO / CUSTOMER DETAILS:', 18, metaY + 6);

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(sale.customerName || 'Cash / Walk-in Customer', 18, metaY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`Contact: ${sale.customerPhone || 'Not provided'}`, 18, metaY + 17);
  doc.text(`Delivery Location: Counter Pickup (${company.branchLocation})`, 18, metaY + 22);

  // Card 2: Order Metadata & Status
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(108, metaY, 88, 26, 2, 2, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT & ORDER METADATA:', 112, metaY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Payment Method: ${sale.paymentMethod}`, 112, metaY + 12);
  doc.text(`Sales Officer / Handled By: ${sale.soldBy}`, 112, metaY + 17);
  doc.text(`Payment Status: `, 112, metaY + 22);
  doc.setTextColor(21, 128, 61); // green-700
  doc.setFont('helvetica', 'bold');
  doc.text('FULL PAYMENT RECEIVED', 140, metaY + 22);

  // Line Items Table with Serial Numbers & Warranty
  const tableRows = sale.items.map((item, index) => {
    const serialList = item.serials && item.serials.length > 0
      ? `\nAssigned S/N: ${item.serials.join(', ')}\nWarranty: 1 Year Official Distributor Hardware Warranty`
      : '\nWarranty: Standard Store Policy';

    const itemDesc = `${item.productName}\nSKU: ${item.sku}${serialList}`;
    const subtotal = item.quantity * item.unitPrice;

    return [
      (index + 1).toString(),
      itemDesc,
      item.quantity.toString(),
      `${company.currency} ${item.unitPrice.toLocaleString()}`,
      `${company.currency} ${subtotal.toLocaleString()}`,
    ];
  });

  autoTable(doc, {
    startY: 68,
    head: [
      ['#', 'Item Description & Serial Numbers (Keep for Warranty)', 'Qty', 'Unit Price', 'Amount'],
    ],
    body: tableRows,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [30, 58, 138], // Navy
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 97 },
      2: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 6;

  // Amount in Words
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, 182, 7, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  const currencyName = company.currency === '৳' ? 'Taka' : company.currency;
  const words = `Amount in Words: ${numberToWords(sale.totalAmount)} ${currencyName} Only.`;
  doc.text(words, 18, currentY + 4.8);

  currentY += 12;

  // Terms & Conditions (Left) and Financial Totals (Right)
  // Left: Terms
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 105, 36, 1.5, 1.5, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Warranty Terms & Commercial Policy:', 18, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('1. Warranty claims strictly require this physical or digital A4 invoice.', 18, currentY + 11);
  doc.text('2. Serial numbers must match product barcode label without damage/tampering.', 18, currentY + 16);
  doc.text('3. Physical breakage, burn marks, or liquid damage void warranty completely.', 18, currentY + 21);
  doc.text('4. Replacement or service takes 7-21 business days as per distributor RMA.', 18, currentY + 26);
  doc.text('5. Sold goods are non-refundable after successful hardware testing.', 18, currentY + 31);

  // Right: Totals
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(124, currentY, 72, 36, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Sub Total:', 128, currentY + 7);
  doc.setTextColor(15, 23, 42);
  doc.text(`${company.currency} ${sale.totalAmount.toLocaleString()}`, 192, currentY + 7, { align: 'right' });

  doc.setTextColor(100, 116, 139);
  doc.text('VAT / Tax (Included):', 128, currentY + 13);
  doc.setTextColor(15, 23, 42);
  doc.text(`${company.currency} 0.00`, 192, currentY + 13, { align: 'right' });

  // Grand Total Highlight Banner
  doc.setFillColor(30, 58, 138); // Navy
  doc.rect(124, currentY + 17, 72, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PAYABLE:', 128, currentY + 23);
  doc.text(`${company.currency} ${sale.totalAmount.toLocaleString()}`, 192, currentY + 23, { align: 'right' });

  // Paid & Balance
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(21, 128, 61); // green-700
  doc.text('Total Paid:', 128, currentY + 31);
  doc.text(`${company.currency} ${sale.totalAmount.toLocaleString()}`, 192, currentY + 31, { align: 'right' });

  // Signature lines
  const sigY = 252;
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineDashPattern([1, 1], 0);

  // Customer Signature
  doc.line(20, sigY, 70, sigY);
  doc.setLineDashPattern([], 0); // reset
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Acceptance Signature', 45, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('(Received goods in satisfactory condition)', 45, sigY + 9, { align: 'center' });

  // Authorized Signature
  doc.setLineDashPattern([1, 1], 0);
  doc.line(140, sigY, 190, sigY);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Authorized Signatory`, 165, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`For ${company.companyName}`, 165, sigY + 9, { align: 'center' });

  // Official Seal Badge Stamp
  doc.setDrawColor(37, 99, 235);
  doc.roundedRect(147, sigY - 14, 36, 11, 1, 1, 'D');
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL VERIFIED', 165, sigY - 9, { align: 'center' });
  doc.text(company.branchLocation.toUpperCase(), 165, sigY - 5.5, { align: 'center' });

  // Bottom Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 276, 196, 276);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Thank you for trusting ${company.companyName}! • Technical Support: ${company.phone}`, 14, 282);
  doc.text(`System Generated A4 Commercial Tax Invoice | Page 1 of 1`, 196, 282, { align: 'right' });

  return doc;
}

export function downloadInvoicePDF(
  sale: SaleTransaction,
  company: CompanyConfig
): void {
  const doc = generateSaleInvoicePDF(sale, company);
  doc.save(`Invoice_${sale.invoiceNumber}.pdf`);
}

export function getInvoicePDFBlobUrl(
  sale: SaleTransaction,
  company: CompanyConfig
): string {
  const doc = generateSaleInvoicePDF(sale, company);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

