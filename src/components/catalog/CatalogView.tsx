import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { GlobalDiscountService, PricingService } from '../../services';
import type { GlobalDiscount, PricingConfig, ProductCategory } from '../../types';
import { useProducts } from '../../utils/hooks';
import { Button } from '../ui';
import CategoryFilter from './CategoryFilter';
import ProductGrid from './ProductGrid';
import SearchBar from './SearchBar';

const pricingService = new PricingService();
const globalDiscountService = new GlobalDiscountService();

export default function CatalogView() {
  const { t, locale } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategory | 'all'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | undefined>(undefined);
  const [globalDiscount, setGlobalDiscount] = useState<GlobalDiscount | undefined>(undefined);
  type PriceSortOrder = 'none' | 'asc' | 'desc';
  const [priceSortOrder, setPriceSortOrder] = useState<PriceSortOrder>('none');

  const filters = {
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: searchQuery || undefined,
    publishedOnly: true,
  };

  const { products, isLoading } = useProducts(filters, { limit: 50 });

  const sortedProducts = useMemo(() => {
    if (priceSortOrder === 'none') return products;

    const getBasePrice = (product: any): number | null => {
      const pricing = product?.pricing;
      if (pricing) {
        if (pricing.type === 'custom') {
          const price = pricing.customPrice;
          return typeof price === 'number' && Number.isFinite(price) ? price : null;
        }

        if (!pricingConfig) return null;
        const tierPrice = (pricingConfig as any)[pricing.type];
        return typeof tierPrice === 'number' && Number.isFinite(tierPrice) ? tierPrice : null;
      }

      const legacy = product?.price;
      return typeof legacy === 'number' && Number.isFinite(legacy) ? legacy : null;
    };

    const getFinalPrice = (product: any): number | null => {
      const base = getBasePrice(product);
      if (base == null) return null;

      if (product?.discount?.enabled) {
        const percent = product.discount.percent;
        if (typeof percent === 'number' && Number.isFinite(percent) && percent > 0) {
          return Math.max(0, base * (1 - percent / 100));
        }
      }

      if (globalDiscount?.active) {
        const percent = globalDiscount.percent;
        if (typeof percent === 'number' && Number.isFinite(percent) && percent > 0) {
          return Math.max(0, base * (1 - percent / 100));
        }
      }

      return base;
    };

    const withMeta = products.map((product, index) => {
      const title =
        product.title?.[locale] ??
        product.title?.es ??
        product.title?.en ??
        '';
      return { product, index, price: getFinalPrice(product), title };
    });

    withMeta.sort((a, b) => {
      const aPrice = a.price;
      const bPrice = b.price;

      if (aPrice == null && bPrice == null) {
        const byTitle = a.title.localeCompare(b.title);
        return byTitle !== 0 ? byTitle : a.index - b.index;
      }
      if (aPrice == null) return 1;
      if (bPrice == null) return -1;

      const diff = priceSortOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice;
      if (diff !== 0) return diff;

      const byTitle = a.title.localeCompare(b.title);
      return byTitle !== 0 ? byTitle : a.index - b.index;
    });

    return withMeta.map((x) => x.product);
  }, [products, priceSortOrder, pricingConfig, globalDiscount?.active, globalDiscount?.percent, locale]);

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

      {/* Sort */}
      <div className="mb-6 mt-6 flex items-center justify-end gap-2">
        <span className="text-sm text-gray-600">{t.catalog.sortByPrice}</span>
        <Button
          type="button"
          size="sm"
          variant={priceSortOrder === 'asc' ? 'primary' : 'outline'}
          onClick={() => setPriceSortOrder('asc')}
        >
          {t.catalog.sortPriceLowHigh}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={priceSortOrder === 'desc' ? 'primary' : 'outline'}
          onClick={() => setPriceSortOrder('desc')}
        >
          {t.catalog.sortPriceHighLow}
        </Button>
      </div>

      {globalDiscount?.active && globalDiscount.percent > 0 && (
        <div className="mb-6 rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-100">
          <div className="text-sm font-semibold text-gray-900">{t.catalog.promoTitle}</div>
          <div className="mt-1 text-sm text-gray-700">
            {(() => {
              const localizedTitle =
                globalDiscount.title?.[locale] ??
                globalDiscount.title?.es ??
                globalDiscount.title?.en ??
                '';

              return (
                <>
                  <span className="font-medium">{localizedTitle}</span>
                  {localizedTitle ? ' — ' : ''}
                </>
              );
            })()}
            {globalDiscount.percent}%
          </div>
          {(() => {
            const localizedDescription =
              globalDiscount.description?.[locale] ??
              globalDiscount.description?.es ??
              globalDiscount.description?.en ??
              '';

            return localizedDescription ? (
              <div className="mt-1 text-sm text-gray-600">{localizedDescription}</div>
            ) : (
              <div className="mt-1 text-sm text-gray-600">{t.catalog.promoDescription}</div>
            );
          })()}
        </div>
      )}

      {/* Product Grid */}
      <ProductGrid
        products={sortedProducts}
        isLoading={isLoading}
        pricingConfig={pricingConfig}
        globalDiscount={globalDiscount}
      />
    </div>
  );
}
