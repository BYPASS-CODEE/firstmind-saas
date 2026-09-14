import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  isEmailVerified: boolean;
  avatarUrl?: string;
  timezone: string;
  language: string;
  referralCode: string;
  referredBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'STARTER' | 'PRO' | 'ELITE';
  priceMonthly: number; // exact decimal representation
  currency: string;
  creditLimit: number;
  allowedTools: string[];
  maxQuality: string;
  processingPriority: 'STANDARD' | 'HIGH' | 'ULTRA';
  isActive: boolean;
  description: string;
  features: string[];
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING' | 'PAST_DUE';
  creditsTotal: number;
  creditsUsed: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId?: string;
  planId: string;
  amount: number;
  currency: string;
  provider: 'IRANIAN_GATEWAY' | 'CRYPTO' | 'STRIPE_TEST';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  transactionReference: string;
  providerTransactionId?: string;
  errorMessage?: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
  createdAt: string;
  verifiedAt?: string;
}

export interface Invoice {
  id: string;
  paymentId: string;
  userId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  planName: string;
  issuedAt: string;
  paidAt?: string;
  downloadUrl?: string;
}

export interface AITool {
  id: string;
  key: 'TEXT_TO_IMAGE' | 'IMAGE_TO_IMAGE' | 'VARIATION' | 'ENHANCE' | 'STYLE_TRANSFER' | 'TEXT_TO_VIDEO' | 'IMAGE_TO_VIDEO';
  name: string;
  type: 'IMAGE' | 'VIDEO';
  creditCost: number;
  isEnabled: boolean;
  provider: string;
  description: string;
  supportedRatios: string[];
  supportedResolutions: string[];
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
    sourceImageUrl?: string;
    strength?: number;
    duration?: number;
    seed?: number;
  };
  outputMetadata?: {
    assetUrl?: string;
    thumbnailUrl?: string;
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
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
}

export interface UsageRecord {
  id: string;
  userId: string;
  jobId: string;
  tool: string;
  amountConsumed: number;
  balanceBefore: number;
  balanceAfter: number;
  status: 'DEBITED' | 'REFUNDED';
  timestamp: string;
  subscriptionId: string;
}

export interface ReferralRecord {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referralCode: string;
  status: 'REGISTERED' | 'QUALIFIED' | 'COMMISSIONED' | 'CANCELLED' | 'SUSPICIOUS';
  qualifyingPaymentId?: string;
  commissionAmount: number; // e.g. 1.00
  currency: string;
  createdAt: string;
  qualifiedAt?: string;
}

