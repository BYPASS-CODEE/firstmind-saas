import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { ShieldCheck, Mail } from 'lucide-react';

export const AboutView: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-3">
        <Badge variant="neutral" size="sm">{t('aboutBadge')}</Badge>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{t('aboutTitle')}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {t('aboutDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-2">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{t('aboutLedgerTitle')}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {t('aboutLedgerDesc')}
          </p>
        </Card>
        <Card className="p-6 space-y-2">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{t('aboutZeroLeakTitle')}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {t('aboutZeroLeakDesc')}
          </p>
        </Card>
      </div>
    </div>
  );
};

export const ContactView: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-3">
        <Badge variant="neutral" size="sm">{t('contactBadge')}</Badge>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{t('contactTitle')}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t('contactDesc')}
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('contactEnterpriseTitle')}</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('contactEmail')}</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <p><strong>{t('contactResponseTime')}</strong> {t('contactResponseTimeDesc')}</p>
          <p><strong>{t('contactSystemStatus')}</strong> {t('contactSystemStatusDesc')}</p>
        </div>
      </Card>
    </div>
  );
};

export const TermsView: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{t('termsTitle')}</h1>
      <p className="text-xs text-zinc-400">{t('termsUpdated')}</p>

      <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
        <p>1. <strong>{t('terms1Title')}</strong> {t('terms1Desc')}</p>
        <p>2. <strong>{t('terms2Title')}</strong> {t('terms2Desc')}</p>
        <p>3. <strong>{t('terms3Title')}</strong> {t('terms3Desc')}</p>
        <p>4. <strong>{t('terms4Title')}</strong> {t('terms4Desc')}</p>
      </div>
    </div>
  );
};

export const PrivacyView: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{t('privacyTitle')}</h1>
      <p className="text-xs text-zinc-400">{t('privacyUpdated')}</p>

      <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
        <p>1. <strong>{t('privacy1Title')}</strong> {t('privacy1Desc')}</p>
        <p>2. <strong>{t('privacy2Title')}</strong> {t('privacy2Desc')}</p>
        <p>3. <strong>{t('privacy3Title')}</strong> {t('privacy3Desc')}</p>
      </div>
    </div>
  );
};

export const RefundPolicyView: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{t('refundTitle')}</h1>
      <p className="text-xs text-zinc-400">{t('refundUpdated')}</p>

      <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
        <p>1. <strong>{t('refund1Title')}</strong> {t('refund1Desc')}</p>
        <p>2. <strong>{t('refund2Title')}</strong> {t('refund2Desc')}</p>
      </div>
    </div>
  );
};

export const RefundView = RefundPolicyView;
