import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireAdmin, requireUser } from './lib/auth';

const statusValidator = v.union(v.literal('NEW'), v.literal('ACCEPTED'), v.literal('PREPARING'), v.literal('WITH_COURIER'), v.literal('DELIVERED'), v.literal('REJECTED'));

export const create = mutation({
  args: {
    tokenHash: v.string(),
    customer: v.object({ fullName: v.string(), phone: v.string(), address: v.string(), landmark: v.string(), notes: v.optional(v.string()) }),
    items: v.array(v.object({ productId: v.id('products'), selectedOptions: v.array(v.object({ name: v.string(), value: v.string() })), quantity: v.number() })),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.tokenHash);
    if (!args.items.length) throw new Error('EMPTY_CART');
    const now = Date.now();
    const settings = await ctx.db.query('storeSettings').withIndex('by_key', (q) => q.eq('key', 'main')).unique();
    if (!settings) throw new Error('SETTINGS_NOT_CONFIGURED');
    const snapshot = [];
    let subtotal = 0;
    for (const item of args.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 100) throw new Error('INVALID_QUANTITY');
      const product = await ctx.db.get(item.productId);
      if (!product || !product.isActive) throw new Error('PRODUCT_UNAVAILABLE');
      const offers = await ctx.db.query('offers').withIndex('by_product', (q) => q.eq('productId', product._id)).collect();
      const offer = offers.find((o) => o.isEnabled && o.startAt <= now && o.endAt >= now);
      const unitPrice = offer?.offerPrice ?? product.price;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      snapshot.push({
        productId: product._id, productName: product.name,
        imageUrl: product.imageStorageId ? await ctx.storage.getUrl(product.imageStorageId) ?? undefined : undefined,
        size: product.size, selectedOptions: item.selectedOptions, quantity: item.quantity,
        originalUnitPrice: product.price, offerUnitPrice: offer?.offerPrice, unitPrice, lineTotal,
      });
    }
    const deliveryFee = settings.deliveryFee;
    const orderNumber = `ORD-${now.toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const orderId = await ctx.db.insert('orders', {
      orderNumber, userId: user._id, customer: args.customer, items: snapshot,
      deliveryFee, subtotal, total: subtotal + deliveryFee, status: 'NEW',
      cashbackProcessed: false, createdAt: now, updatedAt: now,
    });
    await ctx.db.patch(user._id, {
      fullName: args.customer.fullName, address: args.customer.address, landmark: args.customer.landmark,
      notes: args.customer.notes ?? '', updatedAt: now,
    });
    return { orderId, orderNumber };
  },
});

export const mine = query({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const user = await requireUser(ctx, tokenHash);
    return (await ctx.db.query('orders').withIndex('by_user', (q) => q.eq('userId', user._id)).order('desc').collect()).map((o) => ({
      id: o._id, orderNumber: o.orderNumber, date: new Date(o.createdAt).toISOString(), items: o.items.map((i) => ({ name: i.productName, quantity: i.quantity, price: i.unitPrice, size: i.size, selectedOptions: i.selectedOptions })),
      deliveryFee: o.deliveryFee, subtotal: o.subtotal, total: o.total, status: o.status,
      address: o.customer.address, rejectReason: o.rejectionReason, cashbackProcessed: o.cashbackProcessed,
    }));
  },
});

export const adminList = query({
  args: { adminTokenHash: v.string() },
  handler: async (ctx, { adminTokenHash }) => {
    await requireAdmin(ctx, adminTokenHash);
    return (await ctx.db.query('orders').order('desc').collect()).map((o) => ({
      id: o._id, orderNumber: o.orderNumber, customerName: o.customer.fullName, phone: o.customer.phone,
      address: o.customer.address, landmark: o.customer.landmark, createdAt: new Date(o.createdAt).toISOString(),
      items: o.items.map((i, index) => ({ id: `${o._id}-${index}`, productId: i.productId, productName: i.productName, image: i.imageUrl ?? '', options: i.selectedOptions.map((option) => `${option.name}: ${option.value}`).join('، '), quantity: i.quantity, unitPrice: i.unitPrice, total: i.lineTotal })),
      subtotal: o.subtotal, deliveryFee: o.deliveryFee, total: o.total, status: o.status, rejectReason: o.rejectionReason,
    }));
  },
});

export const updateStatus = mutation({
  args: { adminTokenHash: v.string(), orderId: v.id('orders'), status: statusValidator, rejectionReason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminTokenHash);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status === 'DELIVERED' && args.status !== 'DELIVERED') throw new Error('DELIVERED_ORDER_IS_FINAL');
    const now = Date.now();
    await ctx.db.patch(order._id, { status: args.status, rejectionReason: args.status === 'REJECTED' ? args.rejectionReason : undefined, updatedAt: now });
    if (args.status === 'DELIVERED' && !order.cashbackProcessed) {
      const amount = Math.floor(order.total * 0.01);
      const existingTx = await ctx.db.query('walletTransactions').withIndex('by_order', (q) => q.eq('orderId', order._id)).first();
      if (!existingTx && amount > 0) {
        let wallet = await ctx.db.query('wallets').withIndex('by_user', (q) => q.eq('userId', order.userId)).unique();
        if (!wallet) {
          const walletId = await ctx.db.insert('wallets', { userId: order.userId, balance: 0, totalEarned: 0, updatedAt: now });
          wallet = await ctx.db.get(walletId);
        }
        if (!wallet) throw new Error('WALLET_NOT_FOUND');
        await ctx.db.patch(wallet._id, { balance: wallet.balance + amount, totalEarned: wallet.totalEarned + amount, updatedAt: now });
        await ctx.db.insert('walletTransactions', { userId: order.userId, type: 'EARN', amount, orderId: order._id, description: `استرجاع نقدي 1% من الطلب #${order.orderNumber}`, createdAt: now });
      }
      await ctx.db.patch(order._id, { cashbackProcessed: true, updatedAt: now });
    }
  },
});
