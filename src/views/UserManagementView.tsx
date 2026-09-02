import React, { useState } from 'react';
import { User, UserRole } from '../types/inventory';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  X,
  Lock,
  Building2,
  UserCheck
} from 'lucide-react';

interface UserManagementViewProps {
  users: User[];
  currentUser: User | null;
  onSaveUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserActive: (userId: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onToggleUserActive,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [successNotice, setSuccessNotice] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  // If user is not admin, show security barrier
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white rounded-xl border border-rose-200 p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Administrator Privileges Required</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
          Only the business Administrator can give access to others, create new staff logins, and manage user roles. Please log in with the administrator account.
        </p>
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
          Current logged-in account: <strong>{currentUser?.username}</strong> ({currentUser?.role})
        </div>
      </div>
    );
  }

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  return (
    <div id="user-management-container" className="max-w-5xl mx-auto space-y-5">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                Staff &amp; User Access Management
              </h1>
              <p className="text-xs text-slate-500">
                Administrator control panel to provision accounts, assign roles, and grant system permissions.
              </p>
            </div>
          </div>
        </div>

        <button
          id="btn-create-new-user"
          onClick={handleOpenAddModal}
          className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      {/* Success banner */}
      {successNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex justify-between items-center">
          <span>{successNotice}</span>
          <button onClick={() => setSuccessNotice('')} className="text-emerald-700 font-bold">&times;</button>
        </div>
      )}

      {/* Admin Notice Pill */}
      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
        <Shield className="w-4 h-4 text-blue-600 shrink-0" />
        <div>
          <strong>Admin Control Active:</strong> You are logged in as <span className="font-semibold">{currentUser?.fullName}</span> ({currentUser?.username}). As an admin, you can create new logins for your sales reps and inventory managers.
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Authorized Users ({users.length})
          </h2>
          <span className="text-xs text-slate-400">
            {users.filter((u) => u.isActive).length} Active Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">User &amp; Full Name</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">System Role</th>
                <th className="px-4 py-3">Assigned Branch</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const isSelf = user.id === currentUser?.id;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 uppercase">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{user.fullName}</span>
                            {isSelf && (
                              <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.2 rounded">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {user.email || 'No email registered'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono font-medium text-slate-800">
                      {user.username}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : user.role === 'manager'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {user.branch || 'Multiplan Center'}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          if (isSelf) {
                            alert('You cannot deactivate your own logged-in admin account.');
                            return;
                          }
                          onToggleUserActive(user.id);
                        }}
                        disabled={isSelf}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                        } ${isSelf ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                        title="Click to toggle access permission"
                      >
                        {user.isActive ? 'Active (Allowed)' : 'Inactive (Blocked)'}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit user or reset password"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete user ${user.username}? This will permanently revoke their access.`)) {
                                onDeleteUser(user.id);
                                setSuccessNotice(`User ${user.username} deleted.`);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create / Edit Modal */}
      {isModalOpen && (
        <UserFormModal
          user={editingUser}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
          }}
          onSave={(saved) => {
            onSaveUser(saved);
            setIsModalOpen(false);
            setEditingUser(null);
            setSuccessNotice(
              editingUser
                ? `Updated user ${saved.username} successfully.`
                : `Created new user ${saved.username} (${saved.role}). They can now log in!`
            );
          }}
        />
      )}
    </div>
  );
};

// Modal for Creating or Editing a User
interface UserFormModalProps {
  user: User | null;
  onClose: () => void;
  onSave: (user: User) => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  user,
  onClose,
  onSave,
}) => {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState(user?.password || '');
  const [role, setRole] = useState<UserRole>(user?.role || 'sales');
  const [branch, setBranch] = useState(user?.branch || 'Multiplan Center');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isActive, setIsActive] = useState(user ? user.isActive : true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) return;

    const userObj: User = {
      id: user?.id || `usr-${Date.now()}`,
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      password: password.trim() || 'pass123',
      role,
      branch: branch.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      isActive,
      createdAt: user?.createdAt || new Date().toISOString(),
    };

    onSave(userObj);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-blue-700" />
            <span>{user ? 'Edit Staff Credentials' : 'Create New User Account'}</span>
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Staff Full Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Mahfuz Ahmed"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Username (Login ID) *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. mahfuz01"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Password *
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. pass123"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                System Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
              >
                <option value="sales">Sales Executive</option>
                <option value="manager">Inventory Manager</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assigned Branch / Location
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Multiplan Center"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1711-..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@computervillage.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <span className="font-semibold text-slate-800">
                Account is Active (Can log in to system)
              </span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-xs"
            >
              {user ? 'Update Account' : 'Create Staff Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
