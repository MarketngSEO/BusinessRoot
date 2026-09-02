import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, SerialItem, CompanyConfig } from '../types/inventory';

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
