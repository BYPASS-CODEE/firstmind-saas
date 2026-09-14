import React from 'react';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Wand2, 
  Layers, 
  Sparkles, 
  Palette, 
  Video, 
  Film, 
  Clock, 
  CreditCard, 
  Share2, 
  Bell, 
  Sliders, 
  ShieldCheck,
  Zap,
  Bot
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Badge } from '../common/Badge';

interface SidebarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, navigate }) => {
  const { user, subscription } = useAuth();
  const { t, language } = useLanguage();

  if (!user) return null;

  const remainingCredits = subscription ? Math.max(0, subscription.creditsTotal - subscription.creditsUsed) : 0;
  const usagePercent = subscription && subscription.creditsTotal > 0
    ? Math.min(100, Math.round((subscription.creditsUsed / subscription.creditsTotal) * 100))
    : 0;

  const imageTools = [
    { key: 'text', name: t('toolTextToImage', 'Text to Image'), path: '/create/image/text', icon: Wand2 },
    { key: 'image', name: t('toolImageToImage', 'Image to Image'), path: '/create/image/image', icon: ImageIcon },
    { key: 'variation', name: t('toolVariation', 'Variation'), path: '/create/image/variation', icon: Layers },
    { key: 'enhance', name: t('toolEnhance', 'Enhance & Upscale'), path: '/create/image/enhance', icon: Sparkles },
    { key: 'style', name: t('toolStyleTransfer', 'Style Transfer'), path: '/create/image/style', icon: Palette }
  ];

  const videoTools = [
    { key: 'video_text', name: t('toolTextToVideo', 'Text to Video'), path: '/create/video/text', icon: Video },
    { key: 'video_image', name: t('toolImageToVideo', 'Image to Video'), path: '/create/video/image', icon: Film }
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 min-h-[calc(100vh-4rem)] p-4 select-none">
      
      {/* Credit & Plan Summary Box */}
      <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{t('sidebarSubscription')}</span>
          <Badge variant={subscription ? 'success' : 'neutral'} size="sm">
            {subscription ? subscription.planName : t('sidebarNoActivePlan')}
          </Badge>
        </div>

        {subscription ? (
          <div>
            <div className="flex items-baseline justify-between text-xs mb-1.5">
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{remainingCredits}</span>
              <span className="text-zinc-500 dark:text-zinc-400">/ {subscription.creditsTotal} {t('sidebarCredits')}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${100 - usagePercent}%` }}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate('/billing')}
            className="w-full mt-2 py-1.5 px-2.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{t('sidebarSelectPlan')}</span>
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="space-y-6 flex-1">
        
        {/* Core items */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-3">
            {t('navDashboard', 'Dashboard')}
          </span>
          <div className="mt-1 space-y-1">
            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                currentPath === '/dashboard'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>{t('navDashboard', 'Dashboard')}</span>
            </button>
            <button
              onClick={() => navigate('/history')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                currentPath === '/history'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{t('navHistory', 'History')}</span>
            </button>
            <button
              onClick={() => navigate('/app/chat')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                currentPath === '/app/chat' || currentPath === '/chat'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Bot className="w-4 h-4 shrink-0 text-indigo-500" />
              <span className="flex-1 text-start">{t('firstMindChat', 'FirstMind Chat')}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                AI
              </span>
            </button>
          </div>
        </div>

        {/* AI Image Tools */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-3">
            {t('navStudioHeading', 'AI Image Studio')}
          </span>
          <div className="mt-1 space-y-1">
            {imageTools.map((tool) => {
              const Icon = tool.icon;
              const isActive = currentPath === tool.path;
              return (
                <button
                  key={tool.key}
                  onClick={() => navigate(tool.path)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tool.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Video Tools */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-3">
            {t('navVideoHeading', 'AI Video Studio')}
          </span>
          <div className="mt-1 space-y-1">
            {videoTools.map((tool) => {
              const Icon = tool.icon;
              const isActive = currentPath === tool.path;
              return (
                <button
                  key={tool.key}
                  onClick={() => navigate(tool.path)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tool.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Account & Billing */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-3">
            {t('navFinanceHeading', 'Finance & Account')}
          </span>
          <div className="mt-1 space-y-1">
            <button
              onClick={() => navigate('/billing')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                currentPath === '/billing'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>{t('navBilling', 'Billing & Plans')}</span>
            </button>
            <button
              onClick={() => navigate('/referrals')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                currentPath === '/referrals'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Share2 className="w-4 h-4 shrink-0" />
                <span>{t('navReferrals', 'Referrals')}</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {t('sidebarReferral')}
              </span>
            </button>
            <button
              onClick={() => navigate('/notifications')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                currentPath === '/notifications'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span>{t('navNotifications', 'Notifications')}</span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                currentPath === '/profile'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>{t('navProfile', 'Settings')}</span>
            </button>
          </div>
        </div>

        {/* Admin Suite Section */}
        {user.role === 'ADMIN' && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => navigate('/admin')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                currentPath.startsWith('/admin')
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{t('navAdmin', 'Admin Suite')}</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
