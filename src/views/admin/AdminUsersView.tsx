import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserCheck, 
  UserX, 
  Shield, 
  Zap, 
  MoreHorizontal, 
  AlertCircle, 
  Check,
  RefreshCw 
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { User } from '../../types';

export const AdminUsersView: React.FC = () => {
  const { formatDate } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Credit adjustment modal
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState<number>(10);
  const [creditReason, setCreditReason] = useState<string>('Administrative manual adjustment');
  const [isSubmittingCredit, setIsSubmittingCredit] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, statusFilter]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        limit: 50
      });
      setUsers(res.users || []);
    } catch (err) {
      console.error('Failed to load admin users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustCredits = async () => {
    if (!targetUser) return;
    setIsSubmittingCredit(true);
    try {
      await api.adjustUserCredits(targetUser.id, creditAmount, creditReason);
      setCreditModalOpen(false);
      setActionMessage(`Successfully adjusted credits for ${targetUser.email}`);
      setTimeout(() => setActionMessage(null), 3000);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust credits.');
    } finally {
      setIsSubmittingCredit(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to change status of ${user.email} to ${newStatus}?`)) return;
    try {
      await api.updateUserStatus(user.id, newStatus);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  const handleToggleRole = async (user: User) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Are you sure you want to change role of ${user.email} to ${newRole}?`)) return;
    try {
      await api.updateUserRole(user.id, newRole);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user role.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            User Account Management
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Search, inspect creator balances, audit roles, and perform credit grants.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadUsers}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Users
        </Button>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, email, or referral code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
        >
          <option value="">All Roles</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* User Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Referral Code</th>
              <th className="py-3 px-4">Registered</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                <td className="py-3 px-4">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{u.name}</div>
                  <div className="text-[11px] text-zinc-400 font-mono">{u.email}</div>
                </td>
                <td className="py-3 px-4">
                  <Badge variant={u.role === 'ADMIN' ? 'error' : 'neutral'} size="sm">
                    {u.role}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <Badge variant={u.status === 'ACTIVE' ? 'success' : 'error'} size="sm">
                    {u.status}
                  </Badge>
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">
                  {u.referralCode}
                </td>
                <td className="py-3 px-4 text-zinc-400">{formatDate(u.createdAt)}</td>
                <td className="py-3 px-4 text-right space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTargetUser(u);
                      setCreditModalOpen(true);
                    }}
                    leftIcon={<Zap className="w-3 h-3 text-amber-500" />}
                  >
                    Adjust Credits
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleRole(u)}
                    title="Toggle Admin/User Role"
                  >
                    <Shield className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(u)}
                    title={u.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                    className={u.status === 'ACTIVE' ? 'text-rose-500' : 'text-emerald-500'}
                  >
                    {u.status === 'ACTIVE' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Adjust Credits Modal */}
      {creditModalOpen && targetUser && (
        <Modal
          isOpen={creditModalOpen}
          onClose={() => setCreditModalOpen(false)}
          maxWidth="sm"
          title={`Adjust Credits: ${targetUser.name}`}
          description={`Enter positive number to grant credits, or negative number to deduct.`}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Credit Adjustment Amount</label>
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(parseInt(e.target.value, 10) || 0)}
                className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Audit Log Justification</label>
              <input
                type="text"
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setCreditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAdjustCredits}
                isLoading={isSubmittingCredit}
              >
                Apply Adjustment
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
