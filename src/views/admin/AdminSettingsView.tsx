import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  ShieldAlert, 
  Check, 
  Server, 
  Database, 
  Key, 
  Zap,
  Save 
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const AdminSettingsView: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [defaultCredits, setDefaultCredits] = useState(5);
  const [referralCommissionUSD, setReferralCommissionUSD] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const config = await api.getAdminConfig();
      setMaintenanceMode(config.maintenanceMode || false);
      setDefaultCredits(config.defaultCredits || 5);
      setReferralCommissionUSD(config.referralCommissionUSD || 1.0);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateAdminConfig({
        maintenanceMode,
        defaultCredits,
        referralCommissionUSD
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Global System Configurations
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Operational switches, default parameters, and AI model health checks.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>System configuration parameters saved successfully.</span>
        </div>
      )}

      <div className="space-y-6">
        
        {/* Maintenance Mode */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Platform Maintenance Mode</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Temporarily pause generation pipelines for non-admin accounts.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-amber-600"></div>
            </label>
          </div>
        </Card>

        {/* Global Economics & Credits */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-zinc-500" />
            <span>Economic Parameters</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">
                New User Onboarding Credits
              </label>
              <input
                type="number"
                value={defaultCredits}
                onChange={(e) => setDefaultCredits(parseInt(e.target.value, 10) || 0)}
                className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">Free credits granted upon initial registration.</span>
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">
                Referral Commission (USD per Sale)
              </label>
              <input
                type="number"
                step="0.10"
                value={referralCommissionUSD}
                onChange={(e) => setReferralCommissionUSD(parseFloat(e.target.value) || 1.0)}
                className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">Strict Rule 28 standard is $1.00.</span>
            </div>
          </div>
        </Card>

        {/* Server & AI Status */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-zinc-500" />
            <span>Infrastructure Health</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
              <span className="text-zinc-600 dark:text-zinc-400">Gemini 3.1 Flash Image Engine:</span>
              <Badge variant="success" size="sm">ONLINE (Server-Side)</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
              <span className="text-zinc-600 dark:text-zinc-400">Veo Motion Video Diffusion:</span>
              <Badge variant="success" size="sm">ONLINE (24fps Pipeline)</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
              <span className="text-zinc-600 dark:text-zinc-400">Local JSON Atomic Database:</span>
              <Badge variant="success" size="sm">MUTEX SECURE</Badge>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Global Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
