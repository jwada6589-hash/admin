import { action, internalMutation, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

export const isSeeded = internalQuery({
  args: {},
  handler: async (ctx) => Boolean(await ctx.db.query('storeSettings').withIndex('by_key', (q) => q.eq('key', 'main')).unique()),
});

async function storeRemoteImage(ctx: any, url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`IMAGE_FETCH_FAILED:${response.status}`);
  return await ctx.storage.store(await response.blob());
}

export const initialise = action({
  args: { setupSecret: v.string() },
  handler: async (ctx, { setupSecret }) => {
    if (!process.env.ADMIN_SETUP_SECRET || setupSecret !== process.env.ADMIN_SETUP_SECRET) throw new Error('INVALID_SETUP_SECRET');
    if (await ctx.runQuery(internal.seed.isSeeded, {})) return { seeded: false, reason: 'already_seeded' };
    const categoryImages = await Promise.all([
      storeRemoteImage(ctx, 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&q=80&w=600'),
      storeRemoteImage(ctx, 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&q=80&w=600'),
      storeRemoteImage(ctx, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600'),
      storeRemoteImage(ctx, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=600'),
      storeRemoteImage(ctx, 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&q=80&w=600'),
    ]);
    const giftImages = await Promise.all([
      storeRemoteImage(ctx, 'https://cdn-icons-png.flaticon.com/512/2442/2442093.png'),
      storeRemoteImage(ctx, 'https://cdn-icons-png.flaticon.com/512/3082/3082011.png'),
      storeRemoteImage(ctx, 'https://cdn-icons-png.flaticon.com/512/179/179457.png'),
    ]);
    await ctx.runMutation(internal.seed.insertSeedData, { categoryImages, giftImages });
    return { seeded: true };
  },
});

export const insertSeedData = internalMutation({
  args: { categoryImages: v.array(v.id('_storage')), giftImages: v.array(v.id('_storage')) },
  handler: async (ctx, { categoryImages, giftImages }) => {
    if (await ctx.db.query('storeSettings').withIndex('by_key', (q) => q.eq('key', 'main')).unique()) return;
    const now = Date.now();
    await ctx.db.insert('storeSettings', {
      key: 'main', storeName: 'ماركت المرتضى', storeSubtitle: 'كل احتياجاتك اليومية بمكان واحد',
      whatsappNumber: '+9647712345678', whatsappEnabled: true, whatsappButtonText: 'تواصل معنا عبر واتساب',
      whatsappDefaultMessage: 'مرحباً، أحتاج مساعدة بخصوص طلبي من ماركت المرتضى', deliveryFee: 3000, updatedAt: now,
    });
    const categoryDefs = [
      ['البقالة', 0], ['المنظفات', 1], ['الخضروات', 2], ['العناية الشخصية', 3], ['الحلويات', 4],
    ] as const;
    const categoryIds = [];
    for (let i = 0; i < categoryDefs.length; i++) {
      categoryIds.push(await ctx.db.insert('categories', { name: categoryDefs[i][0], imageStorageId: categoryImages[categoryDefs[i][1]], sortOrder: i, isActive: true, createdAt: now, updatedAt: now }));
    }
    const subDefs = [
      [0, 'الأرز والبقوليات'], [0, 'الزيوت والسمن'], [0, 'المعلبات'],
      [1, 'غسيل الملابس'], [1, 'غسيل الصحون'], [2, 'خضار طازجة'], [2, 'فواكه'],
      [3, 'الشعر والجسم'], [4, 'شوكولاتة وبسكويت'],
    ] as const;
    const subIds = [];
    for (let i = 0; i < subDefs.length; i++) {
      const [categoryIndex, name] = subDefs[i];
      subIds.push(await ctx.db.insert('subcategories', { categoryId: categoryIds[categoryIndex], name, imageStorageId: categoryImages[categoryIndex], sortOrder: i, isActive: true, createdAt: now, updatedAt: now }));
    }
    const productDefs = [
      [0, 0, 'أرز بسمتي سيلا', 'أرز بسمتي عالي الجودة وحبة طويلة', '5 كغم', 12500, [{ name: 'النوع', values: ['حبة طويلة', 'حبة قصيرة'] }]],
      [0, 1, 'زيت دوار الشمس', 'زيت نباتي صافي للطبخ والقلي', '1.8 لتر', 6750, []],
      [0, 0, 'سكر أبيض', 'سكر أبيض نقي ومكرر', '2 كغم', 2250, []],
      [0, 0, 'معكرونة سباغيتي', 'معكرونة سريعة التحضير', '400 غم', 1000, []],
      [0, 0, 'حليب مجفف', 'حليب مجفف كامل الدسم', '900 غم', 9500, []],
      [1, 4, 'سائل غسيل الصحون', 'سائل مركز برائحة الليمون', '1 لتر', 2000, [{ name: 'الرائحة', values: ['ليمون', 'تفاح', 'صنوبر'] }]],
      [2, 5, 'طماطم طازجة', 'طماطم محلية طازجة', '1 كغم', 1500, []],
      [3, 7, 'شامبو للشعر', 'شامبو لجميع أنواع الشعر', '400 مل', 5000, [{ name: 'النوع', values: ['لشعر الجاف', 'لشعر الدهني'] }]],
      [4, 8, 'شوكولاتة بالحليب', 'شوكولاتة سويسرية غنية', '100 غم', 1500, [{ name: 'النكهة', values: ['بالحليب', 'بالبندق', 'داكنة'] }, { name: 'الحجم', values: ['صغير', 'كبير'] }]],
    ] as const;
    const productIds = [];
    for (const [categoryIndex, subIndex, name, description, size, price, options] of productDefs) {
      productIds.push(await ctx.db.insert('products', { categoryId: categoryIds[categoryIndex], subcategoryId: subIds[subIndex], name, description, size, price, currency: 'د.ع', imageStorageId: categoryImages[categoryIndex], options: [...options].map((o) => ({ name: o.name, values: [...o.values] })), isActive: true, createdAt: now, updatedAt: now }));
    }
    await ctx.db.insert('offers', { productId: productIds[1], offerPrice: 5000, startAt: Date.UTC(2026, 7, 1), endAt: Date.UTC(2030, 11, 31), isEnabled: true, createdAt: now, updatedAt: now });
    await ctx.db.insert('offers', { productId: productIds[2], offerPrice: 1800, startAt: Date.UTC(2026, 7, 10), endAt: Date.UTC(2030, 11, 31), isEnabled: true, createdAt: now, updatedAt: now });
    await ctx.db.insert('offers', { productId: productIds[6], offerPrice: 1000, startAt: Date.UTC(2026, 7, 18), endAt: Date.UTC(2030, 11, 31), isEnabled: true, createdAt: now, updatedAt: now });
    const gifts = [
      ['علبة عصير طازج', 'عصير برتقال طبيعي 100% حجم 1 لتر', 2000, 50],
      ['سلة مواد غذائية', 'سلة متكاملة تحتوي على الأساسيات (زيت، سكر، رز، معجون)', 10000, 10],
      ['رصيد اتصال', 'بطاقة تعبئة رصيد بقيمة 5000 دينار', 5000, 0],
    ] as const;
    for (let i = 0; i < gifts.length; i++) {
      await ctx.db.insert('gifts', { name: gifts[i][0], description: gifts[i][1], imageStorageId: giftImages[i], requiredBalance: gifts[i][2], stock: gifts[i][3], isActive: true, redemptionCount: 0, createdAt: now, updatedAt: now });
    }
  },
});
