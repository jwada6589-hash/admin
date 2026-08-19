import { query } from './_generated/server';
import { v } from 'convex/values';

async function imageUrl(ctx: any, storageId?: any) {
  return storageId ? await ctx.storage.getUrl(storageId) : null;
}

export const categories = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('categories').withIndex('by_sort_order').collect();
    return await Promise.all(rows.filter((x) => x.isActive).map(async (x) => ({ id: x._id, name: x.name, image: await imageUrl(ctx, x.imageStorageId) })));
  },
});

export const subcategories = query({
  args: { categoryId: v.optional(v.id('categories')) },
  handler: async (ctx, { categoryId }) => {
    const rows = categoryId
      ? await ctx.db.query('subcategories').withIndex('by_category_sort', (q) => q.eq('categoryId', categoryId)).collect()
      : await ctx.db.query('subcategories').collect();
    return await Promise.all(rows.filter((x) => x.isActive).map(async (x) => ({ id: x._id, categoryId: x.categoryId, name: x.name, image: await imageUrl(ctx, x.imageStorageId) })));
  },
});

export const products = query({
  args: { subcategoryId: v.optional(v.id('subcategories')) },
  handler: async (ctx, { subcategoryId }) => {
    const rows = subcategoryId
      ? await ctx.db.query('products').withIndex('by_subcategory', (q) => q.eq('subcategoryId', subcategoryId)).collect()
      : await ctx.db.query('products').withIndex('by_active', (q) => q.eq('isActive', true)).collect();
    const now = Date.now();
    return await Promise.all(rows.filter((x) => x.isActive).map(async (x) => {
      const offers = await ctx.db.query('offers').withIndex('by_product', (q) => q.eq('productId', x._id)).collect();
      const activeOffer = offers.find((o) => o.isEnabled && o.startAt <= now && o.endAt >= now);
      return {
        id: x._id, categoryId: x.categoryId, subCategoryId: x.subcategoryId,
        name: x.name, description: x.description, size: x.size,
        price: x.price.toLocaleString('en-US'), numericPrice: x.price, currency: x.currency,
        image: await imageUrl(ctx, x.imageStorageId),
        options: x.options.map((o) => ({ name: o.name, choices: o.values })),
        isOffer: Boolean(activeOffer), offerPrice: activeOffer?.offerPrice,
        offerStartAt: activeOffer ? new Date(activeOffer.startAt).toISOString() : undefined,
        offerEndAt: activeOffer ? new Date(activeOffer.endAt).toISOString() : undefined,
      };
    }));
  },
});

export const activeOffers = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const offers = (await ctx.db.query('offers').withIndex('by_enabled', (q) => q.eq('isEnabled', true)).collect())
      .filter((o) => o.startAt <= now && o.endAt >= now);
    return await Promise.all(offers.map(async (offer) => {
      const product = await ctx.db.get(offer.productId);
      if (!product || !product.isActive) return null;
      return { id: offer._id, productId: product._id, offerPrice: offer.offerPrice, startAt: offer.startAt, endAt: offer.endAt };
    })).then((rows) => rows.filter(Boolean));
  },
});
