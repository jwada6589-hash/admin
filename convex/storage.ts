import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { requireAdmin } from './lib/auth';

export const generateUploadUrl = mutation({
  args: { adminTokenHash: v.string() },
  handler: async (ctx, { adminTokenHash }) => {
    await requireAdmin(ctx, adminTokenHash);
    return await ctx.storage.generateUploadUrl();
  },
});

export const remove = mutation({
  args: { adminTokenHash: v.string(), storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminTokenHash);
    await ctx.storage.delete(args.storageId);
  },
});
