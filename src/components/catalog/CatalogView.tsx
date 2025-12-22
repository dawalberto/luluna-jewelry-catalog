import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import { GlobalDiscountService, PricingService } from '../../services';
import type { GlobalDiscount, PricingConfig, ProductCategory } from '../../types';
import { useProducts } from '../../utils/hooks';
import CategoryFilter from './CategoryFilter';
import ProductGrid from './ProductGrid';
import SearchBar from './SearchBar';

const pricingService = new PricingService();
const globalDiscountService = new GlobalDiscountService();

export default function CatalogView() {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategory | 'all'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | undefined>(undefined);
  const [globalDiscount, setGlobalDiscount] = useState<GlobalDiscount | undefined>(undefined);

  const filters = {
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: searchQuery || undefined,
    publishedOnly: true,
  };

  const { products, isLoading } = useProducts(filters, { limit: 50 });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const config = await pricingService.getPricingConfig();
        if (mounted) setPricingConfig(config);
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const config = await globalDiscountService.getGlobalDiscount();
        if (mounted) setGlobalDiscount(config);
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t.catalog.title}</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t.catalog.subtitle}</p>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center mb-6">
        <SearchBar onSearch={setSearchQuery} />
      </div>

      {/* Category Filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {globalDiscount?.active && globalDiscount.percent > 0 && (
        <div className="mb-6 rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-100">
          <div className="text-sm font-semibold text-gray-900">{t.catalog.promoTitle}</div>
          <div className="mt-1 text-sm text-gray-700">
            <span className="font-medium">{globalDiscount.title}</span>
            {globalDiscount.title ? ' — ' : ''}
            {globalDiscount.percent}%
          </div>
          {globalDiscount.description && (
            <div className="mt-1 text-sm text-gray-600">{globalDiscount.description}</div>
          )}
          {!globalDiscount.description && (
            <div className="mt-1 text-sm text-gray-600">{t.catalog.promoDescription}</div>
          )}
        </div>
      )}

      {/* Product Grid */}
      <ProductGrid
        products={products}
        isLoading={isLoading}
        pricingConfig={pricingConfig}
        globalDiscount={globalDiscount}
      />
    </div>
  );
}
