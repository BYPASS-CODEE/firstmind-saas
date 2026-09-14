import React, { useState } from 'react';
import { 
  Sparkles, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Globe, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  CreditCard, 
  Clock, 
  Share2, 
  Bell,
  Sliders
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, subscription, logout } = useAuth();
  const { language, setLanguage, currency, setCurrency, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setUserDropdownOpen(false);
  };

  const remainingCredits = subscription ? Math.max(0, subscription.creditsTotal - subscription.creditsUsed) : 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => handleNav(user ? '/dashboard' : '/')}
            className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 shadow-xs transition-transform group-hover:scale-105">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                FIRSTMIND
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">SaaS</span>
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {!user ? (
              <>
                <button
                  onClick={() => handleNav('/features')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                    currentPath === '/features'
                      ? 'text-zinc-900 dark:text-zinc-100 font-medium bg-zinc-100 dark:bg-zinc-800/60'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {t('navFeatures', 'Features')}
                </button>
                <button
                  onClick={() => handleNav('/pricing')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                    currentPath === '/pricing'
                      ? 'text-zinc-900 dark:text-zinc-100 font-medium bg-zinc-100 dark:bg-zinc-800/60'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {t('navPricing', 'Pricing')}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNav('/dashboard')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                    currentPath === '/dashboard'
                      ? 'text-zinc-900 dark:text-zinc-100 font-medium bg-zinc-100 dark:bg-zinc-800/60'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {t('navDashboard', 'Dashboard')}
                </button>
                <button
                  onClick={() => handleNav('/create/image/text')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                    currentPath.startsWith('/create')
                      ? 'text-zinc-900 dark:text-zinc-100 font-medium bg-zinc-100 dark:bg-zinc-800/60'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {t('navCreate', 'Create')}
                </button>
                <button
                  onClick={() => handleNav('/app/chat')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentPath.startsWith('/app/chat') || currentPath.startsWith('/chat')
                      ? 'text-zinc-900 dark:text-zinc-100 font-medium bg-zinc-100 dark:bg-zinc-800/60'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <span>{t('navChat')}</span>
                </button>
                <button
                  onClick={() => handleNav('/history')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                    currentPath === '/history'
                      ? 'text-zinc-900 dark:text-zinc-100 font-medium bg-zinc-100 dark:bg-zinc-800/60'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {t('navHistory', 'History')}
                </button>
                <button
                  onClick={() => handleNav('/billing')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                    currentPath === '/billing'
                      ? 'text-zinc-900 dark:text-zinc-100 font-medium bg-zinc-100 dark:bg-zinc-800/60'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {t('navBilling', 'Billing')}
                </button>
                <button
                  onClick={() => handleNav('/referrals')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                    currentPath === '/referrals'
                      ? 'text-zinc-900 dark:text-zinc-100 font-medium bg-zinc-100 dark:bg-zinc-800/60'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {t('navReferrals', 'Referrals')}
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          
          {/* User Credit Badge when authenticated */}
          {user && subscription && (
            <div 
              onClick={() => handleNav('/billing')}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{remainingCredits} {t('creditsCost', 'Credits')}</span>
            </div>
          )}

          {/* Admin Suite quick link */}
          {user && user.role === 'ADMIN' && (
            <button
              onClick={() => handleNav('/admin')}
              className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                currentPath.startsWith('/admin')
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('navAdmin', 'Admin Suite')}</span>
            </button>
          )}

          {/* Currency Switcher */}
          <div className="relative hidden sm:block">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="h-8 pl-2 pr-6 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer appearance-none"
              aria-label="Currency"
            >
              <option value="USD" className="dark:bg-zinc-900">USD ($)</option>
              <option value="IRR" className="dark:bg-zinc-900">IRR (ریال)</option>
              <option value="EUR" className="dark:bg-zinc-900">EUR (€)</option>
            </select>
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => {
              const nextLang = language === 'en' ? 'fa' : 'en';
              setLanguage(nextLang);
              if (nextLang === 'fa' && currency === 'USD') setCurrency('IRR');
              if (nextLang === 'en' && currency === 'IRR') setCurrency('USD');
            }}
            className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium shadow-2xs"
            title={language === 'en' ? 'تغییر به زبان فارسی' : 'Switch to English'}
            aria-label="Toggle language"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>{language === 'en' ? 'فارسی' : 'English'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile or Login/Register CTA */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
              >
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 max-w-[100px] truncate hidden sm:inline">
                  {user.name}
                </span>
                <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center text-xs font-semibold uppercase">
                  {user.name.charAt(0)}
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">{user.name}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge variant={user.role === 'ADMIN' ? 'warning' : 'neutral'} size="sm">
                        {user.role}
                      </Badge>
                      {subscription && (
                        <Badge variant="success" size="sm">
                          {subscription.planName}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => handleNav('/dashboard')}
                      className="w-full text-left px-3.5 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t('navDashboard', 'Dashboard')}</span>
                    </button>
                    <button
                      onClick={() => handleNav('/billing')}
                      className="w-full text-left px-3.5 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{t('navBilling', 'Billing')}</span>
                    </button>
                    <button
                      onClick={() => handleNav('/history')}
                      className="w-full text-left px-3.5 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{t('navHistory', 'History')}</span>
                    </button>
                    <button
                      onClick={() => handleNav('/referrals')}
                      className="w-full text-left px-3.5 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{t('navReferrals', 'Referrals')}</span>
                    </button>
                    <button
                      onClick={() => handleNav('/notifications')}
                      className="w-full text-left px-3.5 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>{t('navNotifications', 'Notifications')}</span>
                    </button>
                    <button
                      onClick={() => handleNav('/profile')}
                      className="w-full text-left px-3.5 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{t('navProfile', 'Settings')}</span>
                    </button>

                    {user.role === 'ADMIN' && (
                      <button
                        onClick={() => handleNav('/admin')}
                        className="w-full text-left px-3.5 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 font-medium"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{t('navAdmin', 'Admin Suite')}</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('navLogout', 'Sign Out')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNav('/login')}
              >
                {t('navLogin', 'Sign In')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleNav('/register')}
              >
                {t('navRegister', 'Get Started')}
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-4 space-y-2">
          {/* Quick Language & Currency in Mobile Drawer */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 text-xs">
            <button
              onClick={() => {
                const nextLang = language === 'en' ? 'fa' : 'en';
                setLanguage(nextLang);
                if (nextLang === 'fa' && currency === 'USD') setCurrency('IRR');
                if (nextLang === 'en' && currency === 'IRR') setCurrency('USD');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>{language === 'en' ? 'تغییر به فارسی' : 'Switch to English'}</span>
            </button>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="h-7 px-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent"
            >
              <option value="USD">USD ($)</option>
              <option value="IRR">IRR (ریال)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          {!user ? (
            <>
              <button
                onClick={() => handleNav('/features')}
                className="w-full text-start px-3 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {t('navFeatures', 'Features')}
              </button>
              <button
                onClick={() => handleNav('/pricing')}
                className="w-full text-start px-3 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {t('navPricing', 'Pricing')}
              </button>
              <div className="pt-2 flex flex-col gap-2">
                <Button variant="outline" onClick={() => handleNav('/login')} className="w-full">
                  {t('navLogin', 'Sign In')}
                </Button>
                <Button variant="primary" onClick={() => handleNav('/register')} className="w-full">
                  {t('navRegister', 'Get Started')}
                </Button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => handleNav('/dashboard')}
                className="w-full text-start px-3 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {t('navDashboard', 'Dashboard')}
              </button>
              <button
                onClick={() => handleNav('/create/image/text')}
                className="w-full text-start px-3 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {t('navCreate', 'Create AI Media')}
              </button>
              <button
                onClick={() => handleNav('/app/chat')}
                className="w-full text-start px-3 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-medium"
              >
                {t('firstMindChat')}
              </button>
              <button
                onClick={() => handleNav('/history')}
                className="w-full text-start px-3 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {t('navHistory', 'Generation History')}
              </button>
              <button
                onClick={() => handleNav('/billing')}
                className="w-full text-start px-3 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {t('navBilling', 'Billing & Plans')}
              </button>
              <button
                onClick={() => handleNav('/referrals')}
                className="w-full text-start px-3 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {t('navReferrals', 'Referral Earnings')}
              </button>
              <button
                onClick={() => handleNav('/profile')}
                className="w-full text-start px-3 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {t('navProfile', 'Settings')}
              </button>

              {user.role === 'ADMIN' && (
                <button
                  onClick={() => handleNav('/admin')}
                  className="w-full text-start px-3 py-2 text-sm rounded-md text-amber-600 dark:text-amber-400 font-medium hover:bg-amber-50 dark:hover:bg-amber-950/30"
                >
                  {t('navAdmin', 'Admin Suite')}
                </button>
              )}

              <div className="pt-2">
                <Button variant="danger" onClick={handleLogout} className="w-full">
                  {t('navLogout', 'Sign Out')}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
};
