import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, User, Session, AuditLog, Notification } from './db';

export interface AuthenticatedRequest extends Request {
  user?: User;
  sessionToken?: string;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createSession(userId: string, req: Request): Session {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';
  const ua = req.headers['user-agent'] || 'unknown';

  const session: Session = {
    id: `sess_${crypto.randomUUID()}`,
    userId,
    token,
    ipAddress: ip,
    userAgent: ua,
    expiresAt,
    createdAt: new Date().toISOString()
  };

  db.transaction(schema => {
    schema.sessions.push(session);
  });

  return session;
}

export function recordAuditLog(
  actor: { id: string; email: string },
  action: string,
  entity: string,
  entityId: string,
  metadata?: Record<string, any>,
  ipAddress?: string
) {
  const log: AuditLog = {
    id: `audit_${crypto.randomUUID()}`,
    actorId: actor.id,
    actorEmail: actor.email,
    action,
    entity,
    entityId,
    ipAddress,
    metadata,
    timestamp: new Date().toISOString()
  };

  db.transaction(schema => {
    schema.auditLogs.unshift(log);
    // Keep max 2000 logs in memory
    if (schema.auditLogs.length > 2000) {
      schema.auditLogs = schema.auditLogs.slice(0, 2000);
    }
  });
}

export function createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  data?: Record<string, any>
) {
  const notif: Notification = {
    id: `notif_${crypto.randomUUID()}`,
    userId,
    type,
    title,
    message,
    isRead: false,
    data,
    createdAt: new Date().toISOString()
  };

  db.transaction(schema => {
    schema.notifications.unshift(notif);
    if (schema.notifications.length > 2000) {
      schema.notifications = schema.notifications.slice(0, 2000);
    }
  });
}

export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return next();
  }

  const schema = db.getSchema();
  const session = schema.sessions.find(s => s.token === token && new Date(s.expiresAt) > new Date());

  if (!session) {
    return next();
  }

  const user = schema.users.find(u => u.id === session.userId && u.status === 'ACTIVE');
  if (user) {
    req.user = user;
    req.sessionToken = token;
  }

  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication is required to access this resource.',
        requestId: crypto.randomUUID()
      }
    });
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Administrator authorization required. Access denied.',
        requestId: crypto.randomUUID()
      }
    });
  }
  next();
}
