import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireAdmin } from './lib/auth';

const optionValidator = v.object({ name: v.string(), values: v.array(v.string()) });

export const categories = query({
  args: { adminTokenHash: v.string() },
  handler: async (ctx, { adminTokenHash }) => {
    await requireAdmin(ctx, adminTokenHash);
    const rows = await ctx.db.query('categories').withIndex('by_sort_order').collect();
    return await Promise.all(rows.map(async (c) => ({
      id: c._id, name: c.name, image: c.imageStorageId ? await ctx.storage.getUrl(c.imageStorageId) : '', imageStorageId: c.imageStorageId,
      isActive: c.isActive, branchesCount: (await ctx.db.query('subcategories').withIndex('by_category', (q) => q.eq('categoryId', c._id)).collect()).length,
    })));
  },
});

export const saveCategory = mutation({
  args: { adminTokenHash: v.string(), id: v.optional(v.id('categories')), name: v.string(), imageStorageId: v.optional(v.id('_storage')), isActive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminTokenHash);
    const now = Date.now();
    if (args.id) {
      const current = await ctx.db.get(args.id); if (!current) throw new Error('CATEGORY_NOT_FOUND');
      await ctx.db.patch(args.id, { name: args.name.trim(), imageStorageId: args.imageStorageId ?? current.imageStorageId, isActive: args.isActive ?? current.isActive, updatedAt: now });
      return args.id;
    }
    const sortOrder = (await ctx.db.query('categories').collect()).length;
    return await ctx.db.insert('categories', { name: args.name.trim(), imageStorageId: args.imageStorageId, sortOrder, isActive: args.isActive ?? true, createdAt: now, updatedAt: now });
  },
});

export const deleteCategory = mutation({
  args: { adminTokenHash: v.string(), id: v.id('categories') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminTokenHash);
    if ((await ctx.db.query('subcategories').withIndex('by_category', (q) => q.eq('categoryId', args.id)).first())) throw new Error('CATEGORY_HAS_BRANCHES');
    await ctx.db.delete(args.id);
  },
});

export const subcategories = query({
  args: { adminTokenHash: v.string(), categoryId: v.optional(v.id('categories')) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminTokenHash);
    const rows = args.categoryId ? await ctx.db.query('subcategories').withIndex('by_category', (q) => q.eq('categoryId', args.categoryId!)).collect() : await ctx.db.query('subcategories').collect();
    return await Promise.all(rows.map(async (b) => ({
      id: b._id, categoryId: b.categoryId, name: b.name, image: b.imageStorageId ? await ctx.storage.getUrl(b.imageStorageId) : '', imageStorageId: b.imageStorageId,
      isActive: b.isActive, productsCount: (await ctx.db.query('products').withIndex('by_subcategory', (q) => q.eq('subcategoryId', b._id)).collect()).length,
    })));
  },
});

export const saveSubcategory = mutation({
  args: { adminTokenHash: v.string(), id: v.optional(v.id('subcategories')), categoryId: v.id('categories'), name: v.string(), imageStorageId: v.optional(v.id('_storage')), isActive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminTokenHash);
    const now = Date.now();
    if (args.id) {
      const current = await ctx.db.get(args.id); if (!current) throw new Error('BRANCH_NOT_FOUND');
      await ctx.db.patch(args.id, { categoryId: args.categoryId, name: args.name.trim(), imageStorageId: args.imageStorageId ?? current.imageStorageId, isActive: args.isActive ?? current.isActive, updatedAt: now });
      return args.id;
    }
    const sortOrder = (await ctx.db.query('subcategories').withIndex('by_category', (q) => q.eq('categoryId', args.categoryId)).collect()).length;
    return await ctx.db.insert('subcategories', { categoryId: args.categoryId, name: args.name.trim(), imageStorageId: args.imageStorageId, sortOrder, isActive: args.isActive ?? true, createdAt: now, updatedAt: now });
  },
});

export const deleteSubcategory = mutation({
  args: { adminTokenHash: v.string(), id: v.id('subcategories') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminTokenHash);
    if ((await ctx.db.query('products').withIndex('by_subcategory', (q) => q.eq('subcategoryId', args.id)).first())) throw new Error('BRANCH_HAS_PRODUCTS');
    await ctx.db.delete(args.id);
  },
});

