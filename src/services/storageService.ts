import { User, Product, SerialItem, PurchaseTransaction, SaleTransaction, CompanyConfig } from '../types/inventory';

const STORAGE_KEY = 'bizness_roots_erp_v1_store';
const REMEMBERED_USER_KEY = 'bizness_roots_remembered_user';

export interface AppDatabase {
  users: User[];
  products: Product[];
  serials: SerialItem[];
  purchases: PurchaseTransaction[];
  sales: SaleTransaction[];
  company: CompanyConfig;
}

const DEFAULT_COMPANY: CompanyConfig = {
  companyName: 'Computer Village ER',
  tagline: 'Distribution & Supply Chain Enterprise ERP',
  branchLocation: 'Multiplan Center, Dhaka',
  currency: '৳',
  phone: '+880 1711-000000',
  address: 'Level 4, Multiplan Center, New Elephant Road',
  vatNumber: 'BIN-00291827-2026',
};

const DEFAULT_USERS: User[] = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    password: 'admin123',
    fullName: 'Saikat Rahman',
    role: 'admin',
    branch: 'Multiplan Center',
    email: 'admin@computervillage.com',
    phone: '+880 1711-123456',
    isActive: true,
    createdAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'usr-staff-1',
    username: 'sales01',
    password: 'sales123',
    fullName: 'Tanvir Hossain',
    role: 'sales',
    branch: 'Multiplan Center',
    email: 'tanvir@computervillage.com',
    phone: '+880 1819-654321',
    isActive: true,
    createdAt: '2026-01-15T10:30:00.000Z',
  },
  {
    id: 'usr-mgr-1',
    username: 'manager1',
    password: 'manager123',
    fullName: 'Farhana Akter',
    role: 'manager',
    branch: 'Multiplan Center',
    email: 'farhana@computervillage.com',
    phone: '+880 1912-987654',
    isActive: true,
    createdAt: '2026-02-01T11:00:00.000Z',
  }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'CPU-INT-14700K',
    name: 'Intel Core i7-14700K 20-Core Processor',
    category: 'Processors',
    brand: 'Intel',
    unit: 'Pcs',
    costPrice: 42500,
    salePrice: 46800,
    currentStock: 4,
    minStockAlert: 2,
    description: '14th Gen Raptor Lake, 20 Cores 28 Threads up to 5.6 GHz LGA1700',
    createdAt: '2026-01-12T10:00:00.000Z',
    updatedAt: '2026-02-28T14:30:00.000Z',
  },
  {
    id: 'prod-2',
    sku: 'MB-ASUS-Z790F',
    name: 'Asus ROG Strix Z790-F Gaming WiFi II Motherboard',
    category: 'Motherboards',
    brand: 'Asus ROG',
    unit: 'Pcs',
    costPrice: 49000,
    salePrice: 53500,
    currentStock: 3,
    minStockAlert: 2,
    description: 'Intel Z790 chipset, DDR5, PCIe 5.0, WiFi 7, Aura Sync',
    createdAt: '2026-01-14T11:00:00.000Z',
    updatedAt: '2026-02-28T15:00:00.000Z',
  },
  {
    id: 'prod-3',
    sku: 'SSD-SAM-990PRO-2TB',
    name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 SSD',
    category: 'Storage',
    brand: 'Samsung',
    unit: 'Pcs',
    costPrice: 21500,
    salePrice: 24200,
    currentStock: 5,
    minStockAlert: 3,
    description: 'Speeds up to 7,450 MB/s read, 6,900 MB/s write with V-NAND tech',
    createdAt: '2026-01-18T12:00:00.000Z',
    updatedAt: '2026-02-25T11:20:00.000Z',
  },
  {
    id: 'prod-4',
    sku: 'GPU-MSI-RTX4070TS',
    name: 'MSI GeForce RTX 4070 Ti SUPER 16G Ventus 3X',
    category: 'Graphics Cards',
    brand: 'MSI',
    unit: 'Pcs',
    costPrice: 108000,
    salePrice: 116500,
    currentStock: 2,
    minStockAlert: 2,
    description: '16GB GDDR6X, Ada Lovelace architecture, DLSS 3, Triple Fan',
    createdAt: '2026-01-20T09:30:00.000Z',
    updatedAt: '2026-02-26T16:15:00.000Z',
  },
  {
    id: 'prod-5',
    sku: 'RAM-COR-DDR5-32GB',
    name: 'Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz',
    category: 'Memory',
    brand: 'Corsair',
    unit: 'Kit',
    costPrice: 13500,
    salePrice: 15200,
    currentStock: 6,
    minStockAlert: 3,
    description: 'Dual channel kit optimized for Intel & AMD EXPO with dynamic ten-zone RGB',
    createdAt: '2026-01-22T14:00:00.000Z',
    updatedAt: '2026-02-27T10:00:00.000Z',
  },
  {
    id: 'prod-6',
    sku: 'MON-DELL-U2724D',
    name: 'Dell UltraSharp 27" 2K QHD IPS Monitor U2724D',
    category: 'Monitors',
    brand: 'Dell',
    unit: 'Pcs',
    costPrice: 46000,
    salePrice: 51000,
    currentStock: 1,
    minStockAlert: 2,
    description: '120Hz IPS Black panel, 98% DCI-P3, ComfortView Plus, Pivot stand',
    createdAt: '2026-02-01T15:00:00.000Z',
    updatedAt: '2026-02-28T09:00:00.000Z',
  },
];

