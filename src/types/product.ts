import { Timestamp } from 'firebase/firestore';

/**
 * Multilingual text content
 */
export interface MultilingualText {
  es: string;
  en: string;
  [key: string]: string; // Allow additional languages
}

/**
 * Product category
 */
// Categories are dynamic (stored in Firestore). We keep the type as string.
export type ProductCategory = string;

/**
 * Product price configuration
 * - tier: price is derived from global pricing config (S/M/L)
 * - custom: price is stored per-product
 */
export type ProductPriceType = 'S' | 'M' | 'L' | 'custom';

export interface ProductDiscount {
  enabled: boolean;
  percent: number; // 0-100
  description?: string;
}

export interface ProductPricing {
  type: ProductPriceType;
  customPrice?: number;
}

export interface PricingConfig {
  S: number;
  M: number;
  L: number;
}

/**
 * Global discount configuration (applied to catalog prices when active)
 * Stored in Firestore at settings/discount
 */
export interface GlobalDiscount {
  active: boolean;
  percent: number; // 0-100
  title: MultilingualText;
  description?: MultilingualText;
}

/**
 * Product entity from Firestore
 */
export interface Product {
  id: string;
  title: MultilingualText;
  description: MultilingualText;
  // New model
  categories: ProductCategory[];
  tags?: string[]; // Product tags for filtering and organization
  pricing: ProductPricing;
  discount?: ProductDiscount;
  isNew?: boolean;
  popularity: number; // Popularity score for sorting (default: 0)

  // Legacy fields (kept for backward compatibility with existing docs)
  price?: number;
  category?: ProductCategory;

  images: string[]; // Cloudinary URLs
  createdAt: Timestamp;
  updatedAt: Timestamp;
  published: boolean;
}

/**
 * Product creation input (without auto-generated fields)
 */
export interface CreateProductInput {
  title: MultilingualText;
  description: MultilingualText;
  categories: ProductCategory[];
  tags?: string[];
  pricing: ProductPricing;
  discount?: ProductDiscount;
  isNew?: boolean;
  popularity?: number;
  images: string[];
  published?: boolean;
}

/**
 * Product update input (all fields optional except ID)
 */
export interface UpdateProductInput {
  id: string;
  title?: MultilingualText;
  description?: MultilingualText;
  categories?: ProductCategory[];
  tags?: string[];
  pricing?: ProductPricing;
  discount?: ProductDiscount;
  isNew?: boolean;
  popularity?: number;
  images?: string[];
  published?: boolean;
}

/**
 * Filter options for product queries
 */
export interface ProductFilters {
  category?: ProductCategory;
  search?: string;
  publishedOnly?: boolean;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit: number;
  offset?: number;
  cursor?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}
