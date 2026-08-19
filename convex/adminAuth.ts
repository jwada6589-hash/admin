import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireAdmin } from './lib/auth';

export const me = query({
  args: { adminTokenHash: v.string() },
  handler: async (ctx, { adminTokenHash }) => {
    const admin = await requireAdmin(ctx, adminTokenHash);
    return { id: admin._id, name: admin.name, phone: admin.phone };
  },
});

export const logout = mutation({
  args: { adminTokenHash: v.string() },
  handler: async (ctx, { adminTokenHash }) => {
    const session = await ctx.db.query('adminSessions').withIndex('by_token_hash', (q) => q.eq('tokenHash', adminTokenHash)).unique();
    if (session) await ctx.db.delete(session._id);
  },
});
