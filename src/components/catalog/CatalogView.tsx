import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { GlobalDiscountService, PricingService, SiteContentService } from '../../services';
import type { GlobalDiscount, PricingConfig, ProductCategory, SiteContent } from '../../types';
import { loadCatalogState, saveCatalogState } from '../../utils';
import { useCategories, useProducts, useTags } from '../../utils/hooks';
import ProductGrid from './ProductGrid';
import SearchBar from './SearchBar';

const pricingService = new PricingService();
const globalDiscountService = new GlobalDiscountService();
const siteContentService = new SiteContentService();

export default function CatalogView() {
  const { t, locale } = useI18n();

  const mobileGridStorageKey = 'luluna:catalog:mobileGridColumns';
  
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | undefined>(undefined);
  const [globalDiscount, setGlobalDiscount] = useState<GlobalDiscount | undefined>(undefined);
  const [siteContent, setSiteContent] = useState<SiteContent | undefined>(undefined);
  type SortBy = 'price-asc' | 'price-desc' | 'popularity' | 'date-desc' | 'date-asc';
  const [sortBy, setSortBy] = useState<SortBy>('date-desc');
  const [scrollToRestore, setScrollToRestore] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileGridColumns, setMobileGridColumns] = useState<1 | 2>(2);

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
        setSortBy(savedState.sortBy || 'date-desc');
      }
      
      // Store scroll position to restore after products load
      if (savedState.scrollPosition) {
        setScrollToRestore(savedState.scrollPosition);
      }
    }
  }, []);

  // Load persisted mobile grid setting
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(mobileGridStorageKey);
      if (raw === '2') setMobileGridColumns(2);
      if (raw === '1') setMobileGridColumns(1);
    } catch {
      // Ignore storage errors (private mode, blocked, etc.)
    }
  }, []);

  // Persist mobile grid setting
  useEffect(() => {
    try {
      window.localStorage.setItem(mobileGridStorageKey, String(mobileGridColumns));
    } catch {
      // Ignore storage errors
    }
  }, [mobileGridColumns]);

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
    // Sort by date if selected
    if (sortBy === 'date-desc' || sortBy === 'date-asc') {
      const withMeta = tagFilteredProducts.map((product, index) => {
        const createdAt = product.createdAt?.toMillis?.() ?? 0;
        const title =
          product.title?.[locale] ??
          product.title?.es ??
          product.title?.en ??
          '';
        return { product, index, createdAt, title };
      });

      withMeta.sort((a, b) => {
        const diff = sortBy === 'date-desc' 
          ? b.createdAt - a.createdAt  // Más reciente primero
          : a.createdAt - b.createdAt; // Más antiguo primero
        
        if (diff !== 0) return diff;

        // Si tienen la misma fecha, ordenar por título
        const byTitle = a.title.localeCompare(b.title);
        return byTitle !== 0 ? byTitle : a.index - b.index;
      });

      return withMeta.map((x) => x.product);
    }

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const content = await siteContentService.getSiteContent();
        if (mounted) setSiteContent(content);
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="container mx-auto px-3 py-4 md:px-4 md:py-12">
      <div className="text-center mb-10 md:mb-20 pt-8 md:pt-12">
        <h1 className="text-4xl md:text-7xl font-heading font-medium text-(--color-text) mb-4 md:mb-6 tracking-tight">
          {siteContent?.catalogTitle?.[locale] || t.catalog.title}
        </h1>
        <p className="text-base md:text-lg font-body text-(--color-muted) max-w-2xl mx-auto leading-relaxed font-light tracking-wide">
          {siteContent?.catalogSubtitle?.[locale] || t.catalog.subtitle}
        </p>
      </div>

      {/* Compact Filter Bar - Collapsed by default */}
      <div className="mb-8 md:mb-12 sticky top-0 z-30 bg-(--color-bg)/95 backdrop-blur-sm py-4 transition-all">
        {/* Top Bar: Filters Toggle and Sort */}
        <div className="flex items-center justify-between gap-4 border-b border-(--color-border) pb-4">
          {/* Left: Filters Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-(--color-text) hover:text-(--color-primary) transition-colors group"
          >
            <span className="text-xs md:text-sm uppercase tracking-[0.15em] font-medium group-hover:opacity-70 transition-opacity">
              {showFilters ? (locale === 'es' ? 'Cerrar Filtros' : 'Close Filters') : t.catalog.filters}
            </span>
            {(selectedCategories.length > 0 || selectedTags.length > 0 || searchQuery) && (
              <span className="bg-(--color-primary) text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                {selectedCategories.length + selectedTags.length + (searchQuery ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Right: Sort Selector */}
          <div className="flex items-center gap-4">
            {/* Mobile Grid Toggle */}
            <button
              type="button"
              onClick={() => setMobileGridColumns((prev) => (prev === 1 ? 2 : 1))}
              className="sm:hidden text-(--color-text) hover:text-(--color-primary)"
              aria-label="Cambiar columnas"
            >
               <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {mobileGridColumns === 1 ? (
                    <path d="M4 4h7v7H4V4zm10 0h7v7h-7V4zM4 14h7v7H4v-7zm10 0h7v7h-7v-7z" />
                  ) : (
                    <path d="M4 4h16v16H4V4z" />
                  )}
               </svg>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-(--color-muted) hidden md:inline">{t.catalog.order}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="text-xs md:text-sm bg-transparent border-none text-(--color-text) focus:ring-0 cursor-pointer font-medium hover:opacity-70 transition-opacity pr-8 py-0"
              >
                <option value="date-desc">{t.catalog.sortDateDesc}</option>
                <option value="date-asc">{t.catalog.sortDateAsc}</option>
                <option value="popularity">{t.catalog.sortPopularity}</option>
                <option value="price-asc">{t.catalog.sortPriceAsc}</option>
                <option value="price-desc">{t.catalog.sortPriceDesc}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters Panel - Collapsible */}
        {showFilters && (
          <div className="mt-0 bg-white/80 backdrop-blur-md border-b border-(--color-border) p-4 md:p-8 space-y-6 animate-[slideDown_0.2s_ease-out]">
            {/* Search Bar */}
            <div className="pb-6 border-b border-(--color-border)">
              <SearchBar onSearch={setSearchQuery} initialValue={searchQuery} />
            </div>

            {/* Category Filter */}
            <div className="pb-6 border-b border-(--color-border)">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex items-center gap-2 whitespace-nowrap pt-1 min-w-[120px]">
                  <span className="text-xs font-medium text-(--color-muted) uppercase tracking-[0.18em]">
                    {t.categories.title || 'Categoría'}:
                  </span>
                  {selectedCategories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategories([]);
                        saveCatalogState({
                          selectedCategories: [],
                          selectedTags,
                          searchQuery,
                          sortBy,
                          scrollPosition: 0,
                        });
                      }}
                      className="text-xs text-(--color-primary) hover:underline"
                      title={t.common.clear || 'Limpiar'}
                    >
                      ({selectedCategories.length})
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-3 flex-1">
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
                        className={`text-sm tracking-wide transition-all ${
                          isSelected
                            ? 'text-(--color-primary) font-medium underline decoration-1 underline-offset-4'
                            : 'text-(--color-text) hover:text-(--color-primary)'
                        }`}
                      >
                        {labelFor(category)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tags Filter */}
            {availableTags.length > 0 && (
              <div>
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex items-center gap-2 whitespace-nowrap pt-1 min-w-[120px]">
                    <span className="text-xs font-medium text-(--color-muted) uppercase tracking-[0.18em]">
                      {(t.catalog as any).filterByTags || 'Etiquetas'}:
                    </span>
                    {selectedTags.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTags([]);
                          saveCatalogState({
                            selectedCategories,
                            selectedTags: [],
                            searchQuery,
                            sortBy,
                            scrollPosition: 0,
                          });
                        }}
                        className="text-xs text-(--color-primary) hover:underline"
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
                        className={`px-3 py-1 text-[10px] uppercase tracking-widest transition-all border ${
                          selectedTags.includes(id)
                            ? 'bg-(--color-primary) text-white border-(--color-primary)'
                            : 'bg-transparent text-(--color-muted) border-(--color-border) hover:border-(--color-primary) hover:text-(--color-primary)'
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
        )}
      </div>

      {globalDiscount?.active && globalDiscount.percent > 0 && (
        <div className="mb-10 md:mb-16 bg-[#F4F1EA] px-4 py-8 md:px-8 md:py-12 text-center">
          <div className="text-xs font-medium text-(--color-primary) uppercase tracking-[0.25em] mb-3">{t.catalog.promoTitle}</div>
          <div className="text-2xl md:text-4xl font-heading font-medium text-(--color-text) mb-3 md:mb-5 tracking-tight">
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
            <span className="ml-3 text-(--color-primary) italic font-accent">{globalDiscount.percent}% OFF</span>
          </div>
          {(() => {
            const localizedDescription =
              globalDiscount.description?.[locale] ??
              globalDiscount.description?.es ??
              globalDiscount.description?.en ??
              '';

            return localizedDescription ? (
              <div className="text-sm md:text-base text-(--color-muted) max-w-2xl mx-auto font-light leading-relaxed">{localizedDescription}</div>
            ) : (
              <div className="text-sm md:text-base text-(--color-muted) max-w-2xl mx-auto font-light leading-relaxed">{t.catalog.promoDescription}</div>
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
        mobileColumns={mobileGridColumns}
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
