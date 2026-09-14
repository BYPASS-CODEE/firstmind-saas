import React from 'react';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        
        {/* Brand column */}
        <div className="md:col-span-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{t('brandName')}</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {t('brandTagline')}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t('footerAiOnline')}</span>
          </div>
        </div>

        {/* Product column */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">{t('footerProduct')}</h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <button onClick={() => navigate('/create/image/text')} className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer">
                {t('footerTextToImage')}
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/create/image/image')} className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer">
                {t('footerImageToImage')}
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/create/video/text')} className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer">
                {t('footerTextToVideo')}
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/pricing')} className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer">
                {t('footerSubscriptionPlans')}
              </button>
            </li>
          </ul>
        </div>

        {/* Platform column */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">{t('footerPlatform')}</h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <button onClick={() => navigate('/features')} className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer">
                {t('footerFeaturesOverview')}
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/about')} className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer">
                {t('footerAboutArchitecture')}
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/contact')} className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer">
                {t('footerContactSupport')}
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/referrals')} className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer">
                {t('footerReferralProgram')}
              </button>
            </li>
          </ul>
        </div>

        {/* Compliance & Legal */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">{t('footerLegal')}</h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <button onClick={() => navigate('/terms')} className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer">
                {t('footerTermsOfService')}
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/privacy')} className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer">
                {t('footerPrivacyPolicy')}
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/refund-policy')} className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer">
                {t('footerRefundPolicy')}
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
        <p>© {new Date().getFullYear()} {t('brandName')} {t('footerCopyright')}</p>
        <p className="font-mono text-[11px]">{t('footerDataIsolation')}</p>
      </div>
    </footer>
  );
};
