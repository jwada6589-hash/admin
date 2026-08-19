import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Doc } from '../_generated/dataModel';

type DbCtx = QueryCtx | MutationCtx;

export async function requireUser(ctx: DbCtx, tokenHash: string): Promise<Doc<'users'>> {
  const session = await ctx.db
    .query('userSessions')
    .withIndex('by_token_hash', (q) => q.eq('tokenHash', tokenHash))
    .unique();
  if (!session || session.expiresAt <= Date.now()) throw new Error('UNAUTHENTICATED');
  const user = await ctx.db.get(session.userId);
  if (!user || user.isDeleted) throw new Error('UNAUTHENTICATED');
  return user;
}

export async function optionalUser(ctx: DbCtx, tokenHash?: string): Promise<Doc<'users'> | null> {
  if (!tokenHash) return null;
  try {
    return await requireUser(ctx, tokenHash);
  } catch {
    return null;
  }
}

export async function requireAdmin(ctx: DbCtx, tokenHash: string): Promise<Doc<'adminUsers'>> {
  const session = await ctx.db
    .query('adminSessions')
    .withIndex('by_token_hash', (q) => q.eq('tokenHash', tokenHash))
    .unique();
  if (!session || session.expiresAt <= Date.now()) throw new Error('ADMIN_UNAUTHENTICATED');
  const admin = await ctx.db.get(session.adminId);
  if (!admin || !admin.isActive) throw new Error('ADMIN_UNAUTHENTICATED');
  return admin;
}
