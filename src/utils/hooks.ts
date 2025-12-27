import useSWR, { type SWRConfiguration } from 'swr';
import { CategoryService, ProductService, ShippingService, TagService } from '../services';
import type {
    Category,
    PaginatedResponse,
    PaginationOptions,
    Product,
    ProductFilters,
    Shipping,
    Tag,
} from '../types';

const productService = new ProductService();
const categoryService = new CategoryService();
const tagService = new TagService();
const shippingService = new ShippingService();

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

/**
 * Hook to fetch all categories
 */
export function useCategories(config?: SWRConfiguration) {
  const key = ['categories'];

  const { data, error, isLoading, mutate } = useSWR<Category[]>(
    key,
    () => categoryService.getCategories(),
    { ...defaultConfig, ...config }
  );

  return {
    categories: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch all tags
 */
export function useTags(config?: SWRConfiguration) {
  const key = ['tags'];

  const { data, error, isLoading, mutate } = useSWR<Tag[]>(
    key,
    () => tagService.getTags(),
    { ...defaultConfig, ...config }
  );

  return {
    tags: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch all shippings
 */
export function useShippings(config?: SWRConfiguration) {
  const key = ['shippings'];

  const { data, error, isLoading, mutate } = useSWR<Shipping[]>(
    key,
    () => shippingService.getAllShippings(),
    { ...defaultConfig, ...config }
  );

  return {
    shippings: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
