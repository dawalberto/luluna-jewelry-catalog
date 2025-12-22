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
export type ProductCategory = 
  | 'rings'
  | 'necklaces'
  | 'bracelets'
  | 'earrings'
  | 'sets'
  | 'custom';

/**
 * Product entity from Firestore
 */
export interface Product {
  id: string;
  title: MultilingualText;
  description: MultilingualText;
  price: number;
  category: ProductCategory;
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
  price: number;
  category: ProductCategory;
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
  price?: number;
  category?: ProductCategory;
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
