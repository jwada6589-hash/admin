import { internalMutation } from './_generated/server';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const removeExpiredRecords = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cancelledGiftCutoff = now - DAY;
    const deliveredOrderCutoff = now - 10 * DAY;

    const cancelledRedemptions = await ctx.db
      .query('redemptions')
      .withIndex('by_status', (q) => q.eq('status', 'CANCELLED'))
      .collect();
    const deliveredOrders = await ctx.db
      .query('orders')
      .withIndex('by_status', (q) => q.eq('status', 'DELIVERED'))
      .collect();

    let deletedRedemptions = 0;
    let deletedOrders = 0;
    for (const redemption of cancelledRedemptions) {
      if (redemption.updatedAt <= cancelledGiftCutoff) {
        await ctx.db.delete(redemption._id);
        deletedRedemptions += 1;
      }
    }
    for (const order of deliveredOrders) {
      if (order.updatedAt <= deliveredOrderCutoff) {
        await ctx.db.delete(order._id);
        deletedOrders += 1;
      }
    }
    return { deletedRedemptions, deletedOrders };
  },
});

const legacyBanners = [
  ['daily-offers', 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=400&h=400'],
  ['fresh-produce', 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=400&h=400'],
  ['personal-care', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400&h=400'],
  ['bakery', 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&q=80&w=400&h=400'],
] as const;

export const seedLegacyBanners = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('banners').collect();
    let inserted = 0;
    for (const [index, [legacyKey, externalImageUrl]] of legacyBanners.entries()) {
      if (existing.some((banner) => banner.legacyKey === legacyKey)) continue;
      await ctx.db.insert('banners', {
        legacyKey,
        externalImageUrl,
        sortOrder: index - legacyBanners.length,
        createdAt: Date.now(),
      });
      inserted += 1;
    }
    return { inserted };
  },
});
