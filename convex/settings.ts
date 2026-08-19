import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireAdmin } from './lib/auth';

export const get = query({
  args: {},
  handler: async (ctx) => await ctx.db.query('storeSettings').withIndex('by_key', (q) => q.eq('key', 'main')).unique(),
});

export const update = mutation({
  args: {
    adminTokenHash: v.string(), storeName: v.string(), storeSubtitle: v.string(), whatsappNumber: v.string(),
    whatsappEnabled: v.boolean(), whatsappButtonText: v.string(), whatsappDefaultMessage: v.string(), deliveryFee: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminTokenHash);
    if (args.deliveryFee < 0) throw new Error('INVALID_DELIVERY_FEE');
    const current = await ctx.db.query('storeSettings').withIndex('by_key', (q) => q.eq('key', 'main')).unique();
    const value = { key: 'main', storeName: args.storeName, storeSubtitle: args.storeSubtitle, whatsappNumber: args.whatsappNumber, whatsappEnabled: args.whatsappEnabled, whatsappButtonText: args.whatsappButtonText, whatsappDefaultMessage: args.whatsappDefaultMessage, deliveryFee: args.deliveryFee, updatedAt: Date.now() };
    if (current) await ctx.db.replace(current._id, value); else await ctx.db.insert('storeSettings', value);
  },
});
