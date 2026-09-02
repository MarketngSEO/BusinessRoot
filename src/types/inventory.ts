export type UserRole = 'admin' | 'manager' | 'sales';

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  branch: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  currentStock: number;
  minStockAlert: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type SerialStatus = 'available' | 'sold' | 'defective' | 'returned';

export interface SerialItem {
  id: string;
  serialNumber: string;
  productId: string;
  productName: string;
  sku: string;
  status: SerialStatus;
  purchaseInvoice: string;
  purchaseDate: string;
  supplier: string;
  purchaseCost: number;
  saleInvoice?: string;
  saleDate?: string;
  customerName?: string;
  customerPhone?: string;
  salePrice?: number;
  warrantyMonths?: number;
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  serials: string[];
}

export interface PurchaseTransaction {
  id: string;
  invoiceNumber: string;
  supplier: string;
  date: string;
  totalAmount: number;
  notes?: string;
  items: PurchaseItem[];
  createdBy: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  serials: string[];
}

export interface SaleTransaction {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'Mobile Pay' | 'Credit';
  totalAmount: number;
  notes?: string;
  items: SaleItem[];
  soldBy: string;
  createdAt: string;
}

export interface CompanyConfig {
  companyName: string;
  tagline: string;
  branchLocation: string;
  currency: string;
  phone: string;
  address: string;
  vatNumber?: string;
}
