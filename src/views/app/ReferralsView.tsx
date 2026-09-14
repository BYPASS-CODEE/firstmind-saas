import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  DollarSign, 
  Users, 
  Trophy, 
  TrendingUp, 
  ArrowUpRight,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { ReferralData, LeaderboardEntry } from '../../types';

export const ReferralsView: React.FC = () => {
  const { user } = useAuth();
  const { t, formatPrice, formatDate, language } = useLanguage();

  const [data, setData] = useState<ReferralData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'global' | 'monthly'>('global');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  useEffect(() => {
    loadLeaderboard(leaderboardPeriod);
  }, [leaderboardPeriod]);

  const loadReferralData = async () => {
    try {
      const res = await api.getReferralDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load referral data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLeaderboard = async (period: 'global' | 'monthly') => {
    try {
      const res = await api.getLeaderboard(period);
      setLeaderboard(res.leaderboard || []);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
  };

  const copyLink = () => {
    if (!data?.referralLink) return;
    navigator.clipboard.writeText(data.referralLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {t('referralsTitle')}
          </h1>
          <Badge variant="success" size="sm">{t('referralsBadge')}</Badge>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          {t('referralsRule')}
        </p>
      </div>

      {/* Share Link Banner Card */}
      <Card className="p-6 border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              {t('referralsYourLink')}
            </span>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {t('referralsInviteTitle')}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {t('referralsInviteDesc')}
            </p>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono select-all">
              <span className="truncate max-w-xs">{data?.referralLink || t('referralsLoadingLink')}</span>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={copyLink}
              leftIcon={copySuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            >
              {copySuccess ? t('referralsCopied') : t('referralsCopyLink')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Earnings */}
        <Card className="p-5 space-y-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('referralsTotalEarnings')}</span>
          <div className="flex items-baseline gap-1 pt-1">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatPrice(data?.stats.totalEarnings || 0)}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 pt-1">{t('referralsLifetimeSales')}</p>
        </Card>

        {/* Monthly Earnings */}
        <Card className="p-5 space-y-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('referralsMonthlyEarnings')}</span>
          <div className="flex items-baseline gap-1 pt-1">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatPrice(data?.stats.monthlyEarnings || 0)}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 pt-1">{t('referralsCurrentMonth')}</p>
        </Card>

        {/* Qualified Referrals */}
        <Card className="p-5 space-y-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('referralsSubscribed')}</span>
          <div className="flex items-baseline gap-1 pt-1">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {data?.stats.qualifiedReferrals || 0}
            </span>
            <span className="text-xs text-zinc-400">/ {data?.stats.totalReferrals || 0} total</span>
          </div>
          <p className="text-[11px] text-zinc-400 pt-1">{t('referralsActiveCustomers')}</p>
        </Card>

        {/* Leaderboard Position */}
        <Card className="p-5 space-y-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('referralsLeaderboardRank')}</span>
          <div className="flex items-baseline gap-1 pt-1">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {data?.stats.leaderboardRank ? `#${data.stats.leaderboardRank}` : t('referralsUnranked')}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 pt-1">{t('referralsBasedOnCommissions')}</p>
        </Card>
      </div>

      {/* Referred Users Table & Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* User's Referrals (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t('referralsReferredAccounts')}
            </h3>
            <span className="text-xs text-zinc-400">{data?.referrals.length || 0} {t('referralsRecords')}</span>
          </div>

          {data?.referrals.length === 0 ? (
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title={t('emptyReferralsTitle', 'No referrals yet.')}
              description={t('emptyReferralsDesc', 'Share your referral link to earn a $1.00 recurring commission on every qualifying subscriber.')}
              actionLabel={t('referralsCopyAction')}
              onAction={copyLink}
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">{t('referralsCreator')}</th>
                    <th className="py-3 px-4">{t('referralsStatus')}</th>
                    <th className="py-3 px-4">{t('referralsCommission')}</th>
                    <th className="py-3 px-4">{t('referralsRegistered')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {data?.referrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                        {ref.referredUserName}
                        <span className="block text-[11px] text-zinc-400 font-mono">{ref.referredUserEmail}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={ref.status === 'COMMISSIONED' ? 'success' : 'neutral'}
                          size="sm"
                        >
                          {ref.status === 'COMMISSIONED' ? t('referralsPaidCommissioned') : t('referralsRegisteredNoPlan')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                        {ref.status === 'COMMISSIONED' ? formatPrice(ref.commissionAmount) : '$0.00'}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {formatDate(ref.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Real-Data Leaderboard (5 cols) */}
        {/* Strict Rule 29: Leaderboard calculated from real referral data! If empty, show empty state! */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>{t('referralsLeaderboard')}</span>
            </h3>

            {/* Period switcher */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setLeaderboardPeriod('global')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  leaderboardPeriod === 'global'
                    ? 'bg-white dark:bg-zinc-900 font-semibold shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {t('referralsGlobal')}
              </button>
              <button
                onClick={() => setLeaderboardPeriod('monthly')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  leaderboardPeriod === 'monthly'
                    ? 'bg-white dark:bg-zinc-900 font-semibold shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {t('referralsMonthly')}
              </button>
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <EmptyState
              icon={<Trophy className="w-6 h-6" />}
              title={t('emptyLeaderboardTitle', 'No referral leaderboard entries yet.')}
              description={t('emptyLeaderboardDesc', 'Rankings will appear as verified referral commissions are completed.')}
            />
          ) : (
            <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {leaderboard.map((entry, index) => {
                const isTop3 = index < 3;
                return (
                  <div key={entry.userId} className="p-3.5 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        index === 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        index === 1 ? 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200' :
                        index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                        'text-zinc-400'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{entry.userName}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">{entry.referralCode}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{formatPrice(entry.earnings)}</p>
                        <p className="text-[11px] text-zinc-400">{entry.referralsCount} {t('referralsSales')}</p>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      </div>

    </div>
  );
};
