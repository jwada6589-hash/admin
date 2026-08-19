import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireUser } from './lib/auth';

export const me = query({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const user = await requireUser(ctx, tokenHash);
    return { id: user._id, fullName: user.fullName, phone: user.phone, address: user.address, landmark: user.landmark, notes: user.notes ?? '' };
  },
});

export const updateProfile = mutation({
  args: { tokenHash: v.string(), fullName: v.string(), address: v.string(), landmark: v.string(), notes: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.tokenHash);
    await ctx.db.patch(user._id, { fullName: args.fullName.trim(), address: args.address.trim(), landmark: args.landmark.trim(), notes: args.notes.trim(), updatedAt: Date.now() });
  },
});

export const logout = mutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const session = await ctx.db.query('userSessions').withIndex('by_token_hash', (q) => q.eq('tokenHash', tokenHash)).unique();
    if (session) await ctx.db.delete(session._id);
  },
});

export const deleteAccount = mutation({
  args: { tokenHash: v.string(), confirmation: v.string() },
  handler: async (ctx, args) => {
    if (args.confirmation !== 'DELETE') throw new Error('CONFIRMATION_REQUIRED');
    const user = await requireUser(ctx, args.tokenHash);
    await ctx.db.patch(user._id, {
      fullName: 'حساب محذوف', phone: `deleted-${user._id}`, passwordHash: 'deleted',
      address: '', landmark: '', notes: '', isDeleted: true, updatedAt: Date.now(),
    });
    const sessions = await ctx.db.query('userSessions').withIndex('by_user', (q) => q.eq('userId', user._id)).collect();
    const favorites = await ctx.db.query('favorites').withIndex('by_user', (q) => q.eq('userId', user._id)).collect();
    await Promise.all([...sessions, ...favorites].map((doc) => ctx.db.delete(doc._id)));
  },
});
