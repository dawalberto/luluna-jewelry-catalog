import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { GlobalDiscountService, PricingService } from '../../services';
import type { GlobalDiscount, PricingConfig, ProductCategory } from '../../types';
import { loadCatalogState, saveCatalogState } from '../../utils';
import { useCategories, useProducts, useTags } from '../../utils/hooks';
import ProductGrid from './ProductGrid';
import SearchBar from './SearchBar';

const pricingService = new PricingService();
const globalDiscountService = new GlobalDiscountService();

export default function CatalogView() {
  const { t, locale } = useI18n();
  
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | undefined>(undefined);
  const [globalDiscount, setGlobalDiscount] = useState<GlobalDiscount | undefined>(undefined);
  type SortBy = 'none' | 'price-asc' | 'price-desc' | 'popularity';
  const [sortBy, setSortBy] = useState<SortBy>('none');
  const [scrollToRestore, setScrollToRestore] = useState<number | null>(null);

  const { categories: dbCategories } = useCategories();

  // Load saved catalog state on mount (client-side only)
  useEffect(() => {
    const savedState = loadCatalogState();
    if (savedState) {
      // Migrar estado legacy de categoría única a múltiples categorías
      if (savedState.selectedCategories && savedState.selectedCategories.length > 0) {
        setSelectedCategories(savedState.selectedCategories);
      } else if (savedState.selectedCategory && savedState.selectedCategory !== 'all') {
        setSelectedCategories([savedState.selectedCategory]);
      } else {
        setSelectedCategories([]);
      }
      
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

  // Save catalog state whenever filters change
  useEffect(() => {
    saveCatalogState({
      selectedCategories,
      selectedTags,
      searchQuery,
      sortBy,
      scrollPosition: 0, // Reset scroll position when filters change
    });
  }, [selectedCategories, selectedTags, searchQuery, sortBy]);

  const filters = {
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
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
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-4xl md:text-7xl font-black text-black mb-6 uppercase tracking-tighter">{t.catalog.title}</h1>
        <p className="text-lg font-body text-gray-600 max-w-2xl mx-auto mt-4">{t.catalog.subtitle}</p>
      </div>

      {/* Compact Filters Bar */}
      <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-4 md:p-6 space-y-4">
        {/* Row 1: Search and Sort */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex-1 max-w-md">
            <SearchBar onSearch={setSearchQuery} initialValue={searchQuery} />
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{t.catalog.sortBy}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2E6A77] focus:border-transparent"
            >
              <option value="none">{t.catalog.sortDefault}</option>
              <option value="popularity">{t.catalog.sortPopularity}</option>
              <option value="price-asc">{t.catalog.sortPriceAsc}</option>
              <option value="price-desc">{t.catalog.sortPriceDesc}</option>
            </select>
          </div>
        </div>

        {/* Row 2: Category Filter */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-2 whitespace-nowrap pt-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.categories.title || 'Categoría'}:
              </span>
              {selectedCategories.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategories([]);
                    // Guardar inmediatamente para evitar que se recargue el estado antiguo
                    saveCatalogState({
                      selectedCategories: [],
                      selectedTags,
                      searchQuery,
                      sortBy,
                      scrollPosition: 0,
                    });
                  }}
                  className="text-xs text-gray-400 hover:text-[#2E6A77] underline"
                  title={t.common.clear || 'Limpiar'}
                >
                  ({selectedCategories.length})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 flex-1">
              {(dbCategories.length > 0
                ? dbCategories.map((c) => c.id)
                : Object.keys((t as any)?.categories ?? {}).filter((k) => k !== 'all')
              ).map((category) => {
                const isSelected = selectedCategories.includes(category);
                const labelFor = (id: ProductCategory) => {
                  const fromDb = dbCategories.find((c) => c.id === id)?.title?.[locale];
                  if (typeof fromDb === 'string' && fromDb.length > 0) return fromDb;
                  const legacy = (t as any)?.categories?.[id];
                  if (typeof legacy === 'string') return legacy;
                  return id;
                };
                
                const toggleCategory = (cat: ProductCategory) => {
                  setSelectedCategories((prev) => {
                    if (prev.includes(cat)) {
                      return prev.filter((c) => c !== cat);
                    }
                    return [...prev, cat];
                  });
                };
                
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded transition-all ${
                      isSelected
                        ? 'bg-[#2E6A77] text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-300 hover:border-[#2E6A77] hover:text-[#2E6A77]'
                    }`}
                  >
                    {labelFor(category)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 3: Tags Filter */}
        {availableTags.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2 whitespace-nowrap pt-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {(t.catalog as any).filterByTags || 'Etiquetas'}:
                </span>
                {selectedTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTags([]);
                      // Guardar inmediatamente para evitar que se recargue el estado antiguo
                      saveCatalogState({
                        selectedCategories,
                        selectedTags: [],
                        searchQuery,
                        sortBy,
                        scrollPosition: 0,
                      });
                    }}
                    className="text-xs text-gray-400 hover:text-[#2E6A77] underline"
                    title={t.common.clear || 'Limpiar'}
                  >
                    ({selectedTags.length})
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 flex-1">
                {availableTags.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleTag(id)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                      selectedTags.includes(id)
                        ? 'bg-[#2E6A77] text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-300 hover:border-[#2E6A77] hover:text-[#2E6A77]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
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
          selectedCategories,
          selectedTags,
          searchQuery,
          sortBy,
        }}
      />
    </div>
  );
}
