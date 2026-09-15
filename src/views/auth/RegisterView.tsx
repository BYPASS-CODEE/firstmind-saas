import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Sparkles, AlertCircle, CheckCircle2, Globe } from 'lucide-react';

interface RegisterViewProps {
  navigate: (path: string) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ navigate }) => {
  const { register } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if referral code is in URL query parameters
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError(t('fillAllFields', 'Please fill in all required fields.'));
      return;
    }

    if (password.length < 8) {
      setError(t('passwordMinLength', 'Password must be at least 8 characters long.'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch', 'Passwords do not match.'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await register(name, email, password, referralCode ? referralCode.trim() : undefined);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || t('registerError', 'Failed to register account.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <Card className="max-w-md w-full p-5 sm:p-8 space-y-3 sm:space-y-6 relative my-auto">
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
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{t('signUpTitle', 'Create your FIRSTMIND Account')}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('signUpDesc', 'Join professional creators utilizing precision AI generative engines')}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t('fullNameLabel', 'Full Name')}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('fullNamePlaceholder', 'Alex Wright')}
              className="w-full h-9 sm:h-10 px-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t('emailLabel', 'Email Address')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@studio.com"
              className="w-full h-9 sm:h-10 px-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t('passwordLabel', 'Password')} ({language === 'fa' ? 'حداقل ۸ کاراکتر' : 'min 8 characters'})
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-9 sm:h-10 px-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t('confirmPasswordLabel', 'Confirm Password')}
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-9 sm:h-10 px-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
              <span>{t('referralCodeLabel', 'Referral Code (Optional)')}</span>
              {referralCode && <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-mono">{language === 'fa' ? 'ثبت شد' : 'Linked'}</span>}
            </label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="FM-XXXXXX"
              className="w-full h-9 sm:h-10 px-3 text-sm font-mono uppercase rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full mt-2"
          >
            {t('navRegister', 'Create Account')}
          </Button>
        </form>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500">
          <span>{t('alreadyHaveAccount', 'Already have an account?')} </span>
          <button
            onClick={() => navigate('/login')}
            className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer"
          >
            {t('navLogin', 'Sign In')}
          </button>
        </div>
      </Card>
    </div>
  );
};