export const products = query({
  args: { adminTokenHash: v.string(), subcategoryId: v.optional(v.id('subcategories')) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminTokenHash);
    const rows = args.subcategoryId ? await ctx.db.query('products').withIndex('by_subcategory', (q) => q.eq('subcategoryId', args.subcategoryId!)).collect() : await ctx.db.query('products').collect();
    return await Promise.all(rows.map(async (p) => ({ id: p._id, branchId: p.subcategoryId, categoryId: p.categoryId, name: p.name, description: p.description, price: p.price, size: p.size, image: p.imageStorageId ? await ctx.storage.getUrl(p.imageStorageId) : '', imageStorageId: p.imageStorageId, isAvailable: p.isActive, options: p.options })));
  },
});

export const saveProduct = mutation({
  args: { adminTokenHash: v.string(), id: v.optional(v.id('products')), categoryId: v.id('categories'), subcategoryId: v.id('subcategories'), name: v.string(), description: v.string(), size: v.optional(v.string()), price: v.number(), currency: v.optional(v.string()), imageStorageId: v.optional(v.id('_storage')), options: v.array(optionValidator), isActive: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminTokenHash);
    if (args.price < 0) throw new Error('INVALID_PRICE');
    const now = Date.now();
    if (args.id) {
      const current = await ctx.db.get(args.id); if (!current) throw new Error('PRODUCT_NOT_FOUND');
      await ctx.db.patch(args.id, { categoryId: args.categoryId, subcategoryId: args.subcategoryId, name: args.name.trim(), description: args.description.trim(), size: args.size, price: args.price, currency: args.currency ?? 'د.ع', imageStorageId: args.imageStorageId ?? current.imageStorageId, options: args.options, isActive: args.isActive, updatedAt: now });
      return args.id;
    }
    return await ctx.db.insert('products', { categoryId: args.categoryId, subcategoryId: args.subcategoryId, name: args.name.trim(), description: args.description.trim(), size: args.size, price: args.price, currency: args.currency ?? 'د.ع', imageStorageId: args.imageStorageId, options: args.options, isActive: args.isActive, createdAt: now, updatedAt: now });
  },
});

export const setProductActive = mutation({
  args: { adminTokenHash: v.string(), id: v.id('products'), isActive: v.boolean() },
  handler: async (ctx, args) => { await requireAdmin(ctx, args.adminTokenHash); await ctx.db.patch(args.id, { isActive: args.isActive, updatedAt: Date.now() }); },
});

export const deleteProduct = mutation({
  args: { adminTokenHash: v.string(), id: v.id('products') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminTokenHash);
    const used = (await ctx.db.query('orders').collect()).some((o) => o.items.some((i) => i.productId === args.id));
    if (used) { await ctx.db.patch(args.id, { isActive: false, updatedAt: Date.now() }); return 'disabled'; }
    for (const offer of await ctx.db.query('offers').withIndex('by_product', (q) => q.eq('productId', args.id)).collect()) await ctx.db.delete(offer._id);
    for (const fav of await ctx.db.query('favorites').collect()) if (fav.productId === args.id) await ctx.db.delete(fav._id);
    await ctx.db.delete(args.id); return 'deleted';
  },
});

export const offers = query({
  args: { adminTokenHash: v.string() },
  handler: async (ctx, { adminTokenHash }) => {
    await requireAdmin(ctx, adminTokenHash);
    return (await ctx.db.query('offers').collect()).map((o) => ({ id: o._id, productId: o.productId, offerPrice: o.offerPrice, startDate: new Date(o.startAt).toISOString(), endDate: new Date(o.endAt).toISOString(), isDisabled: !o.isEnabled }));
  },
});

