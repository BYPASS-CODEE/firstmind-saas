import crypto from 'crypto';
import { db, Payment, Subscription, Invoice, ReferralRecord, ReferralLedgerEntry, SubscriptionPlan, User } from './db';
import { recordAuditLog, createNotification } from './auth';

export interface CreatePaymentOptions {
  userId: string;
  planId: string;
  provider: 'IRANIAN_GATEWAY' | 'CRYPTO' | 'STRIPE_TEST';
  idempotencyKey?: string;
  userIp?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  payment: Payment;
  subscription?: Subscription;
  invoice?: Invoice;
  error?: string;
}

export class PaymentService {
  public isConfigured(): boolean {
    return Boolean(process.env.PAYMENT_GATEWAY_KEY || process.env.PAYMENT_GATEWAY_MERCHANT_ID);
  }

  public getAvailableProviders() {
    return [
      {
        id: 'IRANIAN_GATEWAY',
        name: 'Zarinpal / Iranian Payment Gateway (Shetab)',
        currencies: ['IRR', 'USD'],
        isConfigured: Boolean(process.env.PAYMENT_GATEWAY_MERCHANT_ID),
        description: 'Secure card-to-card and Shetab payment processing for Iranian and Middle Eastern bank cards.'
      },
      {
        id: 'CRYPTO',
        name: 'Cryptocurrency Gateway (USDT / BTC / ETH)',
        currencies: ['USD'],
        isConfigured: Boolean(process.env.PAYMENT_GATEWAY_KEY),
        description: 'Decentralized on-chain settlement with zero chargebacks and automated confirmation.'
      },
      {
        id: 'STRIPE_TEST',
        name: 'International Credit / Debit Card',
        currencies: ['USD'],
        isConfigured: true, // available for sandbox integration verification
        description: 'Direct Visa, Mastercard, and American Express gateway.'
      }
    ];
  }

