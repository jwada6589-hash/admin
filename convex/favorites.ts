import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireUser } from './lib/auth';

export const list = query({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const user = await requireUser(ctx, tokenHash);
    return (await ctx.db.query('favorites').withIndex('by_user', (q) => q.eq('userId', user._id)).collect()).map((x) => x.productId);
  },
});

export const toggle = mutation({
  args: { tokenHash: v.string(), productId: v.id('products') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.tokenHash);
    const existing = await ctx.db.query('favorites').withIndex('by_user_product', (q) => q.eq('userId', user._id).eq('productId', args.productId)).unique();
    if (existing) { await ctx.db.delete(existing._id); return false; }
    await ctx.db.insert('favorites', { userId: user._id, productId: args.productId, createdAt: Date.now() });
    return true;
  },
});
