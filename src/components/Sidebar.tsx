import React from 'react';
import { User } from '../types/inventory';
import {
  LayoutDashboard,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  QrCode,
  Users,
  Settings,
  Lock,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'stock'
  | 'purchase'
  | 'sales'
  | 'serials'
  | 'users'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: User | null;
  lowStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  lowStockCount,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
    adminOnly?: boolean;
    description: string;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'KPIs & recent activities',
    },
    {
      id: 'stock',
      label: 'Stock View (Inventory)',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'Stock list, PDF & Excel export',
    },
    {
      id: 'purchase',
      label: 'Purchase (Stock In)',
      icon: ArrowDownToLine,
      description: 'Add stock & store serial codes',
    },
    {
      id: 'sales',
      label: 'Sales (Stock Out)',
      icon: ArrowUpFromLine,
      description: 'Sell stock & track serials sold',
    },
    {
      id: 'serials',
      label: 'Serial Code Tracker',
      icon: QrCode,
      description: 'Lookup & track serial history',
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      adminOnly: true,
      description: 'Create & manage staff access',
    },
    {
      id: 'settings',
      label: 'Business Setup & Data',
      icon: Settings,
      description: 'Company info & backups',
    },
  ];

  return (
    <aside 
      id="app-sidebar-nav" 
      className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none"
    >
      <div className="p-3 border-b border-slate-800 hidden md:block">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
          Operations Menu
        </div>
      </div>

      <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isRestricted = item.adminOnly && !isAdmin;

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => {
                if (!isRestricted) {
                  onSelectTab(item.id);
                }
              }}
              disabled={isRestricted}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition group ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : isRestricted
                  ? 'opacity-45 cursor-not-allowed text-slate-500 hover:bg-transparent'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 text-left">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <div className="truncate">
                  <div className="truncate flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {item.adminOnly && (
                      <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-slate-800 text-amber-300 border border-slate-700">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {item.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-1">
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
                {isRestricted && <Lock className="w-3 h-3 text-slate-500" />}
                {!isRestricted && !isActive && (
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition" />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Role & Storage status footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span>Active Role:</span>
          <span className="font-semibold text-slate-200 capitalize">
            {currentUser?.role || 'Guest'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Data Storage:</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Auto-Saved
          </span>
        </div>
      </div>
    </aside>
  );
};
