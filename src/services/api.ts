export class ApiError extends Error {
  code: string;
  requestId?: string;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.requestId = requestId;
  }
}

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getDemoUsers(): Record<string, { password: string; user: any }> {
  try {
    return JSON.parse(localStorage.getItem('firstmind_demo_users') || '{}');
  } catch { return {}; }
}

function saveDemoUsers(users: Record<string, { password: string; user: any }>) {
  localStorage.setItem('firstmind_demo_users', JSON.stringify(users));
}

function getDemoUser(): any | null {
  const token = localStorage.getItem('firstmind_token');
  if (!token) return null;
  try {
    return JSON.parse(localStorage.getItem('firstmind_demo_current_user') || 'null');
  } catch { return null; }
}

function saveDemoUser(user: any) {
  if (user) {
    localStorage.setItem('firstmind_demo_current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('firstmind_demo_current_user');
  }
}

function getDemoGenerations(): any[] {
  try {
    return JSON.parse(localStorage.getItem('firstmind_demo_generations') || '[]');
  } catch { return []; }
}

function saveDemoGenerations(gen: any[]) {
  localStorage.setItem('firstmind_demo_generations', JSON.stringify(gen));
}

function getDemoNotifications(): any[] {
  try {
    return JSON.parse(localStorage.getItem('firstmind_demo_notifications') || '[]');
  } catch { return []; }
}

function saveDemoNotifications(n: any[]) {
  localStorage.setItem('firstmind_demo_notifications', JSON.stringify(n));
}

class ApiClient {
  private token: string | null = null;
  private demoMode: boolean = false;
  private demoModeChecked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('firstmind_token');
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('firstmind_token', token);
      } else {
        localStorage.removeItem('firstmind_token');
      }
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async checkDemoMode(): Promise<boolean> {
    if (this.demoModeChecked) return this.demoMode;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const resp = await fetch('/api/health', { signal: controller.signal });
      clearTimeout(timeout);
      const ct = resp.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        this.demoMode = true;
      } else {
        this.demoMode = false;
      }
    } catch {
      this.demoMode = true;
    }
    this.demoModeChecked = true;
    return this.demoMode;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isDemo = await this.checkDemoMode();
    if (isDemo) {
      throw new ApiError('Server unavailable (demo mode)', 'DEMO_MODE');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(endpoint, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeout);

    let data: any;
    try {
      const text = await response.text();
      data = JSON.parse(text);
    } catch {
      this.demoMode = true;
      throw new ApiError('Server unavailable (demo mode)', 'DEMO_MODE');
    }

    if (!response.ok || data.success === false) {
      const errorMsg = data.error?.message || data.message || `HTTP ${response.status}: Request failed`;
      const errorCode = data.error?.code || 'REQUEST_FAILED';
      const requestId = data.error?.requestId;
      throw new ApiError(errorMsg, errorCode, requestId);
    }

    return data.data !== undefined ? data.data : data;
  }

  // ========== DEMO AUTH ==========
  public async register(payload: { email: string; password: string; name: string; referralCode?: string }) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) {
      const users = getDemoUsers();
      if (users[payload.email]) {
        throw new ApiError('An account with this email already exists', 'EMAIL_EXISTS');
      }
      const user = {
        id: generateId('usr'),
        email: payload.email,
        name: payload.name,
        role: 'USER' as const,
        status: 'ACTIVE' as const,
        isEmailVerified: true,
        timezone: 'UTC',
        language: 'en',
        referralCode: generateId('FM').toUpperCase(),
        createdAt: new Date().toISOString()
      };
      users[payload.email] = { password: payload.password, user };
      saveDemoUsers(users);

      const token = generateId('tok');
      this.setToken(token);
      saveDemoUser(user);

      return { token, user, subscription: this.getDefaultSubscription() };
    }

    const res = await this.request<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  public async login(payload: { email: string; password: string }) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) {
      const users = getDemoUsers();
      const entry = users[payload.email];
      if (!entry || entry.password !== payload.password) {
        throw new ApiError('Invalid email or password', 'INVALID_CREDENTIALS');
      }
      const token = generateId('tok');
      this.setToken(token);
      saveDemoUser(entry.user);
      return { token, user: entry.user, subscription: this.getDefaultSubscription() };
    }

    const res = await this.request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  public async logout() {
    const isDemo = await this.checkDemoMode();
    if (!isDemo) {
      try {
        await this.request<any>('/api/auth/logout', { method: 'POST' });
      } catch { /* Ignored */ }
    }
    this.setToken(null);
    saveDemoUser(null);
  }

  public async getMe() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) {
      const user = getDemoUser();
      if (!user) {
        throw new ApiError('Not authenticated', 'UNAUTHENTICATED');
      }
      return { user, subscription: this.getDefaultSubscription() };
    }
    return this.request<any>('/api/auth/me');
  }

  public async enterDevTestSession() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) {
      const user = {
        id: 'usr_dev_test',
        email: 'dev@firstmind.ai',
        name: 'Dev Tester',
        role: 'ADMIN' as const,
        status: 'ACTIVE' as const,
        isEmailVerified: true,
        timezone: 'UTC',
        language: 'en',
        referralCode: 'FM-DEVTEST',
        createdAt: new Date().toISOString()
      };
      const token = generateId('tok');
      this.setToken(token);
      saveDemoUser(user);
      return { token, user, subscription: this.getDefaultSubscription() };
    }
    const res = await this.request<any>('/api/auth/dev-test-session', {
      method: 'POST'
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  // ========== DEMO DATA HELPERS ==========
  private getDefaultSubscription() {
    return {
      id: 'sub_demo',
      planName: 'STARTER',
      tier: 'STARTER' as const,
      status: 'ACTIVE' as const,
      creditsTotal: 100,
      creditsUsed: 12,
      creditsRemaining: 88,
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      autoRenew: true
    };
  }

  private getDefaultConfig() {
    return {
      devAiTestMode: true,
      aiProvider: 'demo',
      imageModel: 'demo-image-gen',
      chatModel: 'demo-chat',
      isAiConfigured: false
    };
  }

  // ========== DEMO API METHODS ==========
  public async getConfig() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return this.getDefaultConfig();
    return this.request<any>('/api/config');
  }

  public async getHealth() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { status: 'ok', demo: true };
    return this.request<any>('/api/health');
  }

  // Chat
  public async sendChatMessage(payload: {
    conversationId?: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    systemInstruction?: string;
    temperature?: number;
  }) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) {
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
      const GROQ_MODEL = import.meta.env.VITE_GROQ_CHAT_MODEL || 'qwen/qwen3.8-27b';

      const systemMsg = payload.systemInstruction
        ? [{ role: 'system', content: payload.systemInstruction }]
        : [];

      const resp = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://api.groq.com/openai/v1/chat/completions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            ...systemMsg,
            ...payload.messages.map(m => ({ role: m.role, content: m.content }))
          ],
          temperature: payload.temperature ?? 0.7,
          max_tokens: 2048
        })
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new ApiError(`Groq API error ${resp.status}: ${errText}`, 'GROQ_ERROR');
      }

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content || 'No response from AI.';

      return {
        conversationId: payload.conversationId || generateId('conv'),
        message: {
          role: 'assistant' as const,
          content,
          timestamp: new Date().toISOString()
        },
        model: GROQ_MODEL,
        provider: 'groq'
      };
    }
    return this.request<any>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async getChatStatus() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { provider: 'groq', chatModel: 'qwen/qwen3.8-27b', isConfigured: true };
    return this.request<any>('/api/chat/status');
  }

  // Profile
  public async updateProfile(payload: { name?: string; timezone?: string; language?: string }) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) {
      const user = getDemoUser();
      if (user) {
        if (payload.name) user.name = payload.name;
        if (payload.timezone) user.timezone = payload.timezone;
        if (payload.language) user.language = payload.language;
        saveDemoUser(user);
      }
      return { user };
    }
    return this.request<any>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  public async updatePassword(payload: { currentPassword: string; newPassword: string }) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { success: true, message: 'Password updated (demo)' };
    return this.request<any>('/api/user/profile/password', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  // Dashboard
  public async getDashboard() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) {
      const gens = getDemoGenerations();
      return {
        user: getDemoUser(),
        subscription: this.getDefaultSubscription(),
        recentGenerations: gens.slice(-5).reverse(),
        stats: {
          totalGenerations: gens.length,
          thisMonth: gens.filter(g => {
            const d = new Date(g.createdAt);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length,
          creditsRemaining: 88
        }
      };
    }
    return this.request<any>('/api/user/dashboard');
  }

  // Notifications
  public async getNotifications() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) {
      return getDemoNotifications();
    }
    return this.request<any[]>('/api/user/notifications');
  }

  public async markNotificationRead(id: string) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) {
      const notifs = getDemoNotifications();
      const n = notifs.find((x: any) => x.id === id);
      if (n) n.isRead = true;
      saveDemoNotifications(notifs);
      return { success: true };
    }
    return this.request<any>(`/api/user/notifications/${id}/read`, { method: 'PUT' });
  }

  public async markAllNotificationsRead() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) {
      const notifs = getDemoNotifications().map((n: any) => ({ ...n, isRead: true }));
      saveDemoNotifications(notifs);
      return { success: true };
    }
    return this.request<any>('/api/user/notifications/read-all', { method: 'PUT' });
  }

  // Plans
  public async getPlans() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) {
      return [
        { id: 'plan_starter', name: 'STARTER', tier: 'STARTER', priceMonthly: 9.99, currency: 'USD', creditLimit: 100, allowedTools: ['text-to-image'], maxQuality: 'HD', processingPriority: 'STANDARD', isActive: true, description: 'Perfect for beginners', features: ['100 credits/month', 'Text to Image', 'HD Quality'] },
        { id: 'plan_pro', name: 'PRO', tier: 'PRO', priceMonthly: 29.99, currency: 'USD', creditLimit: 500, allowedTools: ['text-to-image', 'image-to-image', 'style-transfer'], maxQuality: '2K', processingPriority: 'HIGH', isActive: true, description: 'For professional creators', features: ['500 credits/month', 'All Image Tools', '2K Quality', 'Priority Processing'] },
        { id: 'plan_elite', name: 'ELITE', tier: 'ELITE', priceMonthly: 79.99, currency: 'USD', creditLimit: 2000, allowedTools: ['all'], maxQuality: '4K', processingPriority: 'ULTRA', isActive: true, description: 'Unlimited creative power', features: ['2000 credits/month', 'All Tools', '4K Quality', 'Ultra Priority', 'Video Generation'] }
      ];
    }
    return this.request<any[]>('/api/plans');
  }

  public async getCurrentSubscription() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return this.getDefaultSubscription();
    return this.request<any>('/api/subscriptions/current');
  }

  public async cancelSubscription() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { success: true, message: 'Subscription cancelled (demo)' };
    return this.request<any>('/api/subscriptions/cancel', { method: 'POST' });
  }

  // Payments
  public async getPaymentProviders() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return [
      { id: 'crypto', name: 'Crypto', isEnabled: true },
      { id: 'iranian', name: 'Iranian Gateway', isEnabled: true }
    ];
    return this.request<any[]>('/api/payments/providers');
  }

  public async createPayment(payload: { planId: string; provider: string; idempotencyKey?: string }) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { paymentId: generateId('pay'), status: 'PENDING', redirectUrl: '#' };
    return this.request<any>('/api/payments/create', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async verifyPayment(payload: { paymentId: string; providerTransactionId?: string; signature?: string }) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { status: 'SUCCESS', message: 'Payment verified (demo)' };
    return this.request<any>('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async getBillingData() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { payments: [], subscription: this.getDefaultSubscription() };
    return this.request<any>('/api/payments/billing');
  }

  // Generations
  public async generateImage(payload: {
    tool: string;
    prompt: string;
    negativePrompt?: string;
    aspectRatio?: string;
    resolution?: string;
    style?: string;
    sourceImageBase64?: string;
    sourceImageMimeType?: string;
    strength?: number;
    seed?: number;
  }) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) {
      const gen = {
        id: generateId('gen'),
        userId: getDemoUser()?.id || 'demo',
        tool: payload.tool,
        provider: 'demo',
        status: 'COMPLETED' as const,
        inputMetadata: {
          prompt: payload.prompt,
          negativePrompt: payload.negativePrompt,
          aspectRatio: payload.aspectRatio,
          resolution: payload.resolution,
          style: payload.style
        },
        outputMetadata: {
          assetUrl: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs><rect width="512" height="512" fill="url(#g)"/><text x="256" y="240" text-anchor="middle" fill="white" font-size="18" font-family="sans-serif">FIRSTMIND Demo</text><text x="256" y="270" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="12" font-family="sans-serif">AI Generated Image</text></svg>'),
          mimeType: 'image/svg+xml',
          width: 512,
          height: 512,
          sizeBytes: 1024
        },
        usageCost: 1,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        retryCount: 0
      };
      const gens = getDemoGenerations();
      gens.push(gen);
      saveDemoGenerations(gens);
      return gen;
    }
    return this.request<any>('/api/generations/image', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async generateVideo(payload: {
    tool: string;
    prompt: string;
    duration?: number;
    aspectRatio?: string;
    resolution?: string;
    sourceImageBase64?: string;
    sourceImageMimeType?: string;
  }) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) {
      const gen = {
        id: generateId('gen'),
        userId: getDemoUser()?.id || 'demo',
        tool: payload.tool,
        provider: 'demo',
        status: 'COMPLETED' as const,
        inputMetadata: { prompt: payload.prompt, duration: payload.duration, aspectRatio: payload.aspectRatio },
        outputMetadata: {
          assetUrl: '',
          mimeType: 'video/mp4',
          width: 720,
          height: 1280,
          duration: payload.duration || 4,
          sizeBytes: 2048
        },
        usageCost: 5,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        retryCount: 0
      };
      const gens = getDemoGenerations();
      gens.push(gen);
      saveDemoGenerations(gens);
      return gen;
    }
    return this.request<any>('/api/generations/video', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async getGenerations(params: { type?: string; tool?: string; status?: string; page?: number; limit?: number } = {}) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) {
      let gens = getDemoGenerations();
      if (params.tool) gens = gens.filter(g => g.tool === params.tool);
      if (params.status) gens = gens.filter(g => g.status === params.status);
      gens.reverse();
      const page = params.page || 1;
      const limit = params.limit || 20;
      const start = (page - 1) * limit;
      return { items: gens.slice(start, start + limit), total: gens.length, page, limit };
    }
    const query = new URLSearchParams();
    if (params.type) query.append('type', params.type);
    if (params.tool) query.append('tool', params.tool);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    return this.request<any>(`/api/generations?${query.toString()}`);
  }

  public async getGeneration(id: string) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) {
      const gens = getDemoGenerations();
      return gens.find(g => g.id === id) || null;
    }
    return this.request<any>(`/api/generations/${id}`);
  }

  public async retryGeneration(id: string) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { success: true, message: 'Retry queued (demo)' };
    return this.request<any>(`/api/generations/${id}/retry`, { method: 'POST' });
  }

  public async deleteGeneration(id: string) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) {
      const gens = getDemoGenerations().filter(g => g.id !== id);
      saveDemoGenerations(gens);
      return { success: true };
    }
    return this.request<any>(`/api/generations/${id}`, { method: 'DELETE' });
  }

  // Referrals
  public async getReferralDashboard() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) {
      const user = getDemoUser();
      return {
        referralCode: user?.referralCode || 'FM-XXXXXX',
        referralLink: `https://example.com/register?ref=${user?.referralCode || 'FM-XXXXXX'}`,
        stats: { totalReferrals: 3, qualifiedReferrals: 2, pendingReferrals: 1, totalEarnings: 15.50, monthlyEarnings: 5.50, leaderboardRank: 12 },
        referrals: [],
        ledgerEntries: []
      };
    }
    return this.request<any>('/api/referrals');
  }

  public async getLeaderboard(period: 'global' | 'monthly' = 'global') {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { entries: [], period };
    return this.request<any>(`/api/referrals/leaderboard?period=${period}`);
  }

  // Admin
  public async getAdminStats() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return {
      totalUsers: 42,
      activeSubscriptions: 18,
      totalRevenue: 1250,
      totalGenerations: 356,
      completedJobs: 340,
      failedJobs: 16,
      paymentFailures: 2,
      totalReferralCommissions: 45,
      activeAiProvider: 'demo',
      isAiConfigured: false,
      isPaymentConfigured: false
    };
    return this.request<any>('/api/admin/stats');
  }

  public async getAdminUsers(params: { search?: string; status?: string; role?: string; page?: number; limit?: number } = {}) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { items: [], total: 0 };
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.role) query.append('role', params.role);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    return this.request<any>(`/api/admin/users?${query.toString()}`);
  }

  public async updateAdminUserStatus(id: string, status: 'ACTIVE' | 'SUSPENDED', reason?: string) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { success: true };
    return this.request<any>(`/api/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, reason }) });
  }

  public async updateUserStatus(id: string, status: 'ACTIVE' | 'SUSPENDED', reason?: string) {
    return this.updateAdminUserStatus(id, status, reason);
  }

  public async adjustUserCredits(id: string, amount: number, reason?: string) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { success: true };
    return this.request<any>(`/api/admin/users/${id}/credits`, { method: 'POST', body: JSON.stringify({ amount, reason }) });
  }

  public async updateUserRole(id: string, role: string) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { success: true };
    return this.request<any>(`/api/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
  }

  public async getAdminSubscriptions() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { items: [] };
    return this.request<any>('/api/admin/subscriptions');
  }

  public async updateAdminPlan(id: string, payload: any) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { success: true };
    return this.request<any>(`/api/admin/plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  public async getAdminPayments(params: { status?: string; provider?: string; search?: string; page?: number; limit?: number } = {}) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { items: [], total: 0 };
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.provider) query.append('provider', params.provider);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    return this.request<any>(`/api/admin/payments?${query.toString()}`);
  }

  public async getAdminFinancials() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { payments: [] };
    const data = await this.getAdminPayments({ limit: 100 });
    return { payments: data.items || [] };
  }

  public async getAdminGenerations(params: { status?: string; tool?: string; page?: number; limit?: number } = {}) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { items: [], total: 0 };
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.tool) query.append('tool', params.tool);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    return this.request<any>(`/api/admin/generations?${query.toString()}`);
  }

  public async getAdminTools() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return [];
    return this.request<any>('/api/admin/tools');
  }

  public async updateAdminTool(id: string, payload: { isEnabled?: boolean; creditCost?: number }) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { success: true };
    return this.request<any>(`/api/admin/tools/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  public async getAdminReferrals() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { referrals: [], totalCommission: 0 };
    return this.request<any>('/api/admin/referrals');
  }

  public async getAdminReports() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { revenue: [], usage: [] };
    return this.request<any>('/api/admin/reports');
  }

  public async getAdminAuditLogs(params?: { limit?: number }) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { logs: [] };
    return this.request<any>('/api/admin/audit');
  }

  public async getAdminSettings() {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return {
      platformName: 'FIRSTMIND Studio',
      maintenanceMode: false,
      allowRegistrations: true,
      defaultCredits: 100,
      referralCommissionAmount: 5,
      defaultCurrency: 'USD'
    };
    return this.request<any>('/api/admin/settings');
  }

  public async getAdminConfig() {
    return this.getAdminSettings();
  }

  public async updateAdminSettings(payload: any) {
    const isDemo = await this.checkDemoMode();
    if (isDemo) return { success: true, settings: payload };
    return this.request<any>('/api/admin/settings', { method: 'PUT', body: JSON.stringify(payload) });
  }

  public async updateAdminConfig(payload: any) {
    return this.updateAdminSettings(payload);
  }
}

export const api = new ApiClient();
