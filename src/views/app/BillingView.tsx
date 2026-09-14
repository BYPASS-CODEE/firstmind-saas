import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Check, 
  Zap, 
  ShieldCheck, 
  FileText, 
  Download, 
  AlertCircle, 
  RefreshCw,
  QrCode,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { SubscriptionPlan, PaymentRecord } from '../../types';

interface BillingViewProps {
  navigate: (path: string) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({ navigate }) => {
  const { user, subscription, refreshUser } = useAuth();
  const { t, formatPrice, formatDate, language } = useLanguage();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Checkout modal state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'IRANIAN_GATEWAY' | 'CRYPTO' | 'STRIPE_TEST'>('IRANIAN_GATEWAY');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'SELECT' | 'GATEWAY' | 'SUCCESS' | 'ERROR'>('SELECT');
  const [activePaymentRecord, setActivePaymentRecord] = useState<any>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Invoice view modal
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentRecord | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    setIsLoading(true);
    try {
      const [plansData, billingData] = await Promise.all([
        api.getPlans(),
        api.getBillingData()
      ]);
      setPlans(plansData);
      setPayments(billingData.payments || []);
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startCheckout = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setPaymentStep('SELECT');
    setCheckoutError(null);
    setCheckoutModalOpen(true);
  };

  const handleInitiatePayment = async () => {
    if (!selectedPlan) return;
    setIsProcessingPayment(true);
    setCheckoutError(null);

    try {
      const res = await api.createPayment({
        planId: selectedPlan.id,
        provider: selectedProvider,
        idempotencyKey: `FM-IDEMP-${Date.now()}`
      });

      setActivePaymentRecord(res.payment);
      setPaymentStep('GATEWAY');
    } catch (err: any) {
      setCheckoutError(err.message || t('billingPaymentFailed'));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!activePaymentRecord) return;
    setIsProcessingPayment(true);
    setCheckoutError(null);

    try {
      await api.verifyPayment({
        paymentId: activePaymentRecord.id,
        providerTransactionId: `TXN-PROV-${Date.now()}`
      });

      setPaymentStep('SUCCESS');
      await refreshUser();
      await loadBillingData();
    } catch (err: any) {
      setCheckoutError(err.message || t('billingVerifyFailed'));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm(t('billingCancelConfirm'))) return;
    try {
      await api.cancelSubscription();
      await refreshUser();
    } catch (err: any) {
      alert(err.message || t('billingCancelFailed'));
    }
  };

  const remainingCredits = subscription ? Math.max(0, subscription.creditsTotal - subscription.creditsUsed) : 0;
  const usagePercent = subscription && subscription.creditsTotal > 0
    ? Math.min(100, Math.round((subscription.creditsUsed / subscription.creditsTotal) * 100))
    : 0;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {t('billingTitle')}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {t('billingDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBillingData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {t('billingRefresh')}
          </Button>
        </div>
      </div>

      {/* Current Subscription Status Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t('billingCurrentPlan')}</span>
              <Badge variant={subscription ? 'success' : 'neutral'} size="sm">
                {subscription ? subscription.status : t('billingFreeTier')}
              </Badge>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {subscription ? subscription.planName : t('billingNoSubscription')}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {subscription?.currentPeriodEnd
                ? `${t('billingRenewsOn')} ${formatDate(subscription.currentPeriodEnd)}`
                : t('billingSubscribePrompt')}
            </p>
          </div>

          {/* Usage credits meter */}
          <div className="w-full md:w-80 space-y-2 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">{t('billingCreditsRemaining')}</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {remainingCredits} / {subscription?.creditsTotal || 0}
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${100 - usagePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
              <span>{subscription?.creditsUsed || 0} {t('billingUsed')}</span>
              <span>{100 - usagePercent}% {t('billingAvailable')}</span>
            </div>
          </div>
        </div>

        {subscription && (
          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelSubscription}
              className="text-xs text-rose-600 dark:text-rose-400"
            >
              {t('billingCancelAutoRenew')}
            </Button>
          </div>
        )}
      </Card>

      {/* Available Plans Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {t('billingActivePlan')} {t('billingPlan')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = subscription?.planName === plan.name && subscription?.status === 'ACTIVE';
            return (
              <Card
                key={plan.id}
                className={`p-6 flex flex-col justify-between ${
                  isCurrent ? 'border-emerald-500 ring-1 ring-emerald-500' : ''
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={plan.tier === 'PRO' ? 'info' : plan.tier === 'ELITE' ? 'warning' : 'neutral'} size="sm">
                      {plan.tier}
                    </Badge>
                    {isCurrent && (
                      <span className="text-xs text-emerald-600 font-semibold">{t('billingActivePlan')}</span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{plan.name}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{plan.description}</p>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        {formatPrice(plan.priceMonthly)}
                      </span>
                      <span className="text-xs text-zinc-500">{t('billingPerMonth')}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {plan.creditLimit} {t('billingMonthlyCredits')}
                    </div>
                    <ul className="space-y-1.5">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <Button
                    variant={isCurrent ? 'secondary' : 'primary'}
                    size="md"
                    disabled={isCurrent}
                    onClick={() => startCheckout(plan)}
                    className="w-full"
                  >
                    {isCurrent ? t('billingCurrentTier') : t('billingSelectPlanCheckout')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Payment & Invoice Ledger Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {t('billingPaymentTitle')}
        </h3>

        {payments.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-6 h-6" />}
            title={t('emptyPaymentsTitle', 'No payment history yet.')}
            description={t('emptyPaymentsDesc', 'Your verified invoices, receipts, and subscription transactions will appear here.')}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t('billingTransactionId')}</th>
                  <th className="py-3 px-4">{t('billingPlan')}</th>
                  <th className="py-3 px-4">{t('billingAmount')}</th>
                  <th className="py-3 px-4">{t('billingProvider')}</th>
                  <th className="py-3 px-4">{t('billingStatus')}</th>
                  <th className="py-3 px-4">{t('billingDate')}</th>
                  <th className="py-3 px-4 text-right">{t('billingInvoice')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="py-3 px-4 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      {p.transactionReference}
                    </td>
                    <td className="py-3 px-4">                      {p.planName || t('billingPlanSubscription')}</td>
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatPrice(p.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px]">{p.provider}</span>
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
                    <td className="py-3 px-4 text-right">
                      {p.status === 'SUCCESS' && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(p);
                            setInvoiceModalOpen(true);
                          }}
                          className="text-zinc-900 dark:text-zinc-100 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{t('billingViewInvoice')}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Checkout Modal with Multi-Provider Support */}
      {checkoutModalOpen && selectedPlan && (
        <Modal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          maxWidth="md"
          title={`${t('billingCheckoutTitle')} ${selectedPlan.name}`}
          description={t('billingCheckoutDesc')}
        >
          <div className="space-y-6">
            {paymentStep === 'SELECT' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedPlan.name}</p>
                    <p className="text-zinc-400">{selectedPlan.creditLimit} {t('billingMonthlyCredits')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">{formatPrice(selectedPlan.priceMonthly)}</p>
                    <p className="text-[10px] text-zinc-400">{t('billingMonthlyAutoRenew')}</p>
                  </div>
                </div>

                {/* Gateway Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {t('billingPaymentProvider')}
                  </label>

                  {/* Iranian Gateway Option */}
                  <div
                    onClick={() => setSelectedProvider('IRANIAN_GATEWAY')}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      selectedProvider === 'IRANIAN_GATEWAY'
                        ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/80'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">درگاه شتاب و شاپرک (Iranian Gateway)</p>
                        <p className="text-[11px] text-zinc-500">Shetab Cards, ZarinPal, IDPay, Pasargad</p>
                      </div>
                    </div>
                    {selectedProvider === 'IRANIAN_GATEWAY' && <Check className="w-4 h-4 text-emerald-500" />}
                  </div>

                  {/* Crypto Gateway Option */}
                  <div
                    onClick={() => setSelectedProvider('CRYPTO')}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      selectedProvider === 'CRYPTO'
                        ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/80'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-300">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Cryptocurrency Payment</p>
                        <p className="text-[11px] text-zinc-500">USDT (TRC20), BTC, ETH on-chain settlement</p>
                      </div>
                    </div>
                    {selectedProvider === 'CRYPTO' && <Check className="w-4 h-4 text-emerald-500" />}
                  </div>

                  {/* International Card Option */}
                  <div
                    onClick={() => setSelectedProvider('STRIPE_TEST')}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      selectedProvider === 'STRIPE_TEST'
                        ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/80'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-700 dark:text-sky-300">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">International Credit Card</p>
                        <p className="text-[11px] text-zinc-500">Visa, Mastercard, Amex</p>
                      </div>
                    </div>
                    {selectedProvider === 'STRIPE_TEST' && <Check className="w-4 h-4 text-emerald-500" />}
                  </div>
                </div>

                {checkoutError && (
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-700 dark:text-rose-400">
                    {checkoutError}
                  </div>
                )}

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleInitiatePayment}
                  isLoading={isProcessingPayment}
                  className="w-full"
                >
                    {t('billingProceedToPayment')}
                </Button>
              </div>
            )}

            {paymentStep === 'GATEWAY' && activePaymentRecord && (
              <div className="space-y-4 text-center">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">{t('billingTransactionRef')}</span>
                    <span className="font-mono font-semibold">{activePaymentRecord.transactionReference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">{t('billingAmountDue')}</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatPrice(activePaymentRecord.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">{t('billingGateway')}</span>
                    <span>{activePaymentRecord.provider}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 space-y-2">
                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    {t('billingSimulating')}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {t('billingSimulatingDesc')}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setCheckoutModalOpen(false)}
                    className="flex-1"
                  >
                    {t('billingCancel')}
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleVerifyPayment}
                    isLoading={isProcessingPayment}
                    className="flex-1"
                  >
                    {t('billingConfirmVerify')}
                  </Button>
                </div>
              </div>
            )}

            {paymentStep === 'SUCCESS' && (
              <div className="text-center space-y-4 py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {t('billingPaymentSuccess')}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Your {selectedPlan.name} {t('billingQuotaAvailable')} {selectedPlan.creditLimit} {t('billingCreditsNowAvailable')}
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setCheckoutModalOpen(false);
                    navigate('/create/image/text');
                  }}
                  className="w-full"
                >
                    {t('billingStartCreating')}
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Invoice Detail Modal */}
      {invoiceModalOpen && selectedInvoice && (
        <Modal
          isOpen={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
          maxWidth="md"
          title={t('billingTaxInvoice')}
          description={`Reference: ${selectedInvoice.transactionReference}`}
        >
          <div className="space-y-4 border rounded-xl p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs">
            <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{t('billingFirstMind')}</h4>
                <p className="text-zinc-400 text-[11px]">{t('billingInvoiceNumber')}{selectedInvoice.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <Badge variant="success" size="sm">PAID</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-zinc-600 dark:text-zinc-400 pt-1">
              <div>
                <span className="text-[10px] uppercase text-zinc-400 block">{t('billingBilledTo')}</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{user?.name}</span>
                <span className="block text-[11px] text-zinc-500">{user?.email}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-zinc-400 block">{t('billingIssueDate')}</span>
                <span>{formatDate(selectedInvoice.createdAt)}</span>
              </div>
            </div>

            <div className="border-t border-b border-zinc-100 dark:border-zinc-800 py-3 space-y-1">
              <div className="flex justify-between font-semibold text-zinc-800 dark:text-zinc-200">
                <span>{t('billingDescription')}</span>
                <span>{t('billingAmount')}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>{selectedInvoice.planName || t('billingStudioSubscription')} ({language === 'fa' ? 'ماهانه' : 'Monthly'})</span>
                <span>{formatPrice(selectedInvoice.amount)}</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline font-bold text-sm text-zinc-900 dark:text-zinc-100 pt-1">
              <span>{t('billingTotalPaid')}</span>
              <span>{formatPrice(selectedInvoice.amount)}</span>
            </div>

            <div className="pt-2 text-[10px] text-zinc-400 text-center">
              {t('billingReceiptNote')}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                {t('billingPrintSave')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
