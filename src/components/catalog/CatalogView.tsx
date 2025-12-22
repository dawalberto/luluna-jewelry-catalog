import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { GlobalDiscountService, PricingService } from '../../services';
import type { GlobalDiscount, PricingConfig, ProductCategory } from '../../types';
import { loadCatalogState } from '../../utils';
import { useProducts, useTags } from '../../utils/hooks';
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | undefined>(undefined);
  const [globalDiscount, setGlobalDiscount] = useState<GlobalDiscount | undefined>(undefined);
  type SortBy = 'none' | 'price-asc' | 'price-desc' | 'popularity';
  const [sortBy, setSortBy] = useState<SortBy>('none');
  const [scrollToRestore, setScrollToRestore] = useState<number | null>(null);

  // Load saved catalog state on mount (client-side only)
  useEffect(() => {
    const savedState = loadCatalogState();
    if (savedState) {
      setSelectedCategory(savedState.selectedCategory || 'all');
      setSelectedTags(savedState.selectedTags || []);
      setSearchQuery(savedState.searchQuery || '');
      // Migrar el estado antiguo al nuevo formato
      const legacyState = savedState as any;
      if (legacyState.sortBy === 'price' && legacyState.priceSortOrder) {
        setSortBy(legacyState.priceSortOrder === 'asc' ? 'price-asc' : 'price-desc');
      } else {
        setSortBy(savedState.sortBy || 'none');
      }
      
      // Store scroll position to restore after products load
      if (savedState.scrollPosition) {
        setScrollToRestore(savedState.scrollPosition);
      }
    }
  }, []);

  const filters = {
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: searchQuery || undefined,
    publishedOnly: true,
  };

  const { products, isLoading } = useProducts(filters, { limit: 50 });
  const { tags: dbTags } = useTags();

  // Filter by tags client-side
  const tagFilteredProducts = useMemo(() => {
    if (selectedTags.length === 0) return products;
    
    return products.filter((product) => {
      if (!product.tags || product.tags.length === 0) return false;
      // Product must have ALL selected tags
      return selectedTags.every((tag) => product.tags!.includes(tag));
    });
  }, [products, selectedTags]);

  // Get all unique tags from database for the filter UI
  const availableTags = useMemo(() => {
    // Get tags that are actually used in products
    const usedTagIds = new Set<string>();
    products.forEach((product) => {
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach((tagId) => {
          if (tagId && typeof tagId === 'string') {
            usedTagIds.add(tagId);
          }
        });
      }
    });

    // Return tags that are used, with their translated labels
    return dbTags
      .filter((tag) => usedTagIds.has(tag.id))
      .map((tag) => ({
        id: tag.id,
        label: tag.title?.[locale] ?? tag.title?.es ?? tag.id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [products, dbTags, locale]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((t) => t !== tagId);
      }
      return [...prev, tagId];
    });
  };

  // Restore scroll position after products are loaded
  useEffect(() => {
    if (!isLoading && scrollToRestore !== null) {
      // Use setTimeout to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        window.scrollTo({
          top: scrollToRestore,
          behavior: 'instant' as ScrollBehavior,
        });
        setScrollToRestore(null); // Clear after restoring
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, scrollToRestore]);

  const sortedProducts = useMemo(() => {
    // Sort by popularity if selected
    if (sortBy === 'popularity') {
      const withMeta = tagFilteredProducts.map((product, index) => {
        const title =
          product.title?.[locale] ??
          product.title?.es ??
          product.title?.en ??
          '';
        return { product, index, popularity: product.popularity ?? 0, title };
      });

      withMeta.sort((a, b) => {
        // Sort by popularity descending (higher is better)
        const diff = b.popularity - a.popularity;
        if (diff !== 0) return diff;

        // If same popularity, sort by title
        const byTitle = a.title.localeCompare(b.title);
        return byTitle !== 0 ? byTitle : a.index - b.index;
      });

      return withMeta.map((x) => x.product);
    }

    // Sort by price if selected
    if (sortBy === 'price-asc' || sortBy === 'price-desc') {
      const priceSortOrder = sortBy === 'price-asc' ? 'asc' : 'desc';
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

      const withMeta = tagFilteredProducts.map((product, index) => {
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
    }

    // Default: no sorting
    return tagFilteredProducts;
  }, [tagFilteredProducts, sortBy, pricingConfig, globalDiscount?.active, globalDiscount?.percent, locale]);

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
    <div className="container mx-auto px-4 py-6 md:py-12">
      <div className="text-center mb-8 md:mb-16">
        <h1 className="text-4xl md:text-7xl font-black text-black mb-6 uppercase tracking-tighter">{t.catalog.title}</h1>
        <p className="text-lg font-body text-gray-600 max-w-2xl mx-auto mt-4">{t.catalog.subtitle}</p>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center mb-10">
        <SearchBar onSearch={setSearchQuery} initialValue={searchQuery} />
      </div>

      {/* Category Filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Tags Filter */}
      {availableTags.length > 0 && (
        <div className="mb-8 mt-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-4 text-center">
            {(t.catalog as any).filterByTags || 'Filtrar por etiquetas'}
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {availableTags.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleTag(id)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                  selectedTags.includes(id)
                    ? 'bg-[#2E6A77] text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                {t.common.clear || 'Limpiar filtros'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sort */}
      <div className="mb-8 mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">{t.catalog.sortBy}</span>
          <div className="flex gap-2">
            <button
              type="button"
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                sortBy === 'none'
                  ? 'bg-[#2E6A77] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setSortBy('none')}
            >
              {t.catalog.sortDefault}
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                sortBy === 'popularity'
                  ? 'bg-[#2E6A77] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setSortBy('popularity')}
            >
              {t.catalog.sortPopularity}
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                sortBy === 'price-asc'
                  ? 'bg-[#2E6A77] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setSortBy('price-asc')}
            >
              {t.catalog.sortPriceAsc}
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                sortBy === 'price-desc'
                  ? 'bg-[#2E6A77] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setSortBy('price-desc')}
            >
              {t.catalog.sortPriceDesc}
            </button>
          </div>
        </div>
      </div>

      {globalDiscount?.active && globalDiscount.percent > 0 && (
        <div className="mb-12 bg-[#2E6A77]/5 border border-[#2E6A77]/20 px-8 py-8 text-center">
          <div className="text-sm font-medium text-[#2E6A77] uppercase tracking-widest mb-2">{t.catalog.promoTitle}</div>
          <div className="text-2xl font-heading font-medium text-black mb-4">
            {(() => {
              const localizedTitle =
                globalDiscount.title?.[locale] ??
                globalDiscount.title?.es ??
                globalDiscount.title?.en ??
                '';

              return (
                <>
                  <span>{localizedTitle}</span>
                  {localizedTitle ? ' — ' : ''}
                </>
              );
            })()}
            <span className="ml-2 text-[#2E6A77]">{globalDiscount.percent}% OFF</span>
          </div>
          {(() => {
            const localizedDescription =
              globalDiscount.description?.[locale] ??
              globalDiscount.description?.es ??
              globalDiscount.description?.en ??
              '';

            return localizedDescription ? (
              <div className="text-sm text-gray-500 max-w-2xl mx-auto">{localizedDescription}</div>
            ) : (
              <div className="text-sm text-gray-500 max-w-2xl mx-auto">{t.catalog.promoDescription}</div>
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
        catalogState={{
          selectedCategory,
          selectedTags,
          searchQuery,
          sortBy,
        }}
      />
    </div>
  );
}
