import type {
    CreateProductInput,
    PaginatedResponse,
    PaginationOptions,
    Product,
    ProductFilters,
    UpdateProductInput,
} from '../types';

/**
 * Repository interface for product data access
 * 
 * SOLID Principles:
 * - Interface Segregation: Separates read and write operations
 * - Dependency Inversion: Services depend on this interface, not concrete implementation
 */
export interface IProductRepository {
  // Read operations
  getAll(
    filters?: ProductFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<Product>>;
  
  getById(id: string): Promise<Product | null>;
  
  getByCategory(
    category: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<Product>>;
  
  search(
    query: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<Product>>;
  
  // Write operations
  create(product: CreateProductInput): Promise<Product>;
  
  update(product: UpdateProductInput): Promise<Product>;
  
  delete(id: string): Promise<void>;
}
