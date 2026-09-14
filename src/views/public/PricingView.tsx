import React, { useState, useEffect } from 'react';
import { Check, Zap, Shield, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { SubscriptionPlan } from '../../types';

interface PricingViewProps {
  navigate: (path: string) => void;
}

export const PricingView: React.FC<PricingViewProps> = ({ navigate }) => {
  const { formatPrice, t, language } = useLanguage();
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getPlans()
      .then(res => setPlans(res))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      navigate('/register');
    } else {
      navigate(`/billing?selectPlan=${planId}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Badge variant="neutral" size="md">{t('pricingBadge')}</Badge>
        <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100">
          {t('pricingPageTitle')}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t('pricingPageDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isPro = plan.tier === 'PRO';
          return (
            <Card
              key={plan.id}
              className={`p-6 flex flex-col justify-between relative ${
                isPro ? 'border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900 dark:ring-zinc-100' : ''
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {t('recommended')}
                  </span>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{plan.name}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{plan.description}</p>
                  
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                      {formatPrice(plan.priceMonthly)}
                    </span>
                    <span className="text-xs text-zinc-500">{t('perMonth')}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">{t('monthlyCredits')}</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{plan.creditLimit} {t('creditsUnit')}</span>
                </div>

                <div className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 block">{t('featuresIncluded')}</span>
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{t('maxResolution')} <strong className="text-zinc-800 dark:text-zinc-200">{plan.maxQuality}</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{t('queuePriority')} <strong className="text-zinc-800 dark:text-zinc-200">{plan.processingPriority}</strong></span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  variant={isPro ? 'primary' : 'outline'}
                  onClick={() => handleSelectPlan(plan.id)}
                  className="w-full"
                >
                  {user ? t('selectPlanBtn') : t('getStarted')}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{t('strictUsageAccounting')}</h4>
            <p>{t('strictUsageAccountingDesc')}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{t('highThroughputGpus')}</h4>
            <p>{t('highThroughputGpusDesc')}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{t('commercialRights')}</h4>
            <p>{t('commercialRightsDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