export const saveOffer = mutation({
  args: { adminTokenHash: v.string(), id: v.optional(v.id('offers')), productId: v.id('products'), offerPrice: v.number(), startAt: v.number(), endAt: v.number(), isEnabled: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminTokenHash);
    const product = await ctx.db.get(args.productId); if (!product) throw new Error('PRODUCT_NOT_FOUND');
    if (args.offerPrice < 0 || args.offerPrice >= product.price || args.endAt <= args.startAt) throw new Error('INVALID_OFFER');
    const now = Date.now();
    if (args.id) { await ctx.db.patch(args.id, { productId: args.productId, offerPrice: args.offerPrice, startAt: args.startAt, endAt: args.endAt, isEnabled: args.isEnabled, updatedAt: now }); return args.id; }
    return await ctx.db.insert('offers', { productId: args.productId, offerPrice: args.offerPrice, startAt: args.startAt, endAt: args.endAt, isEnabled: args.isEnabled, createdAt: now, updatedAt: now });
  },
});

export const deleteOffer = mutation({ args: { adminTokenHash: v.string(), id: v.id('offers') }, handler: async (ctx, args) => { await requireAdmin(ctx, args.adminTokenHash); await ctx.db.delete(args.id); } });

export const gifts = query({
  args: { adminTokenHash: v.string() },
  handler: async (ctx, { adminTokenHash }) => {
    await requireAdmin(ctx, adminTokenHash);
    return await Promise.all((await ctx.db.query('gifts').collect()).map(async (g) => ({ id: g._id, name: g.name, description: g.description, image: g.imageStorageId ? await ctx.storage.getUrl(g.imageStorageId) : '', imageStorageId: g.imageStorageId, requiredBalance: g.requiredBalance, quantity: g.stock, redemptionCount: g.redemptionCount, isDisabled: !g.isActive })));
  },
});

export const saveGift = mutation({
  args: { adminTokenHash: v.string(), id: v.optional(v.id('gifts')), name: v.string(), description: v.string(), imageStorageId: v.optional(v.id('_storage')), requiredBalance: v.number(), stock: v.number(), isActive: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminTokenHash); const now = Date.now();
    if (args.requiredBalance < 0 || args.stock < 0) throw new Error('INVALID_GIFT');
    if (args.id) { const current = await ctx.db.get(args.id); if (!current) throw new Error('GIFT_NOT_FOUND'); await ctx.db.patch(args.id, { name: args.name, description: args.description, imageStorageId: args.imageStorageId ?? current.imageStorageId, requiredBalance: args.requiredBalance, stock: args.stock, isActive: args.isActive, updatedAt: now }); return args.id; }
    return await ctx.db.insert('gifts', { name: args.name, description: args.description, imageStorageId: args.imageStorageId, requiredBalance: args.requiredBalance, stock: args.stock, isActive: args.isActive, redemptionCount: 0, createdAt: now, updatedAt: now });
  },
});

export const deleteGift = mutation({ args: { adminTokenHash: v.string(), id: v.id('gifts') }, handler: async (ctx, args) => { await requireAdmin(ctx, args.adminTokenHash); const used = (await ctx.db.query('redemptions').collect()).some((r) => r.giftId === args.id); if (used) await ctx.db.patch(args.id, { isActive: false, updatedAt: Date.now() }); else await ctx.db.delete(args.id); } });

export const dashboard = query({
  args: { adminTokenHash: v.string() },
  handler: async (ctx, { adminTokenHash }) => {
    await requireAdmin(ctx, adminTokenHash);
    const [orders, products, categories, branches, offers] = await Promise.all([ctx.db.query('orders').order('desc').collect(), ctx.db.query('products').collect(), ctx.db.query('categories').collect(), ctx.db.query('subcategories').collect(), ctx.db.query('offers').collect()]);
    const now = Date.now();
    const count = (status: string) => orders.filter((o) => o.status === status).length;
    return {
      stats: { newOrders: count('NEW'), preparing: count('PREPARING'), withCourier: count('WITH_COURIER'), delivered: count('DELIVERED'), products: products.length, categories: categories.length, branches: branches.length, activeOffers: offers.filter((o) => o.isEnabled && o.startAt <= now && o.endAt >= now).length },
      recentOrders: orders.slice(0, 8).map((o) => ({ id: o.orderNumber, customer: o.customer.fullName, total: o.total, status: o.status, createdAt: o.createdAt })),
    };
  },
});
