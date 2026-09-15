import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Sparkles, AlertCircle, ArrowRight, FlaskConical, Globe } from 'lucide-react';

interface LoginViewProps {
  navigate: (path: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ navigate }) => {
  const { login, enterDevTest } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDevModeAvailable, setIsDevModeAvailable] = useState(false);

  useEffect(() => {
    api.getConfig().then(cfg => {
      if (cfg.devAiTestMode) {
        setIsDevModeAvailable(true);
      }
    }).catch(() => {});
  }, []);

  const handleDevTestLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await enterDevTest();
      navigate('/app/studio');
    } catch (err: any) {
      setError(err.message || 'Failed to enter development AI test mode.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('fillAllFields', 'Please fill in both email and password.'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || t('signInError', 'Failed to sign in. Please verify your credentials.'));
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
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{t('signInTitle', 'Sign in to FIRSTMIND')}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('signInDesc', 'Enter your credentials to access your creative studio and assets')}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isDevModeAvailable && (
          <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 space-y-2">
            <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
              <FlaskConical className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-xs font-semibold">{t('devTestModeTitle', 'Development AI Test Mode')}</span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t('devTestModeDesc', 'Enables immediate testing of the Gemini Image & Chat providers without requiring a subscription. Generations are not billed.')}
            </p>
            <button
              type="button"
              onClick={handleDevTestLogin}
              disabled={isLoading}
              className="w-full mt-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 cursor-pointer transition shadow-sm"
            >
              <span>{t('devTestModeBtn', 'AI Test Mode — Development')}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t('emailLabel', 'Email Address')}
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {t('passwordLabel', 'Password')}
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
              >
                {t('forgotPassword', 'Forgot password?')}
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 px-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full mt-2"
          >
            {t('navLogin', 'Sign In')}
          </Button>
        </form>

        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
          <p className="text-[11px] text-zinc-400 font-mono text-center">
            {language === 'fa' ? 'اکانت‌های تستی سریع:' : 'Quick Fill Credentials:'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@firstmind.ai');
                setPassword('FirstMind2026!Admin');
              }}
              className="py-1.5 px-2 rounded text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 cursor-pointer text-center"
            >
              {language === 'fa' ? 'حساب مدیر (Admin)' : 'Admin Account'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('alex@example.com');
                setPassword('Password123!');
              }}
              className="py-1.5 px-2 rounded text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 cursor-pointer text-center"
            >
              {language === 'fa' ? 'حساب طراح (Creator)' : 'Creator Account'}
            </button>
          </div>
        </div>

        <div className="pt-2 text-center text-xs text-zinc-500">
          <span>{t('dontHaveAccount', "Don't have an account?")} </span>
          <button
            onClick={() => navigate('/register')}
            className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer"
          >
            {t('navRegister', 'Create account')}
          </button>
        </div>
      </Card>
    </div>
  );
};
