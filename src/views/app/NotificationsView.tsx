import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Sparkles, 
  CreditCard, 
  Share2, 
  ShieldAlert, 
  Clock 
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { NotificationItem } from '../../types';

export const NotificationsView: React.FC = () => {
  const { t, formatDate, language } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const list = await api.getNotifications();
      setNotifications(list);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'GENERATION_COMPLETED':
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
      case 'GENERATION_FAILED':
        return <Clock className="w-4 h-4 text-rose-500" />;
      case 'PAYMENT_SUCCESS':
        return <CreditCard className="w-4 h-4 text-sky-500" />;
      case 'REFERRAL_COMMISSION':
        return <Share2 className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-zinc-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>{t('notificationsTitle')}</span>
            {unreadCount > 0 && (
              <Badge variant="info" size="sm">{unreadCount} {t('notificationsNew')}</Badge>
            )}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {t('notificationsDesc')}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
          >
            {t('notificationsMarkAllRead')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-zinc-400">{t('notificationsLoading')}</div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-6 h-6" />}
          title={t('emptyNotificationsTitle', 'You have no notifications.')}
          description={t('emptyNotificationsDesc', 'Real-time updates regarding generation jobs and billing will be logged here.')}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                !n.isRead ? 'bg-zinc-50/80 dark:bg-zinc-800/40 border-zinc-300 dark:border-zinc-700' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                  {getIcon(n.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{n.title}</h4>
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-zinc-400 font-mono mt-1 block">{formatDate(n.createdAt)}</span>
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1 cursor-pointer shrink-0"
                  title={t('notificationsMarkRead')}
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
