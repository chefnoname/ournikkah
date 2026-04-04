import { and, eq, gt } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import { db } from '../db';
import { guestTokens, users, workspaceMembers } from '../db/schema';

// Extend Express Request to include our auth fields
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string } | null;
      guestWorkspaceId?: number | null;
    }
  }
}

/**
 * Resolve authentication from session (registered user) or X-Guest-Token header.
 * Always runs — attaches req.user and/or req.guestWorkspaceId.
 */
export async function resolveAuth(req: Request, _res: Response, next: NextFunction) {
  req.user = null;
  req.guestWorkspaceId = null;

  // Check session-based auth (registered user)
  const userId = (req.session as any)?.userId as number | undefined;
  if (userId) {
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (user) {
      req.user = user;
    }
  }

  // Check guest token header
  const guestToken = req.headers['x-guest-token'] as string | undefined;
  if (guestToken) {
    const [token] = await db
      .select({ workspaceId: guestTokens.workspaceId })
      .from(guestTokens)
      .where(
        and(
          eq(guestTokens.token, guestToken),
          gt(guestTokens.expiresAt, new Date())
        )
      )
      .limit(1);
    if (token) {
      req.guestWorkspaceId = token.workspaceId;
    }
  }

  next();
}

/**
 * Require at least one form of auth (user or guest).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user && !req.guestWorkspaceId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  next();
}

/**
 * Require a registered user (no guests).
 */
export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ message: 'User authentication required' });
    return;
  }
  next();
}

/**
 * Require access to the workspace specified by :id param.
 * Access is granted if:
 *  - Guest token maps to that workspace, OR
 *  - User is a member of that workspace
 */
export async function requireWorkspaceAccess(req: Request, res: Response, next: NextFunction) {
  const workspaceId = parseInt(String(req.params.id), 10);
  if (isNaN(workspaceId)) {
    res.status(400).json({ message: 'Invalid workspace ID' });
    return;
  }

  // Guest token access
  if (req.guestWorkspaceId === workspaceId) {
    next();
    return;
  }

  // Registered user membership access
  if (req.user) {
    const [member] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, req.user.id)
        )
      )
      .limit(1);
    if (member) {
      next();
      return;
    }
  }

  res.status(403).json({ message: 'Access denied to this workspace' });
}