const DEFAULT_SERIALS: SerialItem[] = [
  // CPU serials (4 in stock, 1 sold)
  {
    id: 'ser-101',
    serialNumber: 'SN-INT-14700K-08912',
    productId: 'prod-1',
    productName: 'Intel Core i7-14700K 20-Core Processor',
    sku: 'CPU-INT-14700K',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0041',
    purchaseDate: '2026-01-15',
    supplier: 'Smart Technologies BD Ltd.',
    purchaseCost: 42500,
    warrantyMonths: 36,
  },
  {
    id: 'ser-102',
    serialNumber: 'SN-INT-14700K-08913',
    productId: 'prod-1',
    productName: 'Intel Core i7-14700K 20-Core Processor',
    sku: 'CPU-INT-14700K',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0041',
    purchaseDate: '2026-01-15',
    supplier: 'Smart Technologies BD Ltd.',
    purchaseCost: 42500,
    warrantyMonths: 36,
  },
  {
    id: 'ser-103',
    serialNumber: 'SN-INT-14700K-08914',
    productId: 'prod-1',
    productName: 'Intel Core i7-14700K 20-Core Processor',
    sku: 'CPU-INT-14700K',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0041',
    purchaseDate: '2026-01-15',
    supplier: 'Smart Technologies BD Ltd.',
    purchaseCost: 42500,
    warrantyMonths: 36,
  },
  {
    id: 'ser-104',
    serialNumber: 'SN-INT-14700K-08915',
    productId: 'prod-1',
    productName: 'Intel Core i7-14700K 20-Core Processor',
    sku: 'CPU-INT-14700K',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0041',
    purchaseDate: '2026-01-15',
    supplier: 'Smart Technologies BD Ltd.',
    purchaseCost: 42500,
    warrantyMonths: 36,
  },
  {
    id: 'ser-105',
    serialNumber: 'SN-INT-14700K-08910',
    productId: 'prod-1',
    productName: 'Intel Core i7-14700K 20-Core Processor',
    sku: 'CPU-INT-14700K',
    status: 'sold',
    purchaseInvoice: 'PINV-2026-0020',
    purchaseDate: '2026-01-05',
    supplier: 'Smart Technologies BD Ltd.',
    purchaseCost: 42500,
    saleInvoice: 'SINV-2026-0108',
    saleDate: '2026-02-20',
    customerName: 'Ashiqur Rahman (Studio 9)',
    customerPhone: '+880 1712-445566',
    salePrice: 46800,
    warrantyMonths: 36,
  },

  // Motherboard serials (3 available, 1 sold)
  {
    id: 'ser-201',
    serialNumber: 'SN-ASUS-Z790F-99411',
    productId: 'prod-2',
    productName: 'Asus ROG Strix Z790-F Gaming WiFi II Motherboard',
    sku: 'MB-ASUS-Z790F',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0048',
    purchaseDate: '2026-01-20',
    supplier: 'Global Brand Pvt. Ltd.',
    purchaseCost: 49000,
    warrantyMonths: 36,
  },
  {
    id: 'ser-202',
    serialNumber: 'SN-ASUS-Z790F-99412',
    productId: 'prod-2',
    productName: 'Asus ROG Strix Z790-F Gaming WiFi II Motherboard',
    sku: 'MB-ASUS-Z790F',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0048',
    purchaseDate: '2026-01-20',
    supplier: 'Global Brand Pvt. Ltd.',
    purchaseCost: 49000,
    warrantyMonths: 36,
  },
  {
    id: 'ser-203',
    serialNumber: 'SN-ASUS-Z790F-99413',
    productId: 'prod-2',
    productName: 'Asus ROG Strix Z790-F Gaming WiFi II Motherboard',
    sku: 'MB-ASUS-Z790F',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0048',
    purchaseDate: '2026-01-20',
    supplier: 'Global Brand Pvt. Ltd.',
    purchaseCost: 49000,
    warrantyMonths: 36,
  },
  {
    id: 'ser-204',
    serialNumber: 'SN-ASUS-Z790F-99408',
    productId: 'prod-2',
    productName: 'Asus ROG Strix Z790-F Gaming WiFi II Motherboard',
    sku: 'MB-ASUS-Z790F',
    status: 'sold',
    purchaseInvoice: 'PINV-2026-0025',
    purchaseDate: '2026-01-08',
    supplier: 'Global Brand Pvt. Ltd.',
    purchaseCost: 49000,
    saleInvoice: 'SINV-2026-0108',
    saleDate: '2026-02-20',
    customerName: 'Ashiqur Rahman (Studio 9)',
    customerPhone: '+880 1712-445566',
    salePrice: 53500,
    warrantyMonths: 36,
  },

  // SSD serials (5 available)
  {
    id: 'ser-301',
    serialNumber: 'S6PJNF0W100291X',
    productId: 'prod-3',
    productName: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 SSD',
    sku: 'SSD-SAM-990PRO-2TB',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0052',
    purchaseDate: '2026-01-25',
    supplier: 'Excel Technologies Ltd.',
    purchaseCost: 21500,
    warrantyMonths: 60,
  },
  {
    id: 'ser-302',
    serialNumber: 'S6PJNF0W100292Y',
    productId: 'prod-3',
    productName: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 SSD',
    sku: 'SSD-SAM-990PRO-2TB',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0052',
    purchaseDate: '2026-01-25',
    supplier: 'Excel Technologies Ltd.',
    purchaseCost: 21500,
    warrantyMonths: 60,
  },
  {
    id: 'ser-303',
    serialNumber: 'S6PJNF0W100293Z',
    productId: 'prod-3',
    productName: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 SSD',
    sku: 'SSD-SAM-990PRO-2TB',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0052',
    purchaseDate: '2026-01-25',
    supplier: 'Excel Technologies Ltd.',
    purchaseCost: 21500,
    warrantyMonths: 60,
  },
  {
    id: 'ser-304',
    serialNumber: 'S6PJNF0W100294A',
    productId: 'prod-3',
    productName: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 SSD',
    sku: 'SSD-SAM-990PRO-2TB',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0052',
    purchaseDate: '2026-01-25',
    supplier: 'Excel Technologies Ltd.',
    purchaseCost: 21500,
    warrantyMonths: 60,
  },
  {
    id: 'ser-305',
    serialNumber: 'S6PJNF0W100295B',
    productId: 'prod-3',
    productName: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 SSD',
    sku: 'SSD-SAM-990PRO-2TB',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0052',
    purchaseDate: '2026-01-25',
    supplier: 'Excel Technologies Ltd.',
    purchaseCost: 21500,
    warrantyMonths: 60,
  },

  // GPU serials (2 available, 1 sold)
  {
    id: 'ser-401',
    serialNumber: 'SN-MSI-4070TS-77101',
    productId: 'prod-4',
    productName: 'MSI GeForce RTX 4070 Ti SUPER 16G Ventus 3X',
    sku: 'GPU-MSI-RTX4070TS',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0060',
    purchaseDate: '2026-02-02',
    supplier: 'UCC Distribution BD',
    purchaseCost: 108000,
    warrantyMonths: 36,
  },
  {
    id: 'ser-402',
    serialNumber: 'SN-MSI-4070TS-77102',
    productId: 'prod-4',
    productName: 'MSI GeForce RTX 4070 Ti SUPER 16G Ventus 3X',
    sku: 'GPU-MSI-RTX4070TS',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0060',
    purchaseDate: '2026-02-02',
    supplier: 'UCC Distribution BD',
    purchaseCost: 108000,
    warrantyMonths: 36,
  },
  {
    id: 'ser-403',
    serialNumber: 'SN-MSI-4070TS-77099',
    productId: 'prod-4',
    productName: 'MSI GeForce RTX 4070 Ti SUPER 16G Ventus 3X',
    sku: 'GPU-MSI-RTX4070TS',
    status: 'sold',
    purchaseInvoice: 'PINV-2026-0030',
    purchaseDate: '2026-01-10',
    supplier: 'UCC Distribution BD',
    purchaseCost: 108000,
    saleInvoice: 'SINV-2026-0108',
    saleDate: '2026-02-20',
    customerName: 'Ashiqur Rahman (Studio 9)',
    customerPhone: '+880 1712-445566',
    salePrice: 116500,
    warrantyMonths: 36,
  },

  // RAM Serials (6 available)
  {
    id: 'ser-501',
    serialNumber: 'COR-VEN-6000-01A',
    productId: 'prod-5',
    productName: 'Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz',
    sku: 'RAM-COR-DDR5-32GB',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0065',
    purchaseDate: '2026-02-05',
    supplier: 'Computer Source Ltd.',
    purchaseCost: 13500,
    warrantyMonths: 36,
  },
  {
    id: 'ser-502',
    serialNumber: 'COR-VEN-6000-01B',
    productId: 'prod-5',
    productName: 'Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz',
    sku: 'RAM-COR-DDR5-32GB',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0065',
    purchaseDate: '2026-02-05',
    supplier: 'Computer Source Ltd.',
    purchaseCost: 13500,
    warrantyMonths: 36,
  },
  {
    id: 'ser-503',
    serialNumber: 'COR-VEN-6000-01C',
    productId: 'prod-5',
    productName: 'Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz',
    sku: 'RAM-COR-DDR5-32GB',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0065',
    purchaseDate: '2026-02-05',
    supplier: 'Computer Source Ltd.',
    purchaseCost: 13500,
    warrantyMonths: 36,
  },
  {
    id: 'ser-504',
    serialNumber: 'COR-VEN-6000-01D',
    productId: 'prod-5',
    productName: 'Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz',
    sku: 'RAM-COR-DDR5-32GB',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0065',
    purchaseDate: '2026-02-05',
    supplier: 'Computer Source Ltd.',
    purchaseCost: 13500,
    warrantyMonths: 36,
  },
  {
    id: 'ser-505',
    serialNumber: 'COR-VEN-6000-01E',
    productId: 'prod-5',
    productName: 'Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz',
    sku: 'RAM-COR-DDR5-32GB',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0065',
    purchaseDate: '2026-02-05',
    supplier: 'Computer Source Ltd.',
    purchaseCost: 13500,
    warrantyMonths: 36,
  },
  {
    id: 'ser-506',
    serialNumber: 'COR-VEN-6000-01F',
    productId: 'prod-5',
    productName: 'Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz',
    sku: 'RAM-COR-DDR5-32GB',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0065',
    purchaseDate: '2026-02-05',
    supplier: 'Computer Source Ltd.',
    purchaseCost: 13500,
    warrantyMonths: 36,
  },

  // Monitor serial (1 available, low stock alert)
  {
    id: 'ser-601',
    serialNumber: 'CN-00MN82-QDC00-429-012',
    productId: 'prod-6',
    productName: 'Dell UltraSharp 27" 2K QHD IPS Monitor U2724D',
    sku: 'MON-DELL-U2724D',
    status: 'available',
    purchaseInvoice: 'PINV-2026-0072',
    purchaseDate: '2026-02-12',
    supplier: 'Global Brand Pvt. Ltd.',
    purchaseCost: 46000,
    warrantyMonths: 36,
  },
];

