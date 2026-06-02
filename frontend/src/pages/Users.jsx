import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import EmptyState from '../components/EmptyState';
import { TableRowSkeleton } from '../components/Skeleton';
import adminUserService from '../services/adminUserService';
import { 
  Users as UsersIcon, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  AlertCircle,
  Ban,
  CheckCircle2,
  Edit,
  Mail,
  UserCog
} from 'lucide-react';

const Users = () => {
  useDocumentTitle('Identity & Access Management');
  const { user: currentUser } = useAuth();
  const toast = useToast();
  
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const limit = 10;

  // Modals / Actions
  const [isProcessingId, setIsProcessingId] = useState(null);
  const [roleModalData, setRoleModalData] = useState(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;

      const response = await adminUserService.getUsers(params);
      const data = response.data || response;
      setUsers(data.results || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to retrieve user accounts. Ensure you have administrative privileges.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleBanToggle = async (targetUser) => {
    if (targetUser._id === currentUser._id) {
      toast.error("You cannot ban or unban your own account.");
      return;
    }

    if (!window.confirm(`Are you sure you want to ${targetUser.isBanned ? 'unban' : 'ban'} ${targetUser.email}?`)) {
      return;
    }

    setIsProcessingId(targetUser._id);
    try {
      if (targetUser.isBanned) {
        await adminUserService.unbanUser(targetUser._id);
      } else {
        await adminUserService.banUser(targetUser._id);
      }
      toast.success(`User successfully ${targetUser.isBanned ? 'unbanned' : 'banned'}.`);
      fetchUsers();
    } catch (err) {
      console.error('Failed to toggle ban status:', err);
      toast.error(err.response?.data?.message || 'Failed to update user ban status.');
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleRoleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!roleModalData) return;

    if (roleModalData.user._id === currentUser._id) {
      toast.error("Self-modification of administrative roles is prohibited to prevent accidental lockouts.");
      setRoleModalData(null);
      return;
    }

    setIsProcessingId(roleModalData.user._id);
    try {
      await adminUserService.updateRole(roleModalData.user._id, roleModalData.newRole);
      toast.success(`User role updated to ${roleModalData.newRole}.`);
      setRoleModalData(null);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update role:', err);
      toast.error(err.response?.data?.message || 'Failed to update user role.');
    } finally {
      setIsProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amazon-orange/10 border border-amazon-orange/20 text-amazon-orange shadow-inner">
            <UsersIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">Identity & Access Management</h2>
            <p className="text-xs text-slate-400 font-medium">Control user roles, enforce bans, and audit system access</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Toolbar: Search & Filter */}
      <div className="glass-card rounded-2xl border border-slate-800 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-amazon-orange/50 transition-all placeholder-slate-600"
          />
        </form>
        
        <div className="relative w-full md:w-auto flex items-center">
          <Filter className="absolute left-3 h-4 w-4 text-slate-500 pointer-events-none" />
          <select 
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-48 bg-slate-900/80 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-200 focus:outline-none focus:border-amazon-orange/50 appearance-none cursor-pointer transition-all"
          >
            <option value="">All Roles</option>
            <option value="user">Standard User</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">User Identity</th>
                <th className="px-6 py-4 font-bold">Contact</th>
                <th className="px-6 py-4 font-bold">Role</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-center">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={5} />
                  <TableRowSkeleton columns={5} />
                  <TableRowSkeleton columns={5} />
                  <TableRowSkeleton columns={5} />
                  <TableRowSkeleton columns={5} />
                </>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <EmptyState title="No Identities Found" message="Try searching for a different name or email address." />
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isProcessing = isProcessingId === u._id;
                  const isSelf = u._id === currentUser._id;
                  
                  return (
                    <tr key={u._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${u.role === 'admin' ? 'bg-amber-900/40 text-amazon-yellow border border-amber-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                            {u.firstName?.[0] || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-200 flex items-center gap-2">
                              {u.firstName} {u.lastName}
                              {isSelf && <span className="px-1.5 py-0.5 rounded bg-blue-900/40 border border-blue-500/30 text-blue-400 text-[9px] uppercase tracking-wider">You</span>}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {u._id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Mail className="h-3 w-3 text-slate-500" />
                          {u.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/40 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                            <ShieldCheck className="h-3 w-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {u.isBanned ? (
                          <span className="px-2.5 py-1 rounded-full bg-red-950/40 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider flex items-center w-max gap-1">
                            <Ban className="h-3 w-3" /> Banned
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center w-max gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => setRoleModalData({ user: u, newRole: u.role })}
                            disabled={isProcessing || isSelf}
                            className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${isSelf ? 'bg-slate-900 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed' : 'bg-slate-800 border-slate-700 hover:bg-amazon-orange hover:text-slate-950 text-slate-400'}`}
                            title="Change Role"
                          >
                            {isProcessing && roleModalData?.user._id === u._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />}
                          </button>
                          
                          <button 
                            onClick={() => handleBanToggle(u)}
                            disabled={isProcessing || isSelf}
                            className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${isSelf ? 'bg-slate-900 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed' : u.isBanned ? 'bg-emerald-950/30 border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400' : 'bg-red-950/30 border-red-500/30 hover:bg-red-500 hover:text-slate-950 text-red-400'}`}
                            title={u.isBanned ? "Unban User" : "Ban User"}
                          >
                            {isProcessing && !roleModalData ? <Loader2 className="h-4 w-4 animate-spin" /> : (u.isBanned ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />)}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between glass-card p-4 rounded-2xl border border-slate-800">
          <p className="text-xs text-slate-500">
            Showing page <span className="font-bold text-slate-300">{page}</span> of <span className="font-bold text-slate-300">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-xs font-bold text-slate-300 px-2">{page}</div>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Role Update Modal */}
      {roleModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setRoleModalData(null)}></div>
          <div className="glass-effect relative w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-slide-up">
            
            <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amazon-orange" />
                Modify Access Level
              </h3>
            </div>
            
            <form onSubmit={handleRoleUpdateSubmit} className="p-6 space-y-5">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/50 mb-4">
                <p className="text-xs text-slate-500 mb-1">Target Account:</p>
                <p className="font-bold text-slate-200">{roleModalData.user.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  New Role Assignment
                </label>
                <select 
                  required
                  value={roleModalData.newRole}
                  onChange={(e) => setRoleModalData({...roleModalData, newRole: e.target.value})}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-amazon-orange/70 focus:ring-1 focus:ring-amazon-orange/50 appearance-none"
                >
                  <option value="user">Standard User (Customer)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
                {roleModalData.newRole === 'admin' && roleModalData.user.role !== 'admin' && (
                  <p className="text-[10px] text-amber-400 mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Warning: User will gain full access to analytics, orders, and user management.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80 mt-6">
                <button
                  type="button"
                  onClick={() => setRoleModalData(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-sm font-bold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingId === roleModalData.user._id || roleModalData.newRole === roleModalData.user.role}
                  className="px-5 py-2.5 rounded-xl bg-amazon-orange hover:bg-amber-500 text-slate-950 text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
                >
                  {isProcessingId === roleModalData.user._id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Confirm Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Users;
