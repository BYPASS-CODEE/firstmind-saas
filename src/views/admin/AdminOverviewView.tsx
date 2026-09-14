import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CreditCard, 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  Server, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { AdminStats, AuditLogRecord } from '../../types';

interface AdminOverviewViewProps {
  navigate: (path: string) => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({ navigate }) => {
  const { formatPrice, formatDate } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminAuditLogs({ limit: 10 })
      ]);
      setStats(statsRes.stats);
      setLogs(logsRes.logs || []);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Administrative Control Center
            </h1>
            <Badge variant="error" size="sm">Admin Authorization</Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            System health, usage telemetry, audit trail, and operational controls.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Telemetry
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Registered Creators</span>
            <Users className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {stats?.totalUsers || 0}
          </div>
          <span className="text-[11px] text-zinc-400">Total registered database users</span>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Active Subscriptions</span>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {stats?.activeSubscriptions || 0}
          </div>
          <span className="text-[11px] text-zinc-400">Subscribed active billing cycles</span>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Gross Platform Revenue</span>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatPrice(stats?.totalRevenue || 0)}
          </div>
          <span className="text-[11px] text-zinc-400">Verified transactions across all gateways</span>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Generations Completed</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {stats?.totalGenerations || 0}
          </div>
          <span className="text-[11px] text-zinc-400">Total synthesis jobs processed</span>
        </Card>
      </div>

      {/* Quick Nav Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className="p-4 cursor-pointer hover:border-zinc-400 transition-colors"
          onClick={() => navigate('/admin/users')}
        >
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">User Management</h4>
          <p className="text-xs text-zinc-500 mt-1">Inspect creators, adjust credits, manage account statuses.</p>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:border-zinc-400 transition-colors"
          onClick={() => navigate('/admin/financials')}
        >
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Financial Ledger</h4>
          <p className="text-xs text-zinc-500 mt-1">Review gateways, payment logs, and referral commission accounting.</p>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:border-zinc-400 transition-colors"
          onClick={() => navigate('/admin/settings')}
        >
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Platform Settings</h4>
          <p className="text-xs text-zinc-500 mt-1">Configure maintenance mode, Gemini API keys, default credits.</p>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-500" />
          <span>System Audit Trail</span>
        </h3>

        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="py-3 px-4 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                    <Badge variant="neutral" size="sm">{log.action}</Badge>
                  </td>
                  <td className="py-3 px-4">{log.actorName || log.actorId}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">{log.targetEntity || '-'}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">{log.ipAddress || '127.0.0.1'}</td>
                  <td className="py-3 px-4 text-zinc-400">{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
