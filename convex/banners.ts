import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireAdmin } from './lib/auth';

export const active = query({
  args: {},
  handler: async (ctx) => {
    const banners = await ctx.db.query('banners').withIndex('by_sort_order').collect();
    return await Promise.all(
      banners.map(async (banner) => ({
        id: banner._id,
        imageUrl: await ctx.storage.getUrl(banner.imageStorageId),
        sortOrder: banner.sortOrder,
      })),
    );
  },
});

export const list = query({
  args: { adminTokenHash: v.string() },
  handler: async (ctx, { adminTokenHash }) => {
    await requireAdmin(ctx, adminTokenHash);
    const banners = await ctx.db.query('banners').withIndex('by_sort_order').collect();
    return await Promise.all(
      banners.map(async (banner) => ({
        id: banner._id,
        imageUrl: await ctx.storage.getUrl(banner.imageStorageId),
        sortOrder: banner.sortOrder,
      })),
    );
  },
});

export const add = mutation({
  args: { adminTokenHash: v.string(), imageStorageId: v.id('_storage') },
  handler: async (ctx, { adminTokenHash, imageStorageId }) => {
    await requireAdmin(ctx, adminTokenHash);
    const banners = await ctx.db.query('banners').collect();
    const sortOrder = banners.reduce((highest, banner) => Math.max(highest, banner.sortOrder), 0) + 1;
    return await ctx.db.insert('banners', {
      imageStorageId,
      sortOrder,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { adminTokenHash: v.string(), id: v.id('banners') },
  handler: async (ctx, { adminTokenHash, id }) => {
    await requireAdmin(ctx, adminTokenHash);
    const banner = await ctx.db.get(id);
    if (!banner) return;
    await ctx.storage.delete(banner.imageStorageId);
    await ctx.db.delete(id);
  },
});
