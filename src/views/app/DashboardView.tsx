import React, { useState, useEffect } from 'react';
import { 
  Wand2, 
  ImageIcon, 
  Layers, 
  Sparkles, 
  Palette, 
  Video, 
  CreditCard, 
  Share2, 
  Clock, 
  Zap, 
  ArrowRight,
  Download,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { GenerationJob, PaymentRecord } from '../../types';

interface DashboardViewProps {
  navigate: (path: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ navigate }) => {
  const { user, subscription } = useAuth();
  const { t, formatPrice, formatDate, language } = useLanguage();
  const [recentGenerations, setRecentGenerations] = useState<GenerationJob[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [referralEarnings, setReferralEarnings] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await api.getDashboard();
      setRecentGenerations(data.recentGenerations || []);
      setRecentPayments(data.recentPayments || []);
      setReferralEarnings(data.referralEarnings || 0);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!user) return;
    const url = `${window.location.origin}?ref=${user.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const remainingCredits = subscription ? Math.max(0, subscription.creditsTotal - subscription.creditsUsed) : 0;

  const quickTools = [
    { name: t('toolTextToImage'), path: '/create/image/text', icon: Wand2, descKey: 'dashboardTextToImageDesc', costKey: 'dashboardCredits', costVal: 1 },
    { name: t('toolImageToImage'), path: '/create/image/image', icon: ImageIcon, descKey: 'dashboardImageToImageDesc', costKey: 'dashboardCredits', costVal: 2 },
    { name: t('toolVariation'), path: '/create/image/variation', icon: Layers, descKey: 'dashboardVariationDesc', costKey: 'dashboardCredits', costVal: 2 },
    { name: t('toolEnhance'), path: '/create/image/enhance', icon: Sparkles, descKey: 'dashboardEnhanceDesc', costKey: 'dashboardCredits', costVal: 2 },
    { name: t('toolStyleTransfer'), path: '/create/image/style', icon: Palette, descKey: 'dashboardStyleDesc', costKey: 'dashboardCredits', costVal: 2 },
    { name: t('toolTextToVideo'), path: '/create/video/text', icon: Video, descKey: 'dashboardVideoDesc', costKey: 'dashboardCredits', costVal: 10 }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t('dashboardWelcome')}, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t('dashboardStudioId')}: <span className="font-mono">{user?.id.slice(0, 8)}</span> • {t('dashboardAccessTier')}: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{subscription?.planName || t('unsubscribed')}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/history')}
            leftIcon={<Clock className="w-3.5 h-3.5" />}
          >
            {t('dashboardHistoryArchive')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/create/image/text')}
            leftIcon={<Wand2 className="w-3.5 h-3.5" />}
          >
            {t('dashboardNewGeneration')}
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Remaining Credits */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('dashboardAvailableCredits')}</span>
            <div className="w-7 h-7 rounded-md bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {remainingCredits}
            </span>
            <span className="text-xs text-zinc-400">
              / {subscription?.creditsTotal || 0} {language === 'fa' ? 'کل' : 'total'}
            </span>
          </div>
          <div className="pt-2">
            <button
              onClick={() => navigate('/billing')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t('dashboardManagePlan')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </Card>

        {/* Subscription Status */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('dashboardSubscriptionStatus')}</span>
            <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={subscription?.status === 'ACTIVE' ? 'success' : 'neutral'} size="md">
              {subscription ? subscription.status : t('dashboardNoPlan')}
            </Badge>
            <span className="text-xs text-zinc-500 truncate">{subscription?.planName}</span>
          </div>
          <div className="pt-2 text-[11px] text-zinc-400">
            {subscription?.currentPeriodEnd ? `${t('dashboardRenewsOn')} ${formatDate(subscription.currentPeriodEnd)}` : t('dashboardUpgradeToGenerate')}
          </div>
        </Card>

        {/* Total Generations */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('dashboardCompletedAssets')}</span>
            <div className="w-7 h-7 rounded-md bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {recentGenerations.filter(g => g.status === 'COMPLETED').length}
            </span>
            <span className="text-xs text-zinc-400">{t('dashboardRecentInLog')}</span>
          </div>
          <div className="pt-2">
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t('dashboardViewArchive')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </Card>

        {/* Referral Commissions */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('dashboardReferralCommissions')}</span>
            <div className="w-7 h-7 rounded-md bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatPrice(referralEarnings)}
            </span>
            <span className="text-xs text-zinc-400">{t('dashboardEarned')}</span>
          </div>
          <div className="pt-2">
            <button
              onClick={() => navigate('/referrals')}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t('dashboardInspectLedger')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </Card>
      </div>

      {/* Quick Tool Launchers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {t('dashboardCreativeTools')}
          </h2>
          <span className="text-xs text-zinc-500">{t('dashboardPickModel')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card
                key={tool.name}
                className="p-4 flex items-start justify-between cursor-pointer group"
                hoverEffect
                onClick={() => navigate(tool.path)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{tool.name}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{t(tool.descKey)}</p>
                    <span className="inline-block mt-1 text-[11px] font-mono text-zinc-400">
                      {tool.costVal} {t(tool.costKey)}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-transform group-hover:translate-x-0.5" />
              </Card>
            );
          })}
        </div>
      </div>

      {/* Referral Quick Share Card */}
      <Card className="p-6 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">$1.00 {language === 'fa' ? 'به ازای هر اشتراک واجد شرایط' : 'per qualifying subscriber'}</Badge>
            <span className="text-xs font-mono text-zinc-500">{language === 'fa' ? 'کد:' : 'Code:'} <strong>{user?.referralCode}</strong></span>
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {t('dashboardReferralShareTitle')}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('dashboardReferralShareDesc')}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={copyReferralLink}
            className="w-full sm:w-auto"
          >
            {copySuccess ? t('dashboardLinkCopied') : t('dashboardCopyReferralLink')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/referrals')}
          >
            {t('dashboardViewLeaderboard')}
          </Button>
        </div>
      </Card>

      {/* Recent Generations & Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Generations Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t('dashboardRecentGenerations')}
            </h3>
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {t('dashboardViewAll')}
            </button>
          </div>

          {recentGenerations.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="w-5 h-5" />}
              title={t('emptyGenerationsTitle')}
              description={t('emptyGenerationsDesc')}
              actionLabel={t('toolTextToImage')}
              onAction={() => navigate('/create/image/text')}
            />
          ) : (
            <div className="space-y-3">
              {recentGenerations.slice(0, 4).map((job) => (
                <div
                  key={job.id}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {job.outputMetadata?.assetUrl ? (
                      <img
                        src={job.outputMetadata.assetUrl}
                        alt="Asset"
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {job.inputMetadata?.prompt || t('dashboardMediaJob')}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                        <Badge
                          variant={
                            job.status === 'COMPLETED' ? 'success' :
                            job.status === 'FAILED' ? 'error' : 'neutral'
                          }
                          size="sm"
                        >
                          {job.status}
                        </Badge>
                        <span>•</span>
                        <span>{job.tool}</span>
                        <span>•</span>
                        <span>{formatDate(job.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {job.outputMetadata?.assetUrl && (
                    <a
                      href={job.outputMetadata.assetUrl}
                      download={`firstmind-${job.id}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
                      title={t('btnDownload')}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payment Transactions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t('dashboardPaymentActivity')}
            </h3>
            <button
              onClick={() => navigate('/billing')}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {t('dashboardBillingCenter')}
            </button>
          </div>

          {recentPayments.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="w-5 h-5" />}
              title={t('emptyPaymentsTitle')}
              description={t('emptyPaymentsDesc')}
              actionLabel={t('dashboardExplorePlans')}
              onAction={() => navigate('/billing')}
            />
          ) : (
            <div className="space-y-3">
              {recentPayments.slice(0, 4).map((pay) => (
                <div
                  key={pay.id}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatPrice(pay.amount)}
                      </span>
                      <Badge
                        variant={
                          pay.status === 'SUCCESS' ? 'success' :
                          pay.status === 'FAILED' ? 'error' : 'neutral'
                        }
                        size="sm"
                      >
                        {pay.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                      <span className="font-mono">{pay.transactionReference}</span>
                      <span>•</span>
                      <span>{pay.provider}</span>
                      <span>•</span>
                      <span>{formatDate(pay.createdAt)}</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/billing')}
                  >
                    {t('dashboardDetails')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
