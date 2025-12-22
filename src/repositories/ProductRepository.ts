import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit, query,
    type QueryConstraint,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import FirebaseClient from '../services/FirebaseClient';
import type {
    CreateProductInput,
    PaginatedResponse,
    PaginationOptions,
    Product,
    ProductCategory,
    ProductFilters,
    UpdateProductInput,
} from '../types';
import type { IProductRepository } from './IProductRepository';

/**
 * Firestore implementation of Product Repository
 * 
 * SOLID Principles:
 * - Single Responsibility: Handles only Firestore data operations for products
 * - Open/Closed: Open for extension (can add new query methods), closed for modification
 * - Liskov Substitution: Can be replaced with any IProductRepository implementation
 * - Dependency Inversion: Depends on FirebaseClient abstraction
 */
export class ProductRepository implements IProductRepository {
  private readonly collectionName = 'products';
  private readonly db;

  constructor() {
    this.db = FirebaseClient.getInstance().firestore;
  }

  /**
   * Get all products with optional filtering and pagination
   */
  async getAll(
    filters?: ProductFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<Product>> {
    const constraints: QueryConstraint[] = [];

    // Apply filters
    if (filters?.category) {
      // New model: categories is an array
      constraints.push(where('categories', 'array-contains', filters.category));
    }

    if (filters?.publishedOnly !== false) {
      constraints.push(where('published', '==', true));
    }

    // Order by creation date (requires composite index with 'published' filter)
    // Temporarily commented out while index is building
    // constraints.push(orderBy('createdAt', 'desc'));

    // Apply pagination
    if (pagination?.limit) {
      constraints.push(limit(pagination.limit + 1)); // +1 to check if there are more
    }

    const q = query(collection(this.db, this.collectionName), ...constraints);
    const snapshot = await getDocs(q);

    const products: Product[] = [];
    snapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });

    // Check if there are more results
    const hasMore = pagination?.limit ? products.length > pagination.limit : false;
    if (hasMore) {
      products.pop(); // Remove the extra item
    }

    // Apply search filter client-side (Firestore doesn't support full-text search natively)
    let filteredProducts = products;
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredProducts = products.filter((product) => {
        const titleMatch = Object.values(product.title).some((title) =>
          title.toLowerCase().includes(searchLower)
        );
        const descMatch = Object.values(product.description).some((desc) =>
          desc.toLowerCase().includes(searchLower)
        );
        return titleMatch || descMatch;
      });
    }

    return {
      data: filteredProducts,
      total: filteredProducts.length,
      hasMore,
      nextCursor: hasMore ? products[products.length - 1]?.id : undefined,
    };
  }

  /**
   * Get product by ID
   */
  async getById(id: string): Promise<Product | null> {
    const docRef = doc(this.db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return { id: docSnap.id, ...docSnap.data() } as Product;
  }

  /**
   * Get products by category
   */
  async getByCategory(
    category: ProductCategory,
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<Product>> {
    return this.getAll({ category, publishedOnly: true }, pagination);
  }

  /**
   * Search products by text query
   */
  async search(
    searchQuery: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<Product>> {
    return this.getAll({ search: searchQuery, publishedOnly: true }, pagination);
  }

  /**
   * Create a new product
   */
  async create(input: CreateProductInput): Promise<Product> {
    const primaryCategory = input.categories?.[0];
    const productData: Record<string, unknown> = {
      ...input,
      // Keep legacy fields for older UI / historical docs
      category: primaryCategory,
      published: input.published ?? false,
      popularity: input.popularity ?? 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Firestore does NOT allow `undefined` field values.
    if (input.pricing?.type === 'custom') {
      productData.price = input.pricing.customPrice;
    }

    const docRef = await addDoc(
      collection(this.db, this.collectionName),
      productData
    );

    const newProduct = await this.getById(docRef.id);
    if (!newProduct) {
      throw new Error('Failed to create product');
    }

    return newProduct;
  }

  /**
   * Update an existing product
   */
  async update(input: UpdateProductInput): Promise<Product> {
    const { id, ...updateData } = input;
    const docRef = doc(this.db, this.collectionName, id);

    const maybePrimaryCategory = updateData.categories?.[0];
    const legacyPatch: Record<string, unknown> = {};
    if (maybePrimaryCategory) {
      legacyPatch.category = maybePrimaryCategory;
    }
    if (updateData.pricing) {
      legacyPatch.price =
        updateData.pricing.type === 'custom'
          ? updateData.pricing.customPrice
          : null;
    }

    await updateDoc(docRef, {
      ...updateData,
      ...legacyPatch,
      updatedAt: serverTimestamp(),
    });

    const updatedProduct = await this.getById(id);
    if (!updatedProduct) {
      throw new Error('Failed to update product');
    }

    return updatedProduct;
  }

  /**
   * Delete a product
   */
  async delete(id: string): Promise<void> {
    const docRef = doc(this.db, this.collectionName, id);
    await deleteDoc(docRef);
  }
}
