import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, requireAuth } from '../auth';

export const referralsRouter = Router();

// GET /api/referrals
referralsRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const schema = db.getSchema();

  // User's referrals
  const referrals = schema.referrals
    .filter(r => r.referrerUserId === userId)
    .map(r => {
      const referredUser = schema.users.find(u => u.id === r.referredUserId);
      return {
        id: r.id,
        referredUserName: referredUser ? referredUser.name : 'Registered User',
        referredUserEmail: referredUser ? referredUser.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '***',
        status: r.status,
        commissionAmount: r.commissionAmount,
        currency: r.currency,
        createdAt: r.createdAt,
        qualifiedAt: r.qualifiedAt
      };
    });

  // Approved commission records in ledger
  const ledgerEntries = schema.referralLedger
    .filter(l => l.referrerUserId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalEarnings = ledgerEntries
    .filter(l => l.status === 'APPROVED' || l.status === 'PAID')
    .reduce((sum, item) => sum + item.amount, 0);

  // Current month earnings based on server-side time
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyEarnings = ledgerEntries
    .filter(l => {
      const d = new Date(l.createdAt);
      return (l.status === 'APPROVED' || l.status === 'PAID') && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, item) => sum + item.amount, 0);

  // Compute user position in global leaderboard
  const earningsByUser: Record<string, number> = {};
  for (const entry of schema.referralLedger) {
    if (entry.status === 'APPROVED' || entry.status === 'PAID') {
      earningsByUser[entry.referrerUserId] = (earningsByUser[entry.referrerUserId] || 0) + entry.amount;
    }
  }

  const sortedLeaderboard = Object.entries(earningsByUser)
    .sort(([, a], [, b]) => b - a);

  const rankIndex = sortedLeaderboard.findIndex(([id]) => id === userId);
  const leaderboardRank = rankIndex !== -1 ? rankIndex + 1 : null;

  return res.json({
    success: true,
    data: {
      referralCode: req.user!.referralCode,
      referralLink: `${process.env.APP_URL || 'https://firstmind.ai'}?ref=${req.user!.referralCode}`,
      stats: {
        totalReferrals: referrals.length,
        qualifiedReferrals: referrals.filter(r => r.status === 'COMMISSIONED').length,
        pendingReferrals: referrals.filter(r => r.status === 'REGISTERED').length,
        totalEarnings,
        monthlyEarnings,
        leaderboardRank
      },
      referrals,
      ledgerEntries
    }
  });
});

// GET /api/referrals/leaderboard
// Strict Rule 29: Calculate strictly from real referral data. Never hardcode rankings!
referralsRouter.get('/leaderboard', (req, res) => {
  const schema = db.getSchema();
  const { period = 'global' } = req.query;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const earningsMap: Record<string, { earnings: number; count: number }> = {};

  for (const entry of schema.referralLedger) {
    if (entry.status !== 'APPROVED' && entry.status !== 'PAID') continue;

    if (period === 'monthly') {
      const d = new Date(entry.createdAt);
      if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) {
        continue;
      }
    }

    if (!earningsMap[entry.referrerUserId]) {
      earningsMap[entry.referrerUserId] = { earnings: 0, count: 0 };
    }
    earningsMap[entry.referrerUserId].earnings += entry.amount;
    earningsMap[entry.referrerUserId].count += 1;
  }

  const leaderboard = Object.entries(earningsMap)
    .map(([userId, stats]) => {
      const user = schema.users.find(u => u.id === userId);
      return {
        userId,
        userName: user ? user.name : 'Creator',
        referralCode: user ? user.referralCode : 'FM-XXXX',
        earnings: stats.earnings,
        referralsCount: stats.count
      };
    })
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 20);

  return res.json({
    success: true,
    data: {
      period,
      calculatedAt: new Date().toISOString(),
      leaderboard // Will be empty array if no referral data exists, as mandated by Rule 4 & 29!
    }
  });
});