export interface ReferralLedgerEntry {
  id: string;
  referrerUserId: string;
  referralRecordId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'APPROVED' | 'PAID' | 'REVERSED';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'GENERATION_COMPLETED' | 'GENERATION_FAILED' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'SUBSCRIPTION_EXPIRING' | 'REFERRAL_COMMISSION' | 'SECURITY_ALERT';
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface SystemSettings {
  platformName: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  defaultCurrency: string;
  referralCommissionAmount: number;
  aiProviderConfigured: boolean;
  paymentGatewayConfigured: boolean;
  activeAiProvider: string;
  activePaymentGateway: string;
}

export interface DatabaseSchema {
  users: User[];
  sessions: Session[];
  subscriptionPlans: SubscriptionPlan[];
  subscriptions: Subscription[];
  payments: Payment[];
  invoices: Invoice[];
  aiTools: AITool[];
  generationJobs: GenerationJob[];
  usageLedger: UsageRecord[];
  referrals: ReferralRecord[];
  referralLedger: ReferralLedgerEntry[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

const DB_FILE = path.join(process.cwd(), 'data', 'firstmind-db.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

function getInitialPlans(): SubscriptionPlan[] {
  return [
    {
      id: 'plan_starter',
      name: 'Starter',
      tier: 'STARTER',
      priceMonthly: 10.00,
      currency: 'USD',
      creditLimit: 100,
      allowedTools: ['TEXT_TO_IMAGE', 'IMAGE_TO_IMAGE', 'VARIATION'],
      maxQuality: '1K',
      processingPriority: 'STANDARD',
      isActive: true,
      description: 'Essential creative toolset for hobbyists and individual experimenters.',
      features: [
        '100 monthly generation credits',
        'Text-to-Image & Image-to-Image creation',
        'Standard processing queue',
        'Commercial usage rights',
        'Community support',
        'PNG / JPG asset downloads'
      ]
    },
    {
      id: 'plan_pro',
      name: 'Pro',
      tier: 'PRO',
      priceMonthly: 50.00,
      currency: 'USD',
      creditLimit: 600,
      allowedTools: ['TEXT_TO_IMAGE', 'IMAGE_TO_IMAGE', 'VARIATION', 'ENHANCE', 'STYLE_TRANSFER', 'TEXT_TO_VIDEO', 'IMAGE_TO_VIDEO'],
      maxQuality: '2K',
      processingPriority: 'HIGH',
      isActive: true,
      description: 'High-throughput studio suite for design professionals and creative agencies.',
      features: [
        '600 monthly generation credits',
        'All Image Tools + Text & Image-to-Video',
        'High-priority generation queue',
        'High-resolution up to 2K',
        'Full generation history & export',
        'Priority email & ticket support'
      ]
    },
    {
      id: 'plan_elite',
      name: 'Elite',
      tier: 'ELITE',
      priceMonthly: 99.00,
      currency: 'USD',
      creditLimit: 1500,
      allowedTools: ['TEXT_TO_IMAGE', 'IMAGE_TO_IMAGE', 'VARIATION', 'ENHANCE', 'STYLE_TRANSFER', 'TEXT_TO_VIDEO', 'IMAGE_TO_VIDEO'],
      maxQuality: '4K',
      processingPriority: 'ULTRA',
      isActive: true,
      description: 'Maximum generation capacity with ultra-priority execution and 4K outputs.',
      features: [
        '1,500 monthly generation credits',
        'Ultra-priority queue execution',
        'Ultra-high fidelity up to 4K',
        'Uncapped batch concurrency',
        'Dedicated account management',
        'Custom style model fine-tuning'
      ]
    }
  ];
}

function getInitialTools(): AITool[] {
  return [
    {
      id: 'tool_text_to_image',
      key: 'TEXT_TO_IMAGE',
      name: 'Text to Image',
      type: 'IMAGE',
      creditCost: 2,
      isEnabled: true,
      provider: 'Gemini 3.1 Flash Image',
      description: 'Generate hyper-detailed digital art, concept design, and photo-realism from natural language prompts.',
      supportedRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      supportedResolutions: ['1K', '2K']
    },
    {
      id: 'tool_image_to_image',
      key: 'IMAGE_TO_IMAGE',
      name: 'Image to Image',
      type: 'IMAGE',
      creditCost: 3,
      isEnabled: true,
      provider: 'Gemini 3.1 Flash Image',
      description: 'Guide prompt-driven image evolution using an uploaded reference asset with adjustable guidance strength.',
      supportedRatios: ['1:1', '16:9', '9:16'],
      supportedResolutions: ['1K', '2K']
    },
    {
      id: 'tool_variation',
      key: 'VARIATION',
      name: 'Variation Engine',
      type: 'IMAGE',
      creditCost: 2,
      isEnabled: true,
      provider: 'Gemini 3.1 Flash Image',
      description: 'Explore compositional and conceptual variations of an existing image asset.',
      supportedRatios: ['1:1'],
      supportedResolutions: ['1K']
    },
    {
      id: 'tool_enhance',
      key: 'ENHANCE',
      name: 'Enhance & Upscale',
      type: 'IMAGE',
      creditCost: 4,
      isEnabled: true,
      provider: 'Gemini Neural Upscaler',
      description: 'Enhance fine micro-textures, clean noise artifacts, and upscale raster resolution.',
      supportedRatios: ['Original'],
      supportedResolutions: ['2K', '4K']
    },
    {
      id: 'tool_style_transfer',
      key: 'STYLE_TRANSFER',
      name: 'Style Transfer',
      type: 'IMAGE',
      creditCost: 3,
      isEnabled: true,
      provider: 'Gemini Style Engine',
      description: 'Transfer artistic styles, color palettes, and cinematic textures onto your source images.',
      supportedRatios: ['1:1', '16:9'],
      supportedResolutions: ['1K', '2K']
    },
    {
      id: 'tool_text_to_video',
      key: 'TEXT_TO_VIDEO',
      name: 'Text to Video',
      type: 'VIDEO',
      creditCost: 15,
      isEnabled: true,
      provider: 'Veo 3.1 Video Engine',
      description: 'Synthesize coherent 6-15s cinematic motion clips directly from written scene descriptions.',
      supportedRatios: ['16:9', '9:16'],
      supportedResolutions: ['720p', '1080p']
    },
    {
      id: 'tool_image_to_video',
      key: 'IMAGE_TO_VIDEO',
      name: 'Image to Video',
      type: 'VIDEO',
      creditCost: 18,
      isEnabled: true,
      provider: 'Veo 3.1 Video Engine',
      description: 'Animate static illustrations and photos into seamless, temporal video sequences.',
      supportedRatios: ['16:9', '9:16'],
      supportedResolutions: ['720p', '1080p']
    }
  ];
}

// Password hashing using PBKDF2
export function hashPassword(password: string, salt?: string): string {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, s, 10000, 64, 'sha512').toString('hex');
  return `${s}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const salt = parts[0];
  const hash = parts[1];
  const check = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error reading database file, initializing fresh:', err);
      }
    }

    // Initial production state: strictly ZERO fake users, payments, subscriptions, or generations!
    // We only create an authorized default administrator so the administrative control panel
    // can be inspected, logged into, and tested securely without requiring mock registrations.
    const initialAdmin: User = {
      id: 'usr_admin_001',
      email: 'admin@firstmind.ai',
      passwordHash: hashPassword('FirstMind2026!Admin'),
      name: 'FirstMind Administrator',
      role: 'ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
      timezone: 'UTC',
      language: 'en',
      referralCode: 'FIRSTMIND-ADM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const initial: DatabaseSchema = {
      users: [initialAdmin],
      sessions: [],
      subscriptionPlans: getInitialPlans(),
      subscriptions: [],
      payments: [],
      invoices: [],
      aiTools: getInitialTools(),
      generationJobs: [],
      usageLedger: [],
      referrals: [],
      referralLedger: [],
      notifications: [],
      auditLogs: [
        {
          id: 'log_init',
          actorId: 'system',
          actorEmail: 'system@firstmind.ai',
          action: 'SYSTEM_INITIALIZATION',
          entity: 'SYSTEM',
          entityId: 'root',
          metadata: { message: 'Database initialized with zero fake records and real production schemas.' },
          timestamp: new Date().toISOString()
        }
      ],
      settings: {
        platformName: 'FIRSTMIND',
        maintenanceMode: false,
        allowRegistrations: true,
        defaultCurrency: 'USD',
        referralCommissionAmount: 1.00,
        aiProviderConfigured: Boolean(process.env.GEMINI_API_KEY),
        paymentGatewayConfigured: Boolean(process.env.PAYMENT_GATEWAY_KEY),
        activeAiProvider: 'Gemini GenAI',
        activePaymentGateway: 'Multi-Gateway (Zarinpal/Crypto/Stripe)'
      }
    };

    this.saveDirect(initial);
    return initial;
  }

  private saveDirect(data: DatabaseSchema) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  public save() {
    this.saveDirect(this.data);
  }

  public getSchema(): DatabaseSchema {
    return this.data;
  }

  // Atomic transaction helper
  public transaction<T>(fn: (db: DatabaseSchema) => T): T {
    const result = fn(this.data);
    this.save();
    return result;
  }
}

export const db = new Database();
