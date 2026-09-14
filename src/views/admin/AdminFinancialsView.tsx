import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  FileText, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PaymentRecord } from '../../types';

export const AdminFinancialsView: React.FC = () => {
  const { formatPrice, formatDate } = useLanguage();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFinancials();
  }, []);

  const loadFinancials = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminFinancials();
      setPayments(res.payments || []);
    } catch (err) {
      console.error('Failed to load admin financials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalVolume = payments
    .filter(p => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  const iranianGatewayVolume = payments
    .filter(p => p.status === 'SUCCESS' && p.provider === 'IRANIAN_GATEWAY')
    .reduce((sum, p) => sum + p.amount, 0);

  const cryptoVolume = payments
    .filter(p => p.status === 'SUCCESS' && p.provider === 'CRYPTO')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Financial Transactions & Gateways
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Global ledger of Iranian Shetab, Crypto, and Card payments.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadFinancials}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Ledger
        </Button>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 space-y-1">
          <span className="text-xs text-zinc-500">Gross Processed Volume</span>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{formatPrice(totalVolume)}</div>
          <span className="text-[11px] text-zinc-400">All successful platform sales</span>
        </Card>

        <Card className="p-5 space-y-1">
          <span className="text-xs text-zinc-500">Iranian Shetab Volume</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(iranianGatewayVolume)}</div>
          <span className="text-[11px] text-zinc-400">Shaparak network settlement</span>
        </Card>

        <Card className="p-5 space-y-1">
          <span className="text-xs text-zinc-500">Crypto Gateways</span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatPrice(cryptoVolume)}</div>
          <span className="text-[11px] text-zinc-400">USDT TRC20, BTC, ETH</span>
        </Card>
      </div>

      {/* Payments Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Transaction Ref</th>
              <th className="py-3 px-4">User ID</th>
              <th className="py-3 px-4">Provider</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                <td className="py-3 px-4 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                  {p.transactionReference}
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">
                  {p.userId.slice(0, 8)}
                </td>
                <td className="py-3 px-4 font-mono text-[11px]">{p.provider}</td>
                <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                  {formatPrice(p.amount)}
                </td>
                <td className="py-3 px-4">
                  <Badge
                    variant={p.status === 'SUCCESS' ? 'success' : p.status === 'FAILED' ? 'error' : 'neutral'}
                    size="sm"
                  >
                    {p.status}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-zinc-400">{formatDate(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
