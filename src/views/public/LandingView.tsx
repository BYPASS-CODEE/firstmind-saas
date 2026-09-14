import React from 'react';
import { 
  Wand2, 
  Video, 
  Zap, 
  Shield, 
  Layers, 
  Cpu, 
  ArrowRight, 
  Check, 
  Sparkles,
  FileCheck2,
  RefreshCw,
  Share2
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

interface LandingViewProps {
  navigate: (path: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ navigate }) => {
  const { t, formatPrice } = useLanguage();
  const { user } = useAuth();

  const handleStart = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const capabilities = [
    {
      icon: Wand2,
      titleKey: 'cap1Title',
      descKey: 'cap1Desc'
    },
    {
      icon: Layers,
      titleKey: 'cap2Title',
      descKey: 'cap2Desc'
    },
    {
      icon: RefreshCw,
      titleKey: 'cap3Title',
      descKey: 'cap3Desc'
    },
    {
      icon: Video,
      titleKey: 'cap4Title',
      descKey: 'cap4Desc'
    },
    {
      icon: Cpu,
      titleKey: 'cap5Title',
      descKey: 'cap5Desc'
    },
    {
      icon: Share2,
      titleKey: 'cap6Title',
      descKey: 'cap6Desc'
    }
  ];

  const workflowSteps = [
    {
      step: '01',
      titleKey: 'step1Title',
      descKey: 'step1Desc'
    },
    {
      step: '02',
      titleKey: 'step2Title',
      descKey: 'step2Desc'
    },
    {
      step: '03',
      titleKey: 'step3Title',
      descKey: 'step3Desc'
    },
    {
      step: '04',
      titleKey: 'step4Title',
      descKey: 'step4Desc'
    }
  ];

  return (
    <div className="space-y-24 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-8 sm:pt-16 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-400">
          <Sparkles className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
          <span>{t('landingBadge')}</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.15]">
          {t('landingTitle')}
        </h1>

        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
          {t('landingDesc')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button
            size="lg"
            variant="primary"
            onClick={handleStart}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            {user ? t('landingCtaAuth') : t('landingCta')}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/pricing')}
            className="w-full sm:w-auto"
          >
            {t('landingCtaSecondary')}
          </Button>
        </div>

        <div className="pt-6 flex items-center justify-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>{t('trustDataIsolation')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>{t('trustNoFakeData')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-sky-500" />
            <span>{t('trustVerifiedBilling')}</span>
          </div>
        </div>
      </section>

      {/* Hero Image Gallery */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            {t('galleryTitle')}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t('galleryDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
            <div className="aspect-[4/3] bg-gradient-to-br from-violet-900 via-purple-800 to-fuchsia-700 flex items-center justify-center">
              <Wand2 className="w-12 h-12 text-white/40" />
            </div>
            <div className="p-4 space-y-1">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('galleryImg1Title')}</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('galleryImg1Desc')}</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{t('galleryCreatedBy')} AI Studio</p>
            </div>
          </div>

          <div className="group relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
            <div className="aspect-[4/3] bg-gradient-to-br from-rose-700 via-pink-600 to-amber-500 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-white/40" />
            </div>
            <div className="p-4 space-y-1">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('galleryImg2Title')}</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('galleryImg2Desc')}</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{t('galleryCreatedBy')} AI Studio</p>
            </div>
          </div>

          <div className="group relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
            <div className="aspect-[4/3] bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-500 flex items-center justify-center">
              <Layers className="w-12 h-12 text-white/40" />
            </div>
            <div className="p-4 space-y-1">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('galleryImg3Title')}</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('galleryImg3Desc')}</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{t('galleryCreatedBy')} AI Studio</p>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            {t('capabilitiesTitle')}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t('capabilitiesDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} className="p-6 space-y-3" hoverEffect>
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {t(item.titleKey)}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {t(item.descKey)}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Real SaaS Workflow */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            {t('workflowTitle')}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t('workflowDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((step) => (
            <div key={step.step} className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-2">
              <span className="font-mono text-xs font-bold text-zinc-400 dark:text-zinc-500">
                {step.step}
              </span>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t(step.titleKey)}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {t(step.descKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Subscription Tier Preview */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            {t('pricingTitle')}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t('pricingDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Starter */}
          <Card className="p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <Badge variant="neutral" size="sm">{t('starterPlan')}</Badge>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                  {formatPrice(10)} <span className="text-xs font-normal text-zinc-500">{t('perMonth')}</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {t('starterDesc')}
                </p>
              </div>
              <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t('starterFeature1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t('starterFeature2')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t('starterFeature3')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t('starterFeature4')}</span>
                </li>
              </ul>
            </div>
            <Button variant="outline" onClick={() => navigate('/billing')} className="w-full">
              {t('getStarted')}
            </Button>
          </Card>

          {/* Pro */}
          <Card className="p-6 space-y-6 flex flex-col justify-between border-zinc-900 dark:border-zinc-100 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                {t('recommended')}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <Badge variant="info" size="sm">{t('proPlan')}</Badge>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                  {formatPrice(50)} <span className="text-xs font-normal text-zinc-500">{t('perMonth')}</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {t('proDesc')}
                </p>
              </div>
              <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t('proFeature1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t('proFeature2')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t('proFeature3')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t('proFeature4')}</span>
                </li>
              </ul>
            </div>
            <Button variant="primary" onClick={() => navigate('/billing')} className="w-full">
              {t('selectProPlan')}
            </Button>
          </Card>

          {/* Elite */}
          <Card className="p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <Badge variant="warning" size="sm">{t('elitePlan')}</Badge>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                  {formatPrice(99)} <span className="text-xs font-normal text-zinc-500">{t('perMonth')}</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {t('eliteDesc')}
                </p>
              </div>
              <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t('eliteFeature1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t('eliteFeature2')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t('eliteFeature3')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t('eliteFeature4')}</span>
                </li>
              </ul>
            </div>
            <Button variant="outline" onClick={() => navigate('/billing')} className="w-full">
              {t('selectElitePlan')}
            </Button>
          </Card>
        </div>
      </section>

      {/* Referral Banner */}
      <section className="p-8 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <Badge variant="success" size="sm">{t('referralBannerBadge')}</Badge>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {t('referralBannerTitle')}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {t('referralBannerDesc')}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate('/referrals')}
          className="shrink-0"
        >
          {t('viewReferralProgram')}
        </Button>
      </section>

    </div>
  );
};
