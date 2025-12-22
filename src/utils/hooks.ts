import useSWR, { type SWRConfiguration } from 'swr';
import { ProductService } from '../services';
import type {
    PaginatedResponse,
    PaginationOptions,
    Product,
    ProductFilters,
} from '../types';

const productService = new ProductService();

/**
 * Default SWR configuration
 */
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
};

/**
 * Hook to fetch all products with optional filters
 */
export function useProducts(
  filters?: ProductFilters,
  pagination?: PaginationOptions,
  config?: SWRConfiguration
) {
  const key = ['products', filters, pagination];

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Product>>(
    key,
    () => productService.getProducts(filters, pagination),
    { ...defaultConfig, ...config }
  );

  return {
    products: data?.data || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(id: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<Product | null>(
    id ? ['product', id] : null,
    () => (id ? productService.getProductById(id) : null),
    { ...defaultConfig, ...config }
  );

  return {
    product: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch products by category
 */
export function useProductsByCategory(
  category: string,
  pagination?: PaginationOptions,
  config?: SWRConfiguration
) {
  const key = ['products', 'category', category, pagination];

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Product>>(
    key,
    () => productService.getProductsByCategory(category, pagination),
    { ...defaultConfig, ...config }
  );

  return {
    products: data?.data || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to search products
 */
export function useProductSearch(
  query: string,
  pagination?: PaginationOptions,
  config?: SWRConfiguration
) {
  const key = query ? ['products', 'search', query, pagination] : null;

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Product>>(
    key,
    () => productService.searchProducts(query, pagination),
    { ...defaultConfig, ...config }
  );

  return {
    products: data?.data || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
