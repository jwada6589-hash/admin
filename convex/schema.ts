import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const orderStatus = v.union(
  v.literal('NEW'),
  v.literal('ACCEPTED'),
  v.literal('PREPARING'),
  v.literal('WITH_COURIER'),
  v.literal('DELIVERED'),
  v.literal('REJECTED'),
);

const redemptionStatus = v.union(
  v.literal('PENDING'),
  v.literal('APPROVED'),
  v.literal('RECEIVED'),
  v.literal('CANCELLED'),
);

export default defineSchema({
  users: defineTable({
    fullName: v.string(),
    phone: v.string(),
    passwordHash: v.string(),
    address: v.string(),
    landmark: v.string(),
    notes: v.optional(v.string()),
    isDeleted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_phone', ['phone']),

  userSessions: defineTable({
    userId: v.id('users'),
    tokenHash: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index('by_token_hash', ['tokenHash'])
    .index('by_user', ['userId']),

  adminUsers: defineTable({
    name: v.string(),
    phone: v.string(),
    passwordHash: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_phone', ['phone']),

  adminSessions: defineTable({
    adminId: v.id('adminUsers'),
    tokenHash: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index('by_token_hash', ['tokenHash'])
    .index('by_admin', ['adminId']),

  categories: defineTable({
    name: v.string(),
    imageStorageId: v.optional(v.id('_storage')),
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_sort_order', ['sortOrder']),

  subcategories: defineTable({
    categoryId: v.id('categories'),
    name: v.string(),
    imageStorageId: v.optional(v.id('_storage')),
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_category', ['categoryId'])
    .index('by_category_sort', ['categoryId', 'sortOrder']),

  products: defineTable({
    categoryId: v.id('categories'),
    subcategoryId: v.id('subcategories'),
    name: v.string(),
    description: v.string(),
    size: v.optional(v.string()),
    price: v.number(),
    currency: v.string(),
    imageStorageId: v.optional(v.id('_storage')),
    options: v.array(v.object({ name: v.string(), values: v.array(v.string()) })),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_subcategory', ['subcategoryId'])
    .index('by_category', ['categoryId'])
    .index('by_active', ['isActive']),

  offers: defineTable({
    productId: v.id('products'),
    offerPrice: v.number(),
    startAt: v.number(),
    endAt: v.number(),
    isEnabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_product', ['productId'])
    .index('by_enabled', ['isEnabled']),

  favorites: defineTable({
    userId: v.id('users'),
    productId: v.id('products'),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_product', ['userId', 'productId']),

  orders: defineTable({
    orderNumber: v.string(),
    userId: v.id('users'),
    customer: v.object({
      fullName: v.string(),
      phone: v.string(),
      address: v.string(),
      landmark: v.string(),
      notes: v.optional(v.string()),
    }),
    items: v.array(v.object({
      productId: v.id('products'),
      productName: v.string(),
      imageUrl: v.optional(v.string()),
      size: v.optional(v.string()),
      selectedOptions: v.array(v.object({ name: v.string(), value: v.string() })),
      quantity: v.number(),
      originalUnitPrice: v.number(),
      offerUnitPrice: v.optional(v.number()),
      unitPrice: v.number(),
      lineTotal: v.number(),
    })),
    deliveryFee: v.number(),
    subtotal: v.number(),
    total: v.number(),
    status: orderStatus,
    rejectionReason: v.optional(v.string()),
    cashbackProcessed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_status', ['status'])
    .index('by_order_number', ['orderNumber']),

  wallets: defineTable({
    userId: v.id('users'),
    balance: v.number(),
    totalEarned: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  walletTransactions: defineTable({
    userId: v.id('users'),
    type: v.union(v.literal('EARN'), v.literal('REDEEM'), v.literal('REFUND')),
    amount: v.number(),
    orderId: v.optional(v.id('orders')),
    redemptionId: v.optional(v.id('redemptions')),
    description: v.string(),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_order', ['orderId']),

  gifts: defineTable({
    name: v.string(),
    description: v.string(),
    imageStorageId: v.optional(v.id('_storage')),
    requiredBalance: v.number(),
    stock: v.number(),
    isActive: v.boolean(),
    redemptionCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_active', ['isActive']),

  redemptions: defineTable({
    requestNumber: v.string(),
    userId: v.id('users'),
    giftId: v.id('gifts'),
    giftName: v.string(),
    customerName: v.string(),
    phone: v.string(),
    pointsUsed: v.number(),
    status: redemptionStatus,
    idempotencyKey: v.string(),
    refunded: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_status', ['status'])
    .index('by_idempotency', ['userId', 'idempotencyKey']),

  storeSettings: defineTable({
    key: v.string(),
    storeName: v.string(),
    storeSubtitle: v.string(),
    whatsappNumber: v.string(),
    whatsappEnabled: v.boolean(),
    whatsappButtonText: v.string(),
    whatsappDefaultMessage: v.string(),
    deliveryFee: v.number(),
    updatedAt: v.number(),
  }).index('by_key', ['key']),
});
