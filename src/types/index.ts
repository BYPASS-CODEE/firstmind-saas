export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  isEmailVerified: boolean;
  timezone: string;
  language: string;
  referralCode: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'STARTER' | 'PRO' | 'ELITE';
  priceMonthly: number;
  currency: string;
  creditLimit: number;
  allowedTools: string[];
  maxQuality: string;
  processingPriority: 'STANDARD' | 'HIGH' | 'ULTRA';
  isActive: boolean;
  description: string;
  features: string[];
}

export interface UserSubscription {
  id: string;
  planName: string;
  tier: 'STARTER' | 'PRO' | 'ELITE';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING' | 'PAST_DUE';
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  currentPeriodEnd: string;
  autoRenew?: boolean;
}

export interface GenerationJob {
  id: string;
  userId: string;
  tool: string;
  provider: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  inputMetadata: {
    prompt?: string;
    negativePrompt?: string;
    aspectRatio?: string;
    resolution?: string;
    style?: string;
    strength?: number;
    duration?: number;
    seed?: number;
  };
  outputMetadata?: {
    assetUrl?: string;
    mimeType?: string;
    width?: number;
    height?: number;
    duration?: number;
    sizeBytes?: number;
  };
  usageCost: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  errorMessage?: string;
  error?: string;
  retryCount: number;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  provider: 'IRANIAN_GATEWAY' | 'CRYPTO' | 'STRIPE_TEST';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  transactionReference: string;
  createdAt: string;
  verifiedAt?: string;
  errorMessage?: string;
  planName?: string;
  userEmail?: string;
  userName?: string;
}

export interface InvoiceRecord {
  id: string;
  paymentId: string;
  userId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  planName: string;
  issuedAt: string;
  paidAt?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'GENERATION_COMPLETED' | 'GENERATION_FAILED' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'SUBSCRIPTION_EXPIRING' | 'REFERRAL_COMMISSION' | 'SECURITY_ALERT';
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

export interface ReferralData {
  referralCode: string;
  referralLink: string;
  stats: {
    totalReferrals: number;
    qualifiedReferrals: number;
    pendingReferrals: number;
    totalEarnings: number;
    monthlyEarnings: number;
    leaderboardRank: number | null;
  };
  referrals: Array<{
    id: string;
    referredUserName: string;
    referredUserEmail: string;
    status: string;
    commissionAmount: number;
    currency: string;
    createdAt: string;
    qualifiedAt?: string;
  }>;
  ledgerEntries: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  referralCode: string;
  earnings: number;
  referralsCount: number;
}

export interface AIToolConfig {
  id: string;
  key: string;
  name: string;
  type: 'IMAGE' | 'VIDEO';
  creditCost: number;
  isEnabled: boolean;
  provider: string;
  description: string;
  supportedRatios: string[];
  supportedResolutions: string[];
}

export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  verifiedRevenue?: number;
  totalRevenue?: number;
  totalGenerations: number;
  completedJobs: number;
  failedJobs: number;
  paymentFailures: number;
  totalReferralCommissions: number;
  activeAiProvider: string;
  isAiConfigured: boolean;
  isPaymentConfigured: boolean;
}

export interface AuditLogRecord {
  id: string;
  actorId: string;
  actorName?: string;
  action: string;
  targetEntity?: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
}

export interface AdminConfig {
  platformName?: string;
  maintenanceMode: boolean;
  allowRegistrations?: boolean;
  defaultCredits?: number;
  referralCommissionUSD?: number;
  referralCommissionAmount?: number;
  defaultCurrency?: string;
}
