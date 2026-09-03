import React from 'react';
import { Product, SerialItem, PurchaseTransaction, SaleTransaction, CompanyConfig, User } from '../types/inventory';
import { 
  DollarSign, 
  Boxes, 
  AlertTriangle, 
  QrCode, 
  TrendingUp, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Search, 
  CheckCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface DashboardViewProps {
  products: Product[];
  serials: SerialItem[];
  purchases: PurchaseTransaction[];
  sales: SaleTransaction[];
  company: CompanyConfig;
  currentUser: User | null;
  onNavigate: (tab: NavTab) => void;
  onViewInvoice?: (sale: SaleTransaction, mode?: 'paper' | 'pdf') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  serials,
  purchases,
  sales,
  company,
  currentUser,
  onNavigate,
  onViewInvoice,
}) => {
  // Metric calculations
  const totalStockUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalValuation = products.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0);
  const lowStockProducts = products.filter((p) => p.currentStock <= p.minStockAlert);
  const availableSerials = serials.filter((s) => s.status === 'available');
  const soldSerials = serials.filter((s) => s.status === 'sold');
  
  const totalSalesRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalPurchasesCost = purchases.reduce((acc, p) => acc + p.totalAmount, 0);

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Branch Operations</span>
            <span>•</span>
            <span>{company.branchLocation}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Welcome back, {currentUser?.fullName || 'Manager'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Inventory &amp; serial code records are up to date. You have <strong className="text-white font-semibold">{lowStockProducts.length}</strong> items approaching reorder threshold.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-dash-stock-in"
            onClick={() => onNavigate('purchase')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Stock Inward</span>
          </button>
          <button
            id="btn-dash-stock-out"
            onClick={() => onNavigate('sales')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            <span>New Sale</span>
          </button>
          <button
            id="btn-dash-find-serial"
            onClick={() => onNavigate('serials')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-blue-400" />
            <span>Track Serial</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Valuation */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Stock Value</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {company.currency} {totalValuation.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Based on {totalStockUnits} units in warehouse
          </p>
        </div>

        {/* Total Active SKUs */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Products &amp; Stock</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {products.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">SKUs cataloged</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Total Units:</span>
            <strong className="text-slate-800 font-semibold">{totalStockUnits} pcs</strong>
          </div>
        </div>

        {/* Serials Tracked */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Serial Codes Tracked</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-indigo-950 font-mono">
              {availableSerials.length}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">Available</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Sold / Dispatched:</span>
            <strong className="text-slate-700">{soldSerials.length} units</strong>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Low Stock Alert</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              lowStockProducts.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-xl font-bold font-mono ${
              lowStockProducts.length > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              {lowStockProducts.length}
            </span>
            <span className="text-xs text-slate-500">items need reorder</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {lowStockProducts.length > 0 ? 'Review inventory list' : 'All items sufficiently stocked'}
          </p>
        </div>
      </div>

      {/* Main Grid: Low Stock Alert & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-800">
                Low Stock &amp; Critical Inventory Alert
              </h2>
            </div>
            <button
              id="btn-dash-view-all-stock"
              onClick={() => onNavigate('stock')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Stock</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-medium">All products are above minimum alert thresholds.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">SKU &amp; Product</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5 text-center">In Stock</th>
                    <th className="px-4 py-2.5 text-center">Min Level</th>
                    <th className="px-4 py-2.5 text-right">Cost Price</th>
                    <th className="px-4 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{p.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.category}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-100 text-amber-900 border border-amber-200">
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 font-mono">
                        {p.minStockAlert} {p.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-800">
                        {company.currency} {p.costPrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onNavigate('purchase')}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold transition cursor-pointer"
                        >
                          Stock In
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Quick Stats & Recent Activity */}
        <div className="space-y-4">
          {/* Quick Business Overview Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Distribution Stats
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Sales Transactions:</span>
                <span className="font-semibold font-mono text-slate-800">{sales.length} invoices</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Sales Recorded:</span>
                <span className="font-semibold font-mono text-emerald-700">
                  {company.currency} {totalSalesRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Procurement Total:</span>
                <span className="font-semibold font-mono text-slate-800">
                  {company.currency} {totalPurchasesCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Inventory Turnover Ratio:</span>
                <span className="font-semibold text-blue-700">Healthy (2.8x)</span>
              </div>
            </div>
          </div>

          {/* Recent Operations Log */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Recent Records
              </h3>
            </div>
            
            <div className="space-y-2.5">
              {sales.slice(0, 4).map((s) => (
                <div 
                  key={s.id} 
                  className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs hover:bg-slate-100/70 transition flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 font-mono">#{s.invoiceNumber}</span>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold">
                        +{company.currency} {s.totalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Customer: {s.customerName} ({s.items.reduce((a, b) => a + b.quantity, 0)} items)
                    </div>
                  </div>

                  {onViewInvoice && (
                    <button
                      type="button"
                      onClick={() => onViewInvoice(s, 'pdf')}
                      className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[10px] border border-rose-200 transition cursor-pointer shrink-0"
                      title="View A4 PDF Invoice"
                    >
                      PDF
                    </button>
                  )}
                </div>
              ))}

              {purchases.slice(0, 2).map((p) => (
                <div key={p.id} className="p-2 rounded bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{p.invoiceNumber}</span>
                    <span className="text-[10px] font-mono text-blue-700 font-bold">
                      Procured: {company.currency} {p.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    Supplier: {p.supplier}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