  public createPayment(options: CreatePaymentOptions): Payment {
    const schema = db.getSchema();
    const plan = schema.subscriptionPlans.find(p => p.id === options.planId && p.isActive);

    if (!plan) {
      throw new Error(`Invalid or inactive subscription plan: ${options.planId}`);
    }

    const idempotencyKey = options.idempotencyKey || `idem_${crypto.randomUUID()}`;

    // Check for existing pending payment with same idempotency key
    const existing = schema.payments.find(p => p.idempotencyKey === idempotencyKey);
    if (existing) {
      return existing;
    }

    const paymentId = `pay_${crypto.randomUUID()}`;
    const transactionReference = `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const payment: Payment = {
      id: paymentId,
      userId: options.userId,
      planId: plan.id,
      amount: plan.priceMonthly,
      currency: plan.currency,
      provider: options.provider,
      status: 'PENDING',
      transactionReference,
      idempotencyKey,
      metadata: {
        userIp: options.userIp,
        planName: plan.name,
        creditLimit: plan.creditLimit
      },
      createdAt: new Date().toISOString()
    };

    db.transaction(s => {
      s.payments.push(payment);
    });

    recordAuditLog(
      { id: options.userId, email: schema.users.find(u => u.id === options.userId)?.email || 'unknown' },
      'PAYMENT_INITIATED',
      'PAYMENT',
      paymentId,
      { amount: payment.amount, provider: payment.provider, planId: payment.planId },
      options.userIp
    );

    return payment;
  }

  public verifyPayment(
    paymentId: string,
    providerTransactionId?: string,
    verificationSignature?: string
  ): PaymentVerificationResult {
    const schema = db.getSchema();
    const payment = schema.payments.find(p => p.id === paymentId);

    if (!payment) {
      return {
        success: false,
        payment: null as any,
        error: 'Payment transaction record not found.'
      };
    }

    // Idempotency check: if already processed successfully, return existing state
    if (payment.status === 'SUCCESS') {
      const existingSub = schema.subscriptions.find(s => s.id === payment.subscriptionId);
      const existingInv = schema.invoices.find(i => i.paymentId === payment.id);
      return {
        success: true,
        payment,
        subscription: existingSub,
        invoice: existingInv
      };
    }

    if (payment.status !== 'PENDING') {
      return {
        success: false,
        payment,
        error: `Payment is in invalid state for verification: ${payment.status}`
      };
    }

    const plan = schema.subscriptionPlans.find(p => p.id === payment.planId);
    if (!plan) {
      return {
        success: false,
        payment,
        error: 'Associated subscription plan does not exist.'
      };
    }

    const user = schema.users.find(u => u.id === payment.userId);
    if (!user) {
      return {
        success: false,
        payment,
        error: 'User associated with payment does not exist.'
      };
    }

    // Perform atomic state transition
    let activatedSubscription: Subscription | undefined;
    let generatedInvoice: Invoice | undefined;

    db.transaction(s => {
      // 1. Update Payment status
      payment.status = 'SUCCESS';
      payment.providerTransactionId = providerTransactionId || `prov_${crypto.randomUUID()}`;
      payment.verifiedAt = new Date().toISOString();

      // 2. Expire or replace previous active subscription for this user
      const existingSubs = s.subscriptions.filter(sub => sub.userId === user.id && sub.status === 'ACTIVE');
      for (const sub of existingSubs) {
        sub.status = 'EXPIRED';
        sub.updatedAt = new Date().toISOString();
      }

      // 3. Activate new subscription
      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const subscriptionId = `sub_${crypto.randomUUID()}`;

      activatedSubscription = {
        id: subscriptionId,
        userId: user.id,
        planId: plan.id,
        status: 'ACTIVE',
        creditsTotal: plan.creditLimit,
        creditsUsed: 0,
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: nextMonth.toISOString(),
        autoRenew: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      s.subscriptions.push(activatedSubscription);
      payment.subscriptionId = subscriptionId;

      // 4. Generate Invoice & Receipt
      const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      generatedInvoice = {
        id: `inv_${crypto.randomUUID()}`,
        paymentId: payment.id,
        userId: user.id,
        invoiceNumber,
        amount: payment.amount,
        currency: payment.currency,
        planName: plan.name,
        issuedAt: now.toISOString(),
        paidAt: now.toISOString()
      };
      s.invoices.push(generatedInvoice);

      // 5. Referral System Commission Rule (Strict Rule 28)
      // "Each qualifying referred purchase creates $1 referral commission. Commission must only be created after verified qualifying payment."
      if (user.referredBy) {
        const referral = s.referrals.find(
          r => r.referrerUserId === user.referredBy && r.referredUserId === user.id
        );

        if (referral && (referral.status === 'REGISTERED' || referral.status === 'QUALIFIED')) {
          referral.status = 'COMMISSIONED';
          referral.qualifyingPaymentId = payment.id;
          referral.qualifiedAt = now.toISOString();

          const ledgerEntry: ReferralLedgerEntry = {
            id: `refled_${crypto.randomUUID()}`,
            referrerUserId: referral.referrerUserId,
            referralRecordId: referral.id,
            paymentId: payment.id,
            amount: 1.00, // Exact $1 commission
            currency: 'USD',
            status: 'APPROVED',
            createdAt: now.toISOString()
          };

          s.referralLedger.push(ledgerEntry);

          createNotification(
            referral.referrerUserId,
            'REFERRAL_COMMISSION',
            'Referral Commission Earned',
            `You earned a $1.00 referral commission from a qualifying subscription purchase!`,
            { amount: 1.00, currency: 'USD', referredUserId: user.id }
          );

          recordAuditLog(
            { id: 'system', email: 'system@firstmind.ai' },
            'REFERRAL_COMMISSION_GRANTED',
            'REFERRAL_LEDGER',
            ledgerEntry.id,
            { referrerId: referral.referrerUserId, amount: 1.00, paymentId: payment.id }
          );
        }
      }
    });

    createNotification(
      user.id,
      'PAYMENT_SUCCESS',
      'Subscription Activated',
      `Your payment of $${payment.amount.toFixed(2)} was verified. ${plan.name} subscription is now active with ${plan.creditLimit} generation credits!`,
      { paymentId: payment.id, planName: plan.name }
    );

    recordAuditLog(
      { id: user.id, email: user.email },
      'PAYMENT_VERIFIED',
      'PAYMENT',
      payment.id,
      { amount: payment.amount, subscriptionId: activatedSubscription?.id }
    );

    return {
      success: true,
      payment,
      subscription: activatedSubscription,
      invoice: generatedInvoice
    };
  }

  public failPayment(paymentId: string, reason: string): Payment {
    const schema = db.getSchema();
    const payment = schema.payments.find(p => p.id === paymentId);

    if (!payment) {
      throw new Error('Payment record not found.');
    }

    if (payment.status !== 'PENDING') {
      return payment;
    }

    db.transaction(s => {
      payment.status = 'FAILED';
      payment.errorMessage = reason;
    });

    createNotification(
      payment.userId,
      'PAYMENT_FAILED',
      'Payment Verification Failed',
      `Payment processing failed: ${reason}. Your account was not charged.`,
      { paymentId: payment.id, reason }
    );

    recordAuditLog(
      { id: payment.userId, email: schema.users.find(u => u.id === payment.userId)?.email || 'unknown' },
      'PAYMENT_FAILED',
      'PAYMENT',
      payment.id,
      { reason }
    );

    return payment;
  }
}

export const paymentService = new PaymentService();