const DEFAULT_PURCHASES: PurchaseTransaction[] = [
  {
    id: 'pur-1',
    invoiceNumber: 'PINV-2026-0041',
    supplier: 'Smart Technologies BD Ltd.',
    date: '2026-01-15',
    totalAmount: 170000,
    notes: 'Official import with 3-year warranty',
    createdBy: 'admin',
    createdAt: '2026-01-15T10:30:00.000Z',
    items: [
      {
        productId: 'prod-1',
        productName: 'Intel Core i7-14700K 20-Core Processor',
        sku: 'CPU-INT-14700K',
        quantity: 4,
        unitCost: 42500,
        serials: [
          'SN-INT-14700K-08912',
          'SN-INT-14700K-08913',
          'SN-INT-14700K-08914',
          'SN-INT-14700K-08915',
        ],
      },
    ],
  },
  {
    id: 'pur-2',
    invoiceNumber: 'PINV-2026-0048',
    supplier: 'Global Brand Pvt. Ltd.',
    date: '2026-01-20',
    totalAmount: 147000,
    notes: 'Asus ROG distributor shipment',
    createdBy: 'admin',
    createdAt: '2026-01-20T11:00:00.000Z',
    items: [
      {
        productId: 'prod-2',
        productName: 'Asus ROG Strix Z790-F Gaming WiFi II Motherboard',
        sku: 'MB-ASUS-Z790F',
        quantity: 3,
        unitCost: 49000,
        serials: [
          'SN-ASUS-Z790F-99411',
          'SN-ASUS-Z790F-99412',
          'SN-ASUS-Z790F-99413',
        ],
      },
    ],
  },
];

