/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminAuth from "../adminAuth.js";
import type * as authActions from "../authActions.js";
import type * as authInternal from "../authInternal.js";
import type * as catalog from "../catalog.js";
import type * as favorites from "../favorites.js";
import type * as gifts from "../gifts.js";
import type * as lib_auth from "../lib/auth.js";
import type * as orders from "../orders.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as storage from "../storage.js";
import type * as users from "../users.js";
import type * as wallet from "../wallet.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminAuth: typeof adminAuth;
  authActions: typeof authActions;
  authInternal: typeof authInternal;
  catalog: typeof catalog;
  favorites: typeof favorites;
  gifts: typeof gifts;
  "lib/auth": typeof lib_auth;
  orders: typeof orders;
  seed: typeof seed;
  settings: typeof settings;
  storage: typeof storage;
  users: typeof users;
  wallet: typeof wallet;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
