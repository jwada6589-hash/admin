import { query } from './_generated/server';
import { v } from 'convex/values';
import { requireUser } from './lib/auth';

export const get = query({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const user = await requireUser(ctx, tokenHash);
    const wallet = await ctx.db.query('wallets').withIndex('by_user', (q) => q.eq('userId', user._id)).unique();
    const transactions = await ctx.db.query('walletTransactions').withIndex('by_user', (q) => q.eq('userId', user._id)).order('desc').collect();
    return {
      wallet: { balance: wallet?.balance ?? 0, totalEarned: wallet?.totalEarned ?? 0 },
      transactions: transactions.map((x) => ({ id: x._id, type: x.type, amount: x.amount, orderId: x.orderId, description: x.description, createdAt: new Date(x.createdAt).toISOString() })),
    };
  },
});