const DEFAULT_SALES: SaleTransaction[] = [
  {
    id: 'sale-1',
    invoiceNumber: 'SINV-2026-0108',
    customerName: 'Ashiqur Rahman (Studio 9)',
    customerPhone: '+880 1712-445566',
    date: '2026-02-20',
    paymentMethod: 'Bank Transfer',
    totalAmount: 216800,
    notes: 'Complete editing rig package with serial-recorded warranty cards',
    soldBy: 'sales01',
    createdAt: '2026-02-20T14:40:00.000Z',
    items: [
      {
        productId: 'prod-1',
        productName: 'Intel Core i7-14700K 20-Core Processor',
        sku: 'CPU-INT-14700K',
        quantity: 1,
        unitPrice: 46800,
        serials: ['SN-INT-14700K-08910'],
      },
      {
        productId: 'prod-2',
        productName: 'Asus ROG Strix Z790-F Gaming WiFi II Motherboard',
        sku: 'MB-ASUS-Z790F',
        quantity: 1,
        unitPrice: 53500,
        serials: ['SN-ASUS-Z790F-99408'],
      },
      {
        productId: 'prod-4',
        productName: 'MSI GeForce RTX 4070 Ti SUPER 16G Ventus 3X',
        sku: 'GPU-MSI-RTX4070TS',
        quantity: 1,
        unitPrice: 116500,
        serials: ['SN-MSI-4070TS-77099'],
      },
    ],
  },
];

