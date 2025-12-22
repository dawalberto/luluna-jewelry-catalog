import { useI18n } from '../../i18n';
import type { PricingConfig, Product } from '../../types';
import { LoadingSpinner } from '../ui';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  onProductClick?: (product: Product) => void;
  pricingConfig?: PricingConfig;
}

export default function ProductGrid({
  products,
  isLoading,
  onProductClick,
  pricingConfig,
}: ProductGridProps) {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg
          className="w-20 h-20 text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <p className="text-xl text-gray-600">{t.catalog.noProducts}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          pricingConfig={pricingConfig}
          onClick={() => onProductClick?.(product)}
        />
      ))}
    </div>
  );
}
