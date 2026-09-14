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

class ApiClient {
  private token: string | null = null;

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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    let data: any;
    try {
      data = await response.json();
    } catch {
      throw new ApiError('Failed to parse response from server', 'PARSE_ERROR');
    }

    if (!response.ok || data.success === false) {
      const errorMsg = data.error?.message || data.message || `HTTP ${response.status}: Request failed`;
      const errorCode = data.error?.code || 'REQUEST_FAILED';
      const requestId = data.error?.requestId;
      throw new ApiError(errorMsg, errorCode, requestId);
    }

    return data.data !== undefined ? data.data : data;
  }

  // Health & Config
  public async getHealth() {
    return this.request<any>('/api/health');
  }

  public async getConfig() {
    return this.request<{
      devAiTestMode: boolean;
      aiProvider: string;
      imageModel: string;
      chatModel: string;
      isAiConfigured: boolean;
    }>('/api/config');
  }

  public async enterDevTestSession() {
    const res = await this.request<any>('/api/auth/dev-test-session', {
      method: 'POST'
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  // Chat API
  public async sendChatMessage(payload: {
    conversationId?: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    systemInstruction?: string;
    temperature?: number;
  }) {
    return this.request<{
      conversationId: string;
      message: { role: 'assistant'; content: string; timestamp?: string };
      model: string;
      provider: string;
    }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async getChatStatus() {
    return this.request<{
      provider: string;
      chatModel: string;
      isConfigured: boolean;
    }>('/api/chat/status');
  }

  // Auth
  public async register(payload: { email: string; password: string; name: string; referralCode?: string }) {
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
    try {
      await this.request<any>('/api/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  public async getMe() {
    return this.request<any>('/api/auth/me');
  }

  public async updateProfile(payload: { name?: string; timezone?: string; language?: string }) {
    return this.request<any>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  public async updatePassword(payload: { currentPassword: string; newPassword: string }) {
    return this.request<any>('/api/user/profile/password', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  // Dashboard & Notifications
  public async getDashboard() {
    return this.request<any>('/api/user/dashboard');
  }

  public async getNotifications() {
    return this.request<any[]>('/api/user/notifications');
  }

  public async markNotificationRead(id: string) {
    return this.request<any>(`/api/user/notifications/${id}/read`, { method: 'PUT' });
  }

  public async markAllNotificationsRead() {
    return this.request<any>('/api/user/notifications/read-all', { method: 'PUT' });
  }

  // Plans & Subscriptions
  public async getPlans() {
    return this.request<any[]>('/api/plans');
  }

  public async getCurrentSubscription() {
    return this.request<any>('/api/subscriptions/current');
  }

  public async cancelSubscription() {
    return this.request<any>('/api/subscriptions/cancel', { method: 'POST' });
  }

  // Payments & Billing
  public async getPaymentProviders() {
    return this.request<any[]>('/api/payments/providers');
  }

  public async createPayment(payload: { planId: string; provider: string; idempotencyKey?: string }) {
    return this.request<any>('/api/payments/create', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async verifyPayment(payload: { paymentId: string; providerTransactionId?: string; signature?: string }) {
    return this.request<any>('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async getBillingData() {
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
    return this.request<any>('/api/generations/video', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async getGenerations(params: { type?: string; tool?: string; status?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.type) query.append('type', params.type);
    if (params.tool) query.append('tool', params.tool);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));

    return this.request<any>(`/api/generations?${query.toString()}`);
  }

  public async getGeneration(id: string) {
    return this.request<any>(`/api/generations/${id}`);
  }

  public async retryGeneration(id: string) {
    return this.request<any>(`/api/generations/${id}/retry`, { method: 'POST' });
  }

  public async deleteGeneration(id: string) {
    return this.request<any>(`/api/generations/${id}`, { method: 'DELETE' });
  }

  // Referrals
  public async getReferralDashboard() {
    return this.request<any>('/api/referrals');
  }

  public async getLeaderboard(period: 'global' | 'monthly' = 'global') {
    return this.request<any>(`/api/referrals/leaderboard?period=${period}`);
  }

  // Admin endpoints
  public async getAdminStats() {
    return this.request<any>('/api/admin/stats');
  }

  public async getAdminUsers(params: { search?: string; status?: string; role?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.role) query.append('role', params.role);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    return this.request<any>(`/api/admin/users?${query.toString()}`);
  }

  public async updateAdminUserStatus(id: string, status: 'ACTIVE' | 'SUSPENDED', reason?: string) {
    return this.request<any>(`/api/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason })
    });
  }

  public async updateUserStatus(id: string, status: 'ACTIVE' | 'SUSPENDED', reason?: string) {
    return this.updateAdminUserStatus(id, status, reason);
  }

  public async adjustUserCredits(id: string, amount: number, reason?: string) {
    return this.request<any>(`/api/admin/users/${id}/credits`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason })
    });
  }

  public async updateUserRole(id: string, role: string) {
    return this.request<any>(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  }

  public async getAdminSubscriptions() {
    return this.request<any>('/api/admin/subscriptions');
  }

  public async updateAdminPlan(id: string, payload: any) {
    return this.request<any>(`/api/admin/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  public async getAdminPayments(params: { status?: string; provider?: string; search?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.provider) query.append('provider', params.provider);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    return this.request<any>(`/api/admin/payments?${query.toString()}`);
  }

  public async getAdminFinancials() {
    const data = await this.getAdminPayments({ limit: 100 });
    return { payments: data.items || [] };
  }

  public async getAdminGenerations(params: { status?: string; tool?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.tool) query.append('tool', params.tool);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    return this.request<any>(`/api/admin/generations?${query.toString()}`);
  }

  public async getAdminTools() {
    return this.request<any>('/api/admin/tools');
  }

  public async updateAdminTool(id: string, payload: { isEnabled?: boolean; creditCost?: number }) {
    return this.request<any>(`/api/admin/tools/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  public async getAdminReferrals() {
    return this.request<any>('/api/admin/referrals');
  }

  public async getAdminReports() {
    return this.request<any>('/api/admin/reports');
  }

  public async getAdminAuditLogs(params?: { limit?: number }) {
    return this.request<any>('/api/admin/audit');
  }

  public async getAdminSettings() {
    return this.request<any>('/api/admin/settings');
  }

  public async getAdminConfig() {
    return this.getAdminSettings();
  }

  public async updateAdminSettings(payload: any) {
    return this.request<any>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  public async updateAdminConfig(payload: any) {
    return this.updateAdminSettings(payload);
  }
}

export const api = new ApiClient();
