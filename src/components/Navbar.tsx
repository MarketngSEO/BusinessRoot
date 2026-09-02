import React from 'react';
import { User, CompanyConfig } from '../types/inventory';
import { 
  Building2, 
  MapPin, 
  User as UserIcon, 
  LogOut, 
  Search, 
  ShieldCheck, 
  RefreshCw,
  Clock
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  company: CompanyConfig;
  onLogout: () => void;
  onOpenQuickFind: () => void;
  onRefresh: () => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  company,
  onLogout,
  onOpenQuickFind,
  onRefresh,
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header 
      id="main-app-header" 
      className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs select-none"
    >
      {/* Top Banner with Company Info and System Status */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-blue-700" />
            <span>Company: <strong className="text-slate-900 font-semibold">{company.companyName}</strong></span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Location: <strong className="text-slate-800">{company.branchLocation}</strong></span>
          </div>
          <span className="hidden sm:inline text-slate-300">|</span>
          <div className="hidden sm:flex items-center gap-1 text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] px-2 py-0.5 rounded font-mono font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            System Live (v2.19.2026)
          </span>
          <button
            id="btn-refresh-data"
            onClick={onRefresh}
            title="Refresh local data"
            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand identity matching the user's Bizness Roots distribution ERP */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-lg tracking-wider shadow-sm">
              <span className="text-blue-200 text-xs font-semibold uppercase mr-0.5">B</span>R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-blue-900 text-base leading-none">BIZNESS</span>
                <span className="font-bold text-blue-600 italic text-base leading-none">roots</span>
                <span className="text-[9px] text-slate-400 font-mono align-super">®</span>
              </div>
              <p className="text-[10px] text-slate-500 tracking-wide font-medium">Distribution &amp; Stock ERP</p>
            </div>
          </div>
        </div>

        {/* Universal Find / Search Bar shortcut */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            id="btn-global-find-shortcut"
            onClick={onOpenQuickFind}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-500 transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Find product, SKU or serial code...</span>
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded text-slate-400 font-mono shadow-2xs">
              Quick Find
            </kbd>
          </button>
        </div>

        {/* User Badge & Actions */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="flex items-center gap-2 text-right">
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-slate-800 flex items-center justify-end gap-1">
                  <span>Welcome {currentUser.fullName}</span>
                  {currentUser.role === 'admin' && (
                    <span title="Administrator Access" className="text-blue-600">
                      <ShieldCheck className="w-3.5 h-3.5 inline" />
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 capitalize">
                  Role: <span className="font-semibold text-blue-700">{currentUser.role}</span> ({currentUser.branch})
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs uppercase">
                {currentUser.fullName.charAt(0)}
              </div>
            </div>
          )}

          <button
            id="btn-app-logout"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md transition"
            title="Log out of ERP"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
