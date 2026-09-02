import React, { useState, useEffect } from 'react';
import { User } from '../types/inventory';
import { storageService } from '../services/storageService';
import { Lock, User as UserIcon, Shield, Eye, EyeOff, CheckCircle2, ArrowRight, Building2 } from 'lucide-react';

interface LoginViewProps {
  users: User[];
  onLoginSuccess: (user: User, remember: boolean) => void;
  companyName: string;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  onLoginSuccess,
  companyName,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill remembered login if previously saved
  useEffect(() => {
    const remembered = storageService.getRememberedLogin();
    if (remembered && remembered.username) {
      setUsername(remembered.username);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const trimmedUser = username.trim().toLowerCase();
    const foundUser = users.find(
      (u) => u.username.toLowerCase() === trimmedUser
    );

    if (!foundUser) {
      setErrorMsg('User not found. Check username or use the Admin login below.');
      return;
    }

    if (!foundUser.isActive) {
      setErrorMsg('This user account has been deactivated by the Administrator.');
      return;
    }

    if (foundUser.password && foundUser.password !== password) {
      setErrorMsg('Incorrect password. Default Admin password is "admin123".');
      return;
    }

    // Save remember info
    storageService.setRememberedLogin(foundUser.username, rememberMe);
    onLoginSuccess(foundUser, rememberMe);
  };

  const fillQuickLogin = (userType: 'admin' | 'sales') => {
    if (userType === 'admin') {
      setUsername('admin');
      setPassword('admin123');
      setErrorMsg('');
    } else {
      setUsername('sales01');
      setPassword('sales123');
      setErrorMsg('');
    }
  };

  return (
    <div 
      id="login-view-container" 
      className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden"
    >
      {/* Background architectural grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Branding Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-600 text-white font-bold text-2xl shadow-lg shadow-blue-900/40 mb-3">
            BR
          </div>
          <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-white tracking-tight">
            <span>BIZNESS</span>
            <span className="text-blue-400 italic">roots</span>
            <span className="text-xs text-slate-400 font-normal">®</span>
          </div>
          <p className="text-xs text-blue-200 font-medium tracking-wide mt-1">
            Distribution &amp; Supply Chain Enterprise ERP
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{companyName}</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-xl border border-slate-200/80 p-6 md:p-8">
          <div className="mb-5 pb-4 border-b border-slate-100">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-700" />
              Sign In to Your Workspace
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter your authorized staff or administrator credentials to proceed.
            </p>
          </div>

          {errorMsg && (
            <div 
              id="login-error-alert" 
              className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs leading-relaxed"
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label 
                htmlFor="input-login-username" 
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Username or Staff ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="input-login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or sales01"
                  required
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 transition"
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="input-login-password" 
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Option (User explicitly requested: save my login info) */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="checkbox-remember-login"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-slate-700 font-medium">Save my login info</span>
              </label>
              <span className="text-slate-400 text-[11px]">Browser Saved</span>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Login to System</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Access Helpers */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-2.5">
              Quick Test Credentials
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-quick-admin-login"
                onClick={() => fillQuickLogin('admin')}
                className="p-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-900 text-xs flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-blue-700" />
                    Admin Login
                  </span>
                  <span className="text-[10px] bg-blue-200 text-blue-800 font-mono px-1 rounded">Full</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1 font-mono">
                  admin / admin123
                </div>
              </button>

              <button
                type="button"
                id="btn-quick-sales-login"
                onClick={() => fillQuickLogin('sales')}
                className="p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-slate-600" />
                    Staff Login
                  </span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-1 rounded">Sales</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1 font-mono">
                  sales01 / sales123
                </div>
              </button>
            </div>

            <div className="mt-4 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-normal flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Admin Privileges:</strong> Only the Administrator account can create new staff accounts and give system access to others.
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 mt-5">
          All changes are automatically saved to local business database.
        </div>
      </div>
    </div>
  );
};
