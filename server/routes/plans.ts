import { Router, Request, Response } from 'express';
import { db } from '../db';

export const plansRouter = Router();

// GET /api/plans
plansRouter.get('/', (req: Request, res: Response) => {
  const schema = db.getSchema();
  const activePlans = schema.subscriptionPlans.filter(p => p.isActive);
  return res.json({
    success: true,
    data: activePlans
  });
});
