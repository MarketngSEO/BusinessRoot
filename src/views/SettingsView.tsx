import React, { useState } from 'react';
import { CompanyConfig, User } from '../types/inventory';
import { storageService } from '../services/storageService';
import {
  Settings,
  Building2,
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Save,
  ShieldCheck,
  MapPin,
  AlertTriangle
} from 'lucide-react';

interface SettingsViewProps {
  company: CompanyConfig;
  currentUser: User | null;
  onUpdateCompany: (config: CompanyConfig) => void;
  onReloadDatabase: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  company,
  currentUser,
  onUpdateCompany,
  onReloadDatabase,
}) => {
  const [formData, setFormData] = useState<CompanyConfig>({ ...company });
  const [savedNotice, setSavedNotice] = useState('');
  const [importError, setImportError] = useState('');

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompany(formData);
    setSavedNotice('Business information saved successfully!');
    setTimeout(() => setSavedNotice(''), 3000);
  };

  const handleDownloadBackup = () => {
    const jsonStr = storageService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BiznessRoots_ERP_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storageService.importBackup(content);
      if (success) {
        setSavedNotice('System database restored successfully from file!');
        onReloadDatabase();
      } else {
        setImportError('Failed to restore backup: Invalid JSON structure.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (confirm('Are you sure you want to reset all inventory and transactions to standard demo state? Any unsaved custom items will be restored to defaults.')) {
      storageService.resetToDefault();
      onReloadDatabase();
      setSavedNotice('Restored to default demo inventory.');
    }
  };

  return (
    <div id="settings-view-container" className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              Enterprise Business Setup &amp; Data Storage
            </h1>
            <p className="text-xs text-slate-500">
              Configure company profile, branches, currency, and create secure offline backup archives.
            </p>
          </div>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{savedNotice}</span>
        </div>
      )}

      {importError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>{importError}</span>
        </div>
      )}

      {/* Company Profile Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-700" />
            Company &amp; Invoice Header Profile
          </h2>
        </div>

        <form onSubmit={handleSaveCompany} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Company / Business Name *
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ERP Tagline / Subtitle
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Branch Location *
              </label>
              <input
                type="text"
                value={formData.branchLocation}
                onChange={(e) => setFormData({ ...formData, branchLocation: e.target.value })}
                placeholder="e.g. Multiplan Center"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="৳, $, BDT, USD"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Physical Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                VAT / Tax Registration No (BIN)
              </label>
              <input
                type="text"
                value={formData.vatNumber || ''}
                onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Business Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Data Persistence, Backup & Restore Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-600" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Work Persistence &amp; System Backup
          </h2>
        </div>

        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong>Persistent Local Business Storage:</strong> All stock items, individual serial codes, purchase records, sales invoices, and user logins are automatically saved in your browser's persistent database. Your work is safe even if you refresh or close the browser tab.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Export JSON */}
          <button
            onClick={handleDownloadBackup}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <Download className="w-4 h-4 text-blue-600" />
                <span>Export System Backup</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Save full JSON snapshot containing all stocks, serials, and transactions.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-blue-700 mt-3 block">
              Download JSON File &rarr;
            </span>
          </button>

          {/* Import JSON */}
          <label className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition flex flex-col justify-between cursor-pointer">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Restore from Backup</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Load a previously saved backup file to restore complete inventory state.
              </p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
            <span className="text-[11px] font-semibold text-emerald-700 mt-3 block">
              Select Backup File &rarr;
            </span>
          </label>

          {/* Reset Demo */}
          <button
            onClick={handleResetDemo}
            className="p-3 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl text-left transition flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 group-hover:text-rose-700 text-xs">
                <RotateCcw className="w-4 h-4 text-slate-500 group-hover:text-rose-600" />
                <span>Reset Demo Inventory</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Restores standard Computer Village products and serial numbers catalog.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 group-hover:text-rose-700 mt-3 block">
              Reset Data &rarr;
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
