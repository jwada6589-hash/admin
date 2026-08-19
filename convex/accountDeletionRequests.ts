import { internalMutation, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { requireAdmin, requireUser } from './lib/auth';

export const mine = query({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const user = await requireUser(ctx, tokenHash);
    const requests = await ctx.db.query('accountDeletionRequests').withIndex('by_user', (q) => q.eq('userId', user._id)).order('desc').collect();
    const latest = requests[0];
    return latest ? { id: latest._id, status: latest.status, requestedAt: latest.requestedAt } : null;
  },
});

export const request = mutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const user = await requireUser(ctx, tokenHash);
    const requests = await ctx.db.query('accountDeletionRequests').withIndex('by_user', (q) => q.eq('userId', user._id)).order('desc').collect();
    const active = requests.find((item) => item.status === 'PENDING' || item.status === 'APPROVED');
    if (active) return { requestId: active._id, status: active.status, duplicate: true };
    const requestId = await ctx.db.insert('accountDeletionRequests', {
      userId: user._id,
      userName: user.fullName,
      phone: user.phone,
      status: 'PENDING',
      requestedAt: Date.now(),
    });
    return { requestId, status: 'PENDING' as const, duplicate: false };
  },
});

export const adminList = query({
  args: { adminTokenHash: v.string() },
  handler: async (ctx, { adminTokenHash }) => {
    await requireAdmin(ctx, adminTokenHash);
    return (await ctx.db.query('accountDeletionRequests').order('desc').collect()).map((item) => ({
      id: item._id,
      userName: item.userName,
      phone: item.phone,
      status: item.status,
      requestedAt: item.requestedAt,
      reviewedAt: item.reviewedAt,
      completedAt: item.completedAt,
    }));
  },
});

export const purgeCompleted = mutation({
  args: { adminTokenHash: v.string() },
  handler: async (ctx, { adminTokenHash }) => {
    await requireAdmin(ctx, adminTokenHash);
    const completed = await ctx.db
      .query('accountDeletionRequests')
      .filter((q) => q.eq(q.field('status'), 'COMPLETED'))
      .collect();
    for (const request of completed) await ctx.db.delete(request._id);
    return { deleted: completed.length };
  },
});

export const approve = mutation({
  args: { adminTokenHash: v.string(), requestId: v.id('accountDeletionRequests') },
  handler: async (ctx, { adminTokenHash, requestId }) => {
    const admin = await requireAdmin(ctx, adminTokenHash);
    const request = await ctx.db.get(requestId);
    if (!request) throw new Error('REQUEST_NOT_FOUND');
    if (request.status === 'COMPLETED' || request.status === 'APPROVED') return { status: request.status, duplicate: true };
    if (request.status !== 'PENDING') throw new Error('REQUEST_NOT_PENDING');
    await ctx.db.patch(requestId, { status: 'APPROVED', reviewedAt: Date.now(), reviewedBy: admin._id });
    await ctx.scheduler.runAfter(1500, internal.accountDeletionRequests.completeDeletion, { requestId });
    return { status: 'APPROVED' as const, duplicate: false };
  },
});

export const reject = mutation({
  args: { adminTokenHash: v.string(), requestId: v.id('accountDeletionRequests') },
  handler: async (ctx, { adminTokenHash, requestId }) => {
    const admin = await requireAdmin(ctx, adminTokenHash);
    const request = await ctx.db.get(requestId);
    if (!request) throw new Error('REQUEST_NOT_FOUND');
    if (request.status === 'REJECTED') return { status: 'REJECTED' as const, duplicate: true };
    if (request.status !== 'PENDING') throw new Error('REQUEST_NOT_PENDING');
    await ctx.db.patch(requestId, { status: 'REJECTED', reviewedAt: Date.now(), reviewedBy: admin._id });
    return { status: 'REJECTED' as const, duplicate: false };
  },
});

export const completeDeletion = internalMutation({
  args: { requestId: v.id('accountDeletionRequests') },
  handler: async (ctx, { requestId }) => {
    const request = await ctx.db.get(requestId);
    if (!request || request.status === 'COMPLETED') return { completed: false, duplicate: true };
    if (request.status !== 'APPROVED') return { completed: false, duplicate: false };

    const user = await ctx.db.get(request.userId);
    if (user && !user.isDeleted) {
      const [sessions, favorites, wallets, transactions, redemptions] = await Promise.all([
        ctx.db.query('userSessions').withIndex('by_user', (q) => q.eq('userId', user._id)).collect(),
        ctx.db.query('favorites').withIndex('by_user', (q) => q.eq('userId', user._id)).collect(),
        ctx.db.query('wallets').withIndex('by_user', (q) => q.eq('userId', user._id)).collect(),
        ctx.db.query('walletTransactions').withIndex('by_user', (q) => q.eq('userId', user._id)).collect(),
        ctx.db.query('redemptions').withIndex('by_user', (q) => q.eq('userId', user._id)).collect(),
      ]);
      for (const document of [...sessions, ...favorites, ...wallets, ...transactions]) await ctx.db.delete(document._id);
      for (const redemption of redemptions) await ctx.db.patch(redemption._id, { customerName: 'حساب محذوف', phone: '', updatedAt: Date.now() });
      await ctx.db.patch(user._id, {
        fullName: 'حساب محذوف',
        phone: `deleted-${user._id}`,
        passwordHash: 'deleted',
        address: '',
        landmark: '',
        notes: '',
        isDeleted: true,
        updatedAt: Date.now(),
      });
    }
    // The request is no longer useful after the account deletion has completed.
    // Removing it also makes its card disappear from the reactive admin list.
    await ctx.db.delete(requestId);
    return { completed: true, duplicate: false };
  },
});
