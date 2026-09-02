import { useState, useEffect } from 'react';
import { User, Product, SerialItem, PurchaseTransaction, SaleTransaction, CompanyConfig } from './types/inventory';
import { storageService, AppDatabase } from './services/storageService';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { StockView } from './views/StockView';
import { PurchaseView } from './views/PurchaseView';
import { SalesView } from './views/SalesView';
import { SerialTrackerView } from './views/SerialTrackerView';
import { UserManagementView } from './views/UserManagementView';
import { SettingsView } from './views/SettingsView';
import { QuickFindModal } from './components/QuickFindModal';

export default function App() {
  const [database, setDatabase] = useState<AppDatabase>(() => storageService.loadDatabase());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isQuickFindOpen, setIsQuickFindOpen] = useState(false);
  const [stockInProductId, setStockInProductId] = useState<string | undefined>(undefined);

  // Auto-login if remembered login exists
  useEffect(() => {
    const remembered = storageService.getRememberedLogin();
    if (remembered && remembered.username) {
      const user = database.users.find(
        (u) => u.username.toLowerCase() === remembered.username.toLowerCase() && u.isActive
      );
      if (user) {
        setCurrentUser(user);
      }
    }
  }, [database.users]);

  // Keep local storage synchronized whenever database changes
  const updateDb = (updater: (prev: AppDatabase) => AppDatabase) => {
    setDatabase((prev) => {
      const next = updater(prev);
      storageService.saveDatabase(next);
      return next;
    });
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out of the ERP system?')) {
      setCurrentUser(null);
    }
  };

  const handleRefresh = () => {
    const freshDb = storageService.loadDatabase();
    setDatabase(freshDb);
  };

  // Product CRUD
  const handleSaveProduct = (product: Product) => {
    updateDb((prev) => {
      const exists = prev.products.some((p) => p.id === product.id);
      const updatedProducts = exists
        ? prev.products.map((p) => (p.id === product.id ? product : p))
        : [product, ...prev.products];
      return { ...prev, products: updatedProducts };
    });
  };

  const handleDeleteProduct = (productId: string) => {
    updateDb((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== productId),
      serials: prev.serials.filter((s) => s.productId !== productId),
    }));
  };

  // Stock In (Purchase)
  const handleRecordPurchase = (
    purchase: PurchaseTransaction,
    newSerials: SerialItem[],
    updatedProducts: Product[]
  ) => {
    updateDb((prev) => ({
      ...prev,
      purchases: [purchase, ...prev.purchases],
      serials: [...newSerials, ...prev.serials],
      products: updatedProducts,
    }));
  };

  // Stock Out (Sale)
  const handleRecordSale = (
    sale: SaleTransaction,
    updatedSerials: SerialItem[],
    updatedProducts: Product[]
  ) => {
    updateDb((prev) => ({
      ...prev,
      sales: [sale, ...prev.sales],
      serials: updatedSerials,
      products: updatedProducts,
    }));
  };

  // Serial status update
  const handleUpdateSerialStatus = (serialId: string, newStatus: SerialItem['status']) => {
    updateDb((prev) => ({
      ...prev,
      serials: prev.serials.map((s) =>
        s.id === serialId ? { ...s, status: newStatus } : s
      ),
    }));
  };

  // User Management
  const handleSaveUser = (user: User) => {
    updateDb((prev) => {
      const exists = prev.users.some((u) => u.id === user.id);
      const updatedUsers = exists
        ? prev.users.map((u) => (u.id === user.id ? user : u))
        : [...prev.users, user];
      return { ...prev, users: updatedUsers };
    });
  };

  const handleDeleteUser = (userId: string) => {
    updateDb((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== userId),
    }));
  };

  const handleToggleUserActive = (userId: string) => {
    updateDb((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === userId ? { ...u, isActive: !u.isActive } : u
      ),
    }));
  };

  // Company Settings
  const handleUpdateCompany = (config: CompanyConfig) => {
    updateDb((prev) => ({
      ...prev,
      company: config,
    }));
  };

  const handleReloadDatabase = () => {
    setDatabase(storageService.loadDatabase());
  };

  // Quick navigation to Purchase with preselected product
  const handleOpenStockIn = (productId?: string) => {
    setStockInProductId(productId);
    setActiveTab('purchase');
  };

  const lowStockCount = database.products.filter(
    (p) => p.currentStock <= p.minStockAlert
  ).length;

  // If user is not authenticated, render LoginView
  if (!currentUser) {
    return (
      <LoginView
        users={database.users}
        onLoginSuccess={handleLoginSuccess}
        companyName={database.company.companyName}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-800">
      {/* Top Enterprise Header */}
      <Navbar
        currentUser={currentUser}
        company={database.company}
        onLogout={handleLogout}
        onOpenQuickFind={() => setIsQuickFindOpen(true)}
        onRefresh={handleRefresh}
        activeTab={activeTab}
      />

      {/* Main Layout: Left Sidebar Navigation & Right Content Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setStockInProductId(undefined);
            setActiveTab(tab);
          }}
          currentUser={currentUser}
          lowStockCount={lowStockCount}
        />

        {/* Dynamic View Panel */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              products={database.products}
              serials={database.serials}
              purchases={database.purchases}
              sales={database.sales}
              company={database.company}
              currentUser={currentUser}
              onNavigate={(tab) => {
                setStockInProductId(undefined);
                setActiveTab(tab);
              }}
            />
          )}

          {activeTab === 'stock' && (
            <StockView
              products={database.products}
              serials={database.serials}
              company={database.company}
              currentUser={currentUser}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onOpenStockIn={handleOpenStockIn}
            />
          )}

          {activeTab === 'purchase' && (
            <PurchaseView
              products={database.products}
              company={database.company}
              currentUser={currentUser}
              initialProductId={stockInProductId}
              onRecordPurchase={handleRecordPurchase}
              onNavigateToStock={() => setActiveTab('stock')}
            />
          )}

          {activeTab === 'sales' && (
            <SalesView
              products={database.products}
              serials={database.serials}
              company={database.company}
              currentUser={currentUser}
              onRecordSale={handleRecordSale}
              onNavigateToStock={() => setActiveTab('stock')}
            />
          )}

          {activeTab === 'serials' && (
            <SerialTrackerView
              serials={database.serials}
              products={database.products}
              company={database.company}
              currentUser={currentUser}
              onUpdateSerialStatus={handleUpdateSerialStatus}
            />
          )}

          {activeTab === 'users' && (
            <UserManagementView
              users={database.users}
              currentUser={currentUser}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              onToggleUserActive={handleToggleUserActive}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              company={database.company}
              currentUser={currentUser}
              onUpdateCompany={handleUpdateCompany}
              onReloadDatabase={handleReloadDatabase}
            />
          )}
        </main>
      </div>

      {/* Global Quick Find Overlay */}
      <QuickFindModal
        isOpen={isQuickFindOpen}
        onClose={() => setIsQuickFindOpen(false)}
        products={database.products}
        serials={database.serials}
        company={database.company}
        onNavigate={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}
