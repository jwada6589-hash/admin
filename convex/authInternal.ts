import { internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';

export const findUserByPhone = internalQuery({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) =>
    await ctx.db.query('users').withIndex('by_phone', (q) => q.eq('phone', phone)).unique(),
});

export const createUserAndSession = internalMutation({
  args: {
    fullName: v.string(), phone: v.string(), passwordHash: v.string(), address: v.string(),
    landmark: v.string(), tokenHash: v.string(), expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('users').withIndex('by_phone', (q) => q.eq('phone', args.phone)).unique();
    if (existing) throw new Error('PHONE_ALREADY_EXISTS');
    const now = Date.now();
    const userId = await ctx.db.insert('users', {
      fullName: args.fullName, phone: args.phone, passwordHash: args.passwordHash,
      address: args.address, landmark: args.landmark, notes: '', isDeleted: false,
      createdAt: now, updatedAt: now,
    });
    await ctx.db.insert('wallets', { userId, balance: 0, totalEarned: 0, updatedAt: now });
    await ctx.db.insert('userSessions', { userId, tokenHash: args.tokenHash, expiresAt: args.expiresAt, createdAt: now });
    return { userId };
  },
});

export const createUserSession = internalMutation({
  args: { userId: v.id('users'), tokenHash: v.string(), expiresAt: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.insert('userSessions', { ...args, createdAt: Date.now() });
  },
});

export const findAdminByPhone = internalQuery({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) =>
    await ctx.db.query('adminUsers').withIndex('by_phone', (q) => q.eq('phone', phone)).unique(),
});

export const findActiveAdmin = internalQuery({
  args: {},
  handler: async (ctx) => (await ctx.db.query('adminUsers').collect()).find((admin) => admin.isActive) ?? null,
});

export const countAdmins = internalQuery({
  args: {},
  handler: async (ctx) => (await ctx.db.query('adminUsers').collect()).length,
});

export const createAdmin = internalMutation({
  args: { name: v.string(), phone: v.string(), passwordHash: v.string() },
  handler: async (ctx, args) => {
    if ((await ctx.db.query('adminUsers').collect()).length > 0) throw new Error('ADMIN_ALREADY_EXISTS');
    const now = Date.now();
    return await ctx.db.insert('adminUsers', { ...args, isActive: true, createdAt: now, updatedAt: now });
  },
});

export const createAdminSession = internalMutation({
  args: { adminId: v.id('adminUsers'), tokenHash: v.string(), expiresAt: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.insert('adminSessions', { ...args, createdAt: Date.now() });
  },
});