export const storageService = {
  loadDatabase(): AppDatabase {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.products && parsed.serials) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored ERP database, using defaults:', e);
    }

    // Default seed
    const initialDb: AppDatabase = {
      users: DEFAULT_USERS,
      products: DEFAULT_PRODUCTS,
      serials: DEFAULT_SERIALS,
      purchases: DEFAULT_PURCHASES,
      sales: DEFAULT_SALES,
      company: DEFAULT_COMPANY,
    };
    this.saveDatabase(initialDb);
    return initialDb;
  },

  saveDatabase(db: AppDatabase): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Error saving ERP database to localStorage:', e);
    }
  },

  resetToDefault(): AppDatabase {
    const initialDb: AppDatabase = {
      users: DEFAULT_USERS,
      products: DEFAULT_PRODUCTS,
      serials: DEFAULT_SERIALS,
      purchases: DEFAULT_PURCHASES,
      sales: DEFAULT_SALES,
      company: DEFAULT_COMPANY,
    };
    this.saveDatabase(initialDb);
    return initialDb;
  },

  // Remember login info (requested explicitly: "I have to log in and save my login info")
  getRememberedLogin(): { username: string; remember: boolean } | null {
    try {
      const raw = localStorage.getItem(REMEMBERED_USER_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return null;
  },

  setRememberedLogin(username: string, remember: boolean): void {
    try {
      if (remember) {
        localStorage.setItem(
          REMEMBERED_USER_KEY,
          JSON.stringify({ username, remember: true })
        );
      } else {
        localStorage.removeItem(REMEMBERED_USER_KEY);
      }
    } catch {
      // ignore
    }
  },

  exportBackup(): string {
    const db = this.loadDatabase();
    return JSON.stringify(db, null, 2);
  },

  importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.users && parsed.products && parsed.serials) {
        this.saveDatabase(parsed);
        return true;
      }
    } catch (e) {
      console.error('Invalid backup JSON:', e);
    }
    return false;
  }
};
