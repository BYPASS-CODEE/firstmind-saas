import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';

// Public views
import { LandingView } from './views/public/LandingView';
import { PricingView } from './views/public/PricingView';
import { FeaturesView } from './views/public/FeaturesView';
import { TermsView, PrivacyView, RefundView } from './views/public/LegalViews';

// Auth views
import { LoginView } from './views/auth/LoginView';
import { RegisterView } from './views/auth/RegisterView';
import { ForgotPasswordView } from './views/auth/ForgotPasswordView';

// App views
import { DashboardView } from './views/app/DashboardView';
import { CreateImageView } from './views/app/CreateImageView';
import { CreateVideoView } from './views/app/CreateVideoView';
import { HistoryView } from './views/app/HistoryView';
import { BillingView } from './views/app/BillingView';
import { ReferralsView } from './views/app/ReferralsView';
import { NotificationsView } from './views/app/NotificationsView';
import { ProfileView } from './views/app/ProfileView';
import { ChatView } from './views/chat/ChatView';

// Admin views
import { AdminOverviewView } from './views/admin/AdminOverviewView';
import { AdminUsersView } from './views/admin/AdminUsersView';
import { AdminGenerationsView } from './views/admin/AdminGenerationsView';
import { AdminFinancialsView } from './views/admin/AdminFinancialsView';
import { AdminSettingsView } from './views/admin/AdminSettingsView';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  // Track referral query param across app entry
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      localStorage.setItem('firstmind_ref_code', refCode.trim().toUpperCase());
    }
  }, []);

  // Sync browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 animate-spin mx-auto" />
          <p className="text-xs text-zinc-500 font-mono">Initializing FIRSTMIND Studio...</p>
        </div>
      </div>
    );
  }

  // Determine route classifications
  const isAuthRoute = currentPath === '/login' || currentPath === '/register' || currentPath === '/forgot-password';
  const isAdminRoute = currentPath.startsWith('/admin');
  const isChatRoute = currentPath === '/app/chat' || currentPath === '/chat';
  const isCreateImageRoute = currentPath.startsWith('/create/image');
  const isAppRoute = currentPath.startsWith('/dashboard') || 
                     currentPath.startsWith('/create') || 
                     currentPath.startsWith('/history') || 
                     currentPath.startsWith('/billing') || 
                     currentPath.startsWith('/referrals') || 
                     currentPath.startsWith('/notifications') || 
                     currentPath.startsWith('/profile') ||
                     currentPath.startsWith('/app') ||
                     currentPath.startsWith('/chat');

  // Route protection - chat and create/image accessible without login
  if ((isAppRoute && !isChatRoute && !isCreateImageRoute) && !isAuthenticated) {
    return <LoginView navigate={navigate} />;
  }

  if (isAdminRoute && user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <Navbar currentPath={currentPath} navigate={navigate} />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-4">
            <h2 className="text-xl font-bold text-rose-600">Access Denied</h2>
            <p className="text-xs text-zinc-500">
              Administrative credentials are required to access this subsystem.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-xs bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg cursor-pointer"
            >
              Return to User Dashboard
            </button>
          </div>
        </div>
        <Footer navigate={navigate} />
      </div>
    );
  }

  // Auth pages (no sidebar or full navbar, centered clean view)
  if (isAuthRoute) {
    const authView = currentPath === '/login'
      ? <LoginView navigate={navigate} />
      : currentPath === '/register'
      ? <RegisterView navigate={navigate} />
      : <ForgotPasswordView navigate={navigate} />;

    return (
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
        <Navbar currentPath={currentPath} navigate={navigate} />
        <div className="flex-1 flex items-center justify-center">
          {authView}
        </div>
        <Footer navigate={navigate} />
      </div>
    );
  }

  // Render App view with Sidebar & Shell
  const renderAppView = () => {
    // Conversational AI Assistant
    if (currentPath === '/app/chat' || currentPath === '/chat') return <ChatView navigate={navigate} />;
    if (currentPath === '/app/studio' || currentPath === '/studio') return <CreateImageView toolMode="text" navigate={navigate} />;

    // Creative Studio Tools
    if (currentPath === '/create/image/text') return <CreateImageView toolMode="text" navigate={navigate} />;
    if (currentPath === '/create/image/image') return <CreateImageView toolMode="image" navigate={navigate} />;
    if (currentPath === '/create/image/variation') return <CreateImageView toolMode="variation" navigate={navigate} />;
    if (currentPath === '/create/image/enhance') return <CreateImageView toolMode="enhance" navigate={navigate} />;
    if (currentPath === '/create/image/style') return <CreateImageView toolMode="style" navigate={navigate} />;
    if (currentPath === '/create/video/text') return <CreateVideoView toolMode="text" navigate={navigate} />;
    if (currentPath === '/create/video/image') return <CreateVideoView toolMode="image" navigate={navigate} />;
    
    // Core User views
    if (currentPath === '/history') return <HistoryView navigate={navigate} />;
    if (currentPath === '/billing') return <BillingView navigate={navigate} />;
    if (currentPath === '/referrals') return <ReferralsView />;
    if (currentPath === '/notifications') return <NotificationsView />;
    if (currentPath === '/profile') return <ProfileView />;

    // Admin views
    if (currentPath === '/admin') return <AdminOverviewView navigate={navigate} />;
    if (currentPath === '/admin/users') return <AdminUsersView />;
    if (currentPath === '/admin/generations') return <AdminGenerationsView />;
    if (currentPath === '/admin/financials') return <AdminFinancialsView />;
    if (currentPath === '/admin/settings') return <AdminSettingsView />;

    // Default authenticated view
    return <DashboardView navigate={navigate} />;
  };

  // Public / Landing Views
  const renderPublicView = () => {
    if (currentPath === '/pricing') return <PricingView navigate={navigate} />;
    if (currentPath === '/features') return <FeaturesView navigate={navigate} />;
    if (currentPath === '/terms') return <TermsView />;
    if (currentPath === '/privacy') return <PrivacyView />;
    if (currentPath === '/refund') return <RefundView />;
    return <LandingView navigate={navigate} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <Navbar currentPath={currentPath} navigate={navigate} />

      {isAppRoute || isAdminRoute ? (
        <div className="flex-1 flex overflow-hidden">
          <Sidebar currentPath={currentPath} navigate={navigate} />
          <main className="flex-1 overflow-y-auto">
            {renderAppView()}
          </main>
        </div>
      ) : (
        <main className="flex-1">
          {renderPublicView()}
        </main>
      )}

      <Footer navigate={navigate} />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
