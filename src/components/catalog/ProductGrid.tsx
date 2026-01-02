import { useI18n } from '../../i18n';
import type { GlobalDiscount, PricingConfig, Product, ProductCategory } from '../../types';
import { saveCatalogState } from '../../utils';
import { LoadingSpinner } from '../ui';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  onProductClick?: (product: Product) => void;
  pricingConfig?: PricingConfig;
  globalDiscount?: GlobalDiscount;
  mobileColumns?: 1 | 2;
  catalogState?: {
    selectedCategory?: ProductCategory | 'all'; // Legacy: deprecated
    selectedCategories?: ProductCategory[]; // New: multiple categories
    selectedTags?: string[];
    selectedCollection?: string;
    searchQuery: string;
    sortBy: 'collections' | 'price-asc' | 'price-desc' | 'popularity' | 'date-desc' | 'date-asc';
  };
}

export default function ProductGrid({
  products,
  isLoading,
  onProductClick,
  pricingConfig,
  globalDiscount,
  mobileColumns = 1,
  catalogState,
}: ProductGridProps) {
  const { t } = useI18n();

  const mobileColsClass = mobileColumns === 2 ? 'grid-cols-2' : 'grid-cols-1';

  // Handle product click to save catalog state before navigation
  const handleProductClick = () => {
    if (catalogState) {
      saveCatalogState({
        selectedCategories: catalogState.selectedCategories || [],
        selectedTags: catalogState.selectedTags || [],
        selectedCollection: catalogState.selectedCollection,
        searchQuery: catalogState.searchQuery || '',
        sortBy: catalogState.sortBy || 'collections',
        scrollPosition: window.scrollY,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center p-8">
        <svg
          className="w-16 h-16 text-(--color-muted) opacity-40 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <p className="text-lg font-medium text-(--color-muted) font-heading">{t.catalog.noProducts}</p>
      </div>
    );
  }

  return (
    <div
      className={`grid ${mobileColsClass} sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-10`}
    >
      {products.map((product) => (
        <div key={product.id} onClick={handleProductClick}>
          <ProductCard
            product={product}
            pricingConfig={pricingConfig}
            globalDiscount={globalDiscount}
            onClick={onProductClick ? () => onProductClick(product) : undefined}
          />
        </div>
      ))}
    </div>
  );
}
