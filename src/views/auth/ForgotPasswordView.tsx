import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Sparkles, CheckCircle2, ArrowLeft, Globe } from 'lucide-react';

interface ForgotPasswordViewProps {
  navigate: (path: string) => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ navigate }) => {
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full p-8 space-y-6 relative">
        {/* Quick Language Toggle */}
        <div className="absolute top-4 end-4">
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'fa' : 'en')}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 cursor-pointer"
            title="Switch Language / تغییر زبان"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span>{language === 'en' ? 'فارسی' : 'English'}</span>
          </button>
        </div>

        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 mx-auto">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{t('forgotPasswordTitle')}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('forgotPasswordDesc')}
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('forgotPasswordSent')}</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t('forgotPasswordSentDesc')} <strong>{email}</strong> {t('forgotPasswordSentDesc2')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/login')}
              className="mt-2"
            >
              {t('forgotPasswordReturn')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                {t('emailLabel')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@studio.com"
                className="w-full h-10 px-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full">
              {t('forgotPasswordSendReset')}
            </Button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full text-center text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center justify-center gap-1.5 pt-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('forgotPasswordBack')}</span>
            </button>
          </form>
        )}
      </Card>
    </div>
  );
};
