import { z } from 'zod';
import type { IProductRepository } from '../repositories';
import { ProductRepository } from '../repositories';
import type {
    CreateProductInput,
    PaginatedResponse,
    PaginationOptions,
    Product,
    ProductCategory,
    ProductFilters,
    UpdateProductInput,
} from '../types';
import { deleteCloudinaryImages } from '../utils/cloudinary';

/**
 * Zod schemas for runtime validation
 */
const MultilingualTextSchema = z.object({
  es: z.string().min(1),
  en: z.string().min(1),
});

const ProductCategorySchema = z.string().min(1);

const ProductPricingSchema = z
  .object({
    type: z.enum(['S', 'M', 'L', 'custom']),
    customPrice: z.number().positive().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === 'custom' && (typeof val.customPrice !== 'number' || val.customPrice <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'customPrice is required when pricing.type is custom',
        path: ['customPrice'],
      });
    }
    if (val.type !== 'custom' && val.customPrice !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'customPrice must be omitted unless pricing.type is custom',
        path: ['customPrice'],
      });
    }
  });

const ProductDiscountSchema = z
  .object({
    enabled: z.boolean(),
    percent: z.number().min(0).max(100),
    description: z.string().optional(),
  })
  .optional();

const CreateProductSchema = z.object({
  title: MultilingualTextSchema,
  description: MultilingualTextSchema,
  categories: z.array(ProductCategorySchema).min(1),
  tags: z.array(z.string()).optional(),
  pricing: ProductPricingSchema,
  discount: ProductDiscountSchema,
  isNew: z.boolean().optional(),
  popularity: z.number().min(0).optional(),
  images: z.array(z.string().url()).min(1),
  published: z.boolean().optional(),
});

const UpdateProductSchema = z.object({
  id: z.string().min(1),
  title: MultilingualTextSchema.optional(),
  description: MultilingualTextSchema.optional(),
  categories: z.array(ProductCategorySchema).min(1).optional(),
  tags: z.array(z.string()).optional(),
  pricing: ProductPricingSchema.optional(),
  discount: ProductDiscountSchema,
  isNew: z.boolean().optional(),
  popularity: z.number().min(0).optional(),
  images: z.array(z.string().url()).optional(),
  published: z.boolean().optional(),
});

/**
 * Product Service - Business Logic Layer
 * 
 * SOLID Principles:
 * - Single Responsibility: Handles business logic and validation for products
 * - Open/Closed: Can be extended with new business rules without modifying existing code
 * - Dependency Inversion: Depends on IProductRepository interface, not concrete implementation
 */
export class ProductService {
  private repository: IProductRepository;

  constructor(repository?: IProductRepository) {
    this.repository = repository ?? new ProductRepository();
  }

  /**
   * Get all products with filtering and pagination
   */
  async getProducts(
    filters?: ProductFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<Product>> {
    try {
      return await this.repository.getAll(filters, pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  /**
   * Get a single product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    if (!id || id.trim() === '') {
      throw new Error('Product ID is required');
    }

    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw new Error('Failed to fetch product');
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(
    category: ProductCategory,
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<Product>> {
    try {
      return await this.repository.getByCategory(category, pagination);
    } catch (error) {
      console.error(`Error fetching products for category ${category}:`, error);
      throw new Error('Failed to fetch products by category');
    }
  }

  /**
   * Search products
   */
  async searchProducts(
    query: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<Product>> {
    if (!query || query.trim() === '') {
      return this.getProducts({ publishedOnly: true }, pagination);
    }

    try {
      return await this.repository.search(query.trim(), pagination);
    } catch (error) {
      console.error(`Error searching products with query "${query}":`, error);
      throw new Error('Failed to search products');
    }
  }

  /**
   * Create a new product (admin only)
   */
  async createProduct(input: CreateProductInput): Promise<Product> {
    // Validate input
    const validatedInput = CreateProductSchema.parse(input);

    try {
      return await this.repository.create(validatedInput);
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }
  }

  /**
   * Update an existing product (admin only)
   */
  async updateProduct(input: UpdateProductInput): Promise<Product> {
    // Validate input
    const validatedInput = UpdateProductSchema.parse(input);

    // Check if product exists
    const existing = await this.repository.getById(validatedInput.id);
    if (!existing) {
      throw new Error('Product not found');
    }

    // If images are being updated, delete old images from Cloudinary
    if (validatedInput.images && existing.images) {
      const oldImages = existing.images;
      const newImages = validatedInput.images;
      const imagesToDelete = oldImages.filter(img => !newImages.includes(img));
      
      if (imagesToDelete.length > 0) {
        console.log('🗑️ Deleting old images from Cloudinary:', imagesToDelete);
        await deleteCloudinaryImages(imagesToDelete).catch(err => {
          console.error('Failed to delete images from Cloudinary:', err);
          // Don't throw - continue with product update even if image deletion fails
        });
      }
    }

    try {
      return await this.repository.update(validatedInput);
    } catch (error) {
      console.error(`Error updating product ${validatedInput.id}:`, error);
      throw new Error('Failed to update product');
    }
  }

  /**
   * Delete a product (admin only)
   */
  async deleteProduct(id: string): Promise<void> {
    if (!id || id.trim() === '') {
      throw new Error('Product ID is required');
    }

    // Check if product exists
    const existing = await this.repository.getById(id);
    if (!existing) {
      throw new Error('Product not found');
    }

    // Delete product images from Cloudinary
    if (existing.images && existing.images.length > 0) {
      console.log('🗑️ Deleting product images from Cloudinary:', existing.images);
      await deleteCloudinaryImages(existing.images).catch(err => {
        console.error('Failed to delete images from Cloudinary:', err);
        // Don't throw - continue with product deletion even if image deletion fails
      });
    }

    try {
      await this.repository.delete(id);
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw new Error('Failed to delete product');
    }
  }

  /**
   * Toggle product published status
   */
  async togglePublished(id: string): Promise<Product> {
    const product = await this.repository.getById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    return this.updateProduct({
      id,
      published: !product.published,
    });
  }
}
