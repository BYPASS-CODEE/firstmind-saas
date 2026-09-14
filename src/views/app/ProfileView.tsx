import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { User as UserIcon, Lock, Shield, Check, AlertCircle } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { language, setLanguage, formatDate, t } = useLanguage();

  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      await api.updateProfile({ name, timezone, language });
      await refreshUser();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || t('fillAllFields'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      await api.updatePassword({ currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
           {t('profileTitle')}
         </h1>
         <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
           {t('profileDesc')}
         </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Details Form */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('profilePersonalInfo')}</h3>
          </div>

          {profileSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{t('profileUpdatedSuccess')}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">{t('profileEmailLabel')}</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">{t('profileEmailNote')}</span>
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">{t('profileFullName')}</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">{t('profileTimezone')}</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full h-9 px-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 cursor-pointer"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="Asia/Tehran">Asia/Tehran (GMT+3:30)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Europe/Paris">Europe/Paris (CET)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">{t('profileLanguage')}</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full h-9 px-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 cursor-pointer"
              >
                <option value="en">English (US)</option>
                <option value="fa">فارسی (Persian / RTL)</option>
              </select>
            </div>

            <Button type="submit" variant="primary" size="sm" isLoading={isSavingProfile} className="w-full">
              {t('profileSavePreferences')}
            </Button>
          </form>
        </Card>

        {/* Change Password Form */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('profileSecurityPassword')}</h3>
          </div>

          {passwordSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{t('profilePasswordSuccess')}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">{t('profileCurrentPassword')}</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">{t('profileNewPassword')}</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">{t('profileConfirmPassword')}</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <Button type="submit" variant="secondary" size="sm" isLoading={isSavingPassword} className="w-full">
              {t('profileUpdatePassword')}
            </Button>
          </form>
        </Card>
      </div>

      {/* Security Credentials Card */}
      <Card className="p-6 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t('profileSecurityTitle')}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-zinc-600 dark:text-zinc-400">
          <div>
            <span className="block text-[11px] text-zinc-400">{t('profileAuthScheme')}</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{t('profileAuthValue')}</span>
          </div>
          <div>
            <span className="block text-[11px] text-zinc-400">{t('profileTenantIsolation')}</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{t('profileTenantValue')}</span>
          </div>
          <div>
            <span className="block text-[11px] text-zinc-400">{t('profileAccountCreated')}</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatDate(user?.createdAt || '')}</span>
          </div>
        </div>
      </Card>

    </div>
  );
};
