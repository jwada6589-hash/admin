'use node';

import { action } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const normalizePhone = (phone: string) => phone.replace(/\s+/g, '').trim();
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const makeToken = () => randomBytes(32).toString('base64url');
const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
};
const verifyPassword = (password: string, encoded: string) => {
  const [algorithm, salt, expectedHex] = encoded.split('$');
  if (algorithm !== 'scrypt' || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

export const register = action({
  args: {
    fullName: v.string(), phone: v.string(), password: v.string(),
    address: v.string(), landmark: v.string(),
  },
  handler: async (ctx, args) => {
    const phone = normalizePhone(args.phone);
    if (!/^07\d{9}$/.test(phone)) throw new Error('INVALID_PHONE');
    if (args.password.length < 8) throw new Error('WEAK_PASSWORD');
    const existing = await ctx.runQuery(internal.authInternal.findUserByPhone, { phone });
    if (existing) throw new Error('PHONE_ALREADY_EXISTS');
    const token = makeToken();
    const expiresAt = Date.now() + SESSION_MS;
    const result = await ctx.runMutation(internal.authInternal.createUserAndSession, {
      fullName: args.fullName.trim(), phone, passwordHash: hashPassword(args.password),
      address: args.address.trim(), landmark: args.landmark.trim(),
      tokenHash: hashToken(token), expiresAt,
    });
    return { tokenHash: hashToken(token), expiresAt, userId: result.userId };
  },
});

export const login = action({
  args: { phone: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const phone = normalizePhone(args.phone);
    const user = await ctx.runQuery(internal.authInternal.findUserByPhone, { phone });
    if (!user || user.isDeleted || !verifyPassword(args.password, user.passwordHash)) throw new Error('INVALID_CREDENTIALS');
    const token = makeToken();
    const tokenHash = hashToken(token);
    const expiresAt = Date.now() + SESSION_MS;
    await ctx.runMutation(internal.authInternal.createUserSession, {
      userId: user._id, tokenHash, expiresAt,
    });
    return { tokenHash, expiresAt, userId: user._id };
  },
});

export const bootstrapAdmin = action({
  args: { setupSecret: v.string(), name: v.string(), phone: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    if (!process.env.ADMIN_SETUP_SECRET || args.setupSecret !== process.env.ADMIN_SETUP_SECRET) throw new Error('INVALID_SETUP_SECRET');
    if (args.password.length < 4) throw new Error('WEAK_PASSWORD');
    if ((await ctx.runQuery(internal.authInternal.countAdmins, {})) > 0) throw new Error('ADMIN_ALREADY_EXISTS');
    return await ctx.runMutation(internal.authInternal.createAdmin, {
      name: args.name.trim(), phone: normalizePhone(args.phone), passwordHash: hashPassword(args.password),
    });
  },
});

export const adminLogin = action({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.authInternal.findActiveAdmin, {});
    if (!admin || !admin.isActive || !verifyPassword(args.password, admin.passwordHash)) throw new Error('INVALID_CREDENTIALS');
    const token = makeToken();
    const tokenHash = hashToken(token);
    const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
    await ctx.runMutation(internal.authInternal.createAdminSession, {
      adminId: admin._id, tokenHash, expiresAt,
    });
    return { tokenHash, expiresAt, adminId: admin._id, name: admin.name };
  },
});
