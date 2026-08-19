import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireAdmin, requireUser } from './lib/auth';

export const list = query({
  args: {},
  handler: async (ctx) => await Promise.all((await ctx.db.query('gifts').collect()).map(async (g) => ({
    id: g._id, name: g.name, description: g.description, image: g.imageStorageId ? await ctx.storage.getUrl(g.imageStorageId) : null,
    requiredBalance: g.requiredBalance, stock: g.stock, isActive: g.isActive,
  }))),
});

export const mine = query({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const user = await requireUser(ctx, tokenHash);
    return (await ctx.db.query('redemptions').withIndex('by_user', (q) => q.eq('userId', user._id)).order('desc').collect()).map((r) => ({
      id: r._id, giftId: r.giftId, giftName: r.giftName, pointsUsed: r.pointsUsed, status: r.status, createdAt: new Date(r.createdAt).toISOString(),
    }));
  },
});

export const redeem = mutation({
  args: { tokenHash: v.string(), giftId: v.id('gifts'), idempotencyKey: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.tokenHash);
    const duplicate = await ctx.db.query('redemptions').withIndex('by_idempotency', (q) => q.eq('userId', user._id).eq('idempotencyKey', args.idempotencyKey)).unique();
    if (duplicate) return { redemptionId: duplicate._id, duplicate: true };
    const gift = await ctx.db.get(args.giftId);
    if (!gift || !gift.isActive) throw new Error('GIFT_UNAVAILABLE');
    if (gift.stock <= 0) throw new Error('OUT_OF_STOCK');
    const wallet = await ctx.db.query('wallets').withIndex('by_user', (q) => q.eq('userId', user._id)).unique();
    if (!wallet || wallet.balance < gift.requiredBalance) throw new Error('INSUFFICIENT_BALANCE');
    const now = Date.now();
    const requestNumber = `GFT-${now.toString(36).toUpperCase()}`;
    const redemptionId = await ctx.db.insert('redemptions', {
      requestNumber, userId: user._id, giftId: gift._id, giftName: gift.name,
      customerName: user.fullName, phone: user.phone, pointsUsed: gift.requiredBalance,
      status: 'PENDING', idempotencyKey: args.idempotencyKey, refunded: false, createdAt: now, updatedAt: now,
    });
    await ctx.db.patch(wallet._id, { balance: wallet.balance - gift.requiredBalance, updatedAt: now });
    await ctx.db.patch(gift._id, { stock: gift.stock - 1, redemptionCount: gift.redemptionCount + 1, updatedAt: now });
    await ctx.db.insert('walletTransactions', { userId: user._id, type: 'REDEEM', amount: gift.requiredBalance, redemptionId, description: `استبدال هدية: ${gift.name}`, createdAt: now });
    return { redemptionId, duplicate: false };
  },
});

export const adminListRedemptions = query({
  args: { adminTokenHash: v.string() },
  handler: async (ctx, { adminTokenHash }) => {
    await requireAdmin(ctx, adminTokenHash);
    return (await ctx.db.query('redemptions').order('desc').collect()).map((r) => ({ id: r._id, requestNumber: r.requestNumber, customerName: r.customerName, phone: r.phone, giftName: r.giftName, usedBalance: r.pointsUsed, createdAt: new Date(r.createdAt).toISOString(), status: r.status }));
  },
});

export const updateRedemptionStatus = mutation({
  args: { adminTokenHash: v.string(), redemptionId: v.id('redemptions'), status: v.union(v.literal('PENDING'), v.literal('APPROVED'), v.literal('RECEIVED'), v.literal('CANCELLED')) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminTokenHash);
    const redemption = await ctx.db.get(args.redemptionId);
    if (!redemption) throw new Error('REDEMPTION_NOT_FOUND');
    if (redemption.status === 'RECEIVED' && args.status !== 'RECEIVED') throw new Error('RECEIVED_IS_FINAL');
    const now = Date.now();
    if (args.status === 'CANCELLED' && !redemption.refunded) {
      const wallet = await ctx.db.query('wallets').withIndex('by_user', (q) => q.eq('userId', redemption.userId)).unique();
      const gift = await ctx.db.get(redemption.giftId);
      if (wallet) await ctx.db.patch(wallet._id, { balance: wallet.balance + redemption.pointsUsed, updatedAt: now });
      if (gift) await ctx.db.patch(gift._id, { stock: gift.stock + 1, updatedAt: now });
      await ctx.db.insert('walletTransactions', { userId: redemption.userId, type: 'REFUND', amount: redemption.pointsUsed, redemptionId: redemption._id, description: `إعادة رصيد إلغاء الهدية: ${redemption.giftName}`, createdAt: now });
      await ctx.db.patch(redemption._id, { status: args.status, refunded: true, updatedAt: now });
      return;
    }
    await ctx.db.patch(redemption._id, { status: args.status, updatedAt: now });
  },
});
