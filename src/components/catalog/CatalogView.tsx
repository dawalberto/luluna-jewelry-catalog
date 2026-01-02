import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { GlobalDiscountService, PricingService, SiteContentService } from '../../services';
import type { GlobalDiscount, PricingConfig, ProductCategory, SiteContent } from '../../types';
import { loadCatalogState, saveCatalogState } from '../../utils';
import { useCategories, useCollections, useProducts, useTags } from '../../utils/hooks';
import ProductGrid from './ProductGrid';

const pricingService = new PricingService();
const globalDiscountService = new GlobalDiscountService();
const siteContentService = new SiteContentService();

export default function CatalogView() {
  const { t, locale } = useI18n();

  const mobileGridStorageKey = 'luluna:catalog:mobileGridColumns';
  
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | undefined>(undefined);
  const [globalDiscount, setGlobalDiscount] = useState<GlobalDiscount | undefined>(undefined);
  const [siteContent, setSiteContent] = useState<SiteContent | undefined>(undefined);
  type SortBy = 'collections' | 'price-asc' | 'price-desc' | 'popularity' | 'date-desc' | 'date-asc';
  const [sortBy, setSortBy] = useState<SortBy>('collections');
  const [scrollToRestore, setScrollToRestore] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileGridColumns, setMobileGridColumns] = useState<1 | 2>(2);

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setSelectedCollection(undefined);
    setSearchQuery('');
    setShowFilters(false);
    setSortBy('collections');

    saveCatalogState({
      selectedCategories: [],
      selectedTags: [],
      selectedCollection: undefined,
      searchQuery: '',
      sortBy: 'collections',
      scrollPosition: 0,
    });
  };

  const { categories: dbCategories } = useCategories();
  const { collections: dbCollections } = useCollections();

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
      setSelectedCollection(savedState.selectedCollection);
      setSearchQuery(savedState.searchQuery || '');
      // Migrar el estado antiguo al nuevo formato
      const legacyState = savedState as any;
      if (legacyState.sortBy === 'price' && legacyState.priceSortOrder) {
        setSortBy(legacyState.priceSortOrder === 'asc' ? 'price-asc' : 'price-desc');
      } else {
        setSortBy((savedState.sortBy as SortBy) || 'collections');
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
      scrollPosition: 0,
      selectedCollection,
    });
  }, [selectedCategories, selectedTags, searchQuery, sortBy, selectedCollection]);

  const filters = {
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    search: searchQuery || undefined,
    publishedOnly: true,
  };

  const productLimit = sortBy === 'collections' ? 500 : 50;
  const { products, isLoading } = useProducts(filters, { limit: productLimit });
  const { tags: dbTags } = useTags();

  // Filter by tags and collection client-side
  const tagAndCollectionFilteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((product) => {
        if (!product.tags || product.tags.length === 0) return false;
        // Product must have ALL selected tags
        return selectedTags.every((tag) => product.tags!.includes(tag));
      });
    }

    // Filter by collection
    if (selectedCollection) {
      filtered = filtered.filter((product) => product.collectionId === selectedCollection);
    }

    return filtered;
  }, [products, selectedTags, selectedCollection]);

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
    if (sortBy === 'collections') {
      return tagAndCollectionFilteredProducts;
    }
    // Sort by date if selected
    if (sortBy === 'date-desc' || sortBy === 'date-asc') {
      const withMeta = tagAndCollectionFilteredProducts.map((product, index) => {
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
      const withMeta = tagAndCollectionFilteredProducts.map((product, index) => {
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

      const withMeta = tagAndCollectionFilteredProducts.map((product, index) => {
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
    return tagAndCollectionFilteredProducts;
  }, [tagAndCollectionFilteredProducts, sortBy, pricingConfig, globalDiscount?.active, globalDiscount?.percent, locale]);

  const collectionGroups = useMemo(() => {
    if (sortBy !== 'collections') return [] as Array<{ id: string; label: string; products: typeof tagAndCollectionFilteredProducts }>;

    const collectionTitleFor = (collectionId: string) => {
      const fromDb = dbCollections.find((c) => c.id === collectionId);
      return fromDb?.title?.[locale] ?? fromDb?.title?.es ?? collectionId;
    };

    const groupsById = new Map<string, typeof tagAndCollectionFilteredProducts>();
    const maxCreatedAtById = new Map<string, number>();

    tagAndCollectionFilteredProducts.forEach((product) => {
      const collectionId = product.collectionId;
      const createdAt = product.createdAt?.toMillis?.() ?? 0;

      const existing = groupsById.get(collectionId);
      if (existing) {
        existing.push(product);
      } else {
        groupsById.set(collectionId, [product]);
      }

      const prevMax = maxCreatedAtById.get(collectionId) ?? 0;
      if (createdAt > prevMax) maxCreatedAtById.set(collectionId, createdAt);
    });

    const sortWithinCollectionNewestFirst = (items: typeof tagAndCollectionFilteredProducts) => {
      const withMeta = items.map((product, index) => {
        const createdAt = product.createdAt?.toMillis?.() ?? 0;
        const title = product.title?.[locale] ?? product.title?.es ?? product.title?.en ?? '';
        return { product, index, createdAt, title };
      });

      withMeta.sort((a, b) => {
        const diff = b.createdAt - a.createdAt;
        if (diff !== 0) return diff;
        const byTitle = a.title.localeCompare(b.title);
        return byTitle !== 0 ? byTitle : a.index - b.index;
      });

      return withMeta.map((x) => x.product);
    };

    const orderedCollectionIds = Array.from(groupsById.keys()).sort((a, b) => {
      const aMax = maxCreatedAtById.get(a) ?? 0;
      const bMax = maxCreatedAtById.get(b) ?? 0;
      if (aMax !== bMax) return bMax - aMax;

      // Stable tie-breaker that doesn't depend on async-loaded titles
      return a.localeCompare(b);
    });

    return orderedCollectionIds.map((id) => {
      const items = groupsById.get(id) ?? [];
      return {
        id,
        label: collectionTitleFor(id),
        products: sortWithinCollectionNewestFirst(items),
      };
    });
  }, [tagAndCollectionFilteredProducts, sortBy, dbCollections, locale]);

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
    <div className="container mx-auto px-3 py-4 md:px-4 md:py-10">
      <div className="text-center mb-5 md:mb-10">
        <div className="relative inline-block mb-4 md:mb-6">
        <h1
          className="text-4xl md:text-7xl font-dream-avenue font-light text-(--color-text) tracking-tight cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={clearAllFilters}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              clearAllFilters();
            }
          }}
        >
          {siteContent?.catalogTitle?.[locale] || t.catalog.title}
        </h1>
          {/* Pincelada acrílica/acuarela */}
          <svg 
            className="absolute left-0 right-0 -bottom-4 w-full h-4 md:h-6 pointer-events-none opacity-90"
            viewBox="0 0 300 20" 
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Gradiente para simular variaciones de acuarela */}
              <linearGradient id="watercolorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: 'var(--color-primary)', stopOpacity: 0.65 }} />
                <stop offset="20%" style={{ stopColor: 'var(--color-primary)', stopOpacity: 0.85 }} />
                <stop offset="50%" style={{ stopColor: 'var(--color-primary)', stopOpacity: 0.9 }} />
                <stop offset="80%" style={{ stopColor: 'var(--color-primary)', stopOpacity: 0.85 }} />
                <stop offset="100%" style={{ stopColor: 'var(--color-primary)', stopOpacity: 0.65 }} />
              </linearGradient>
            </defs>
            
            {/* Capa base de la pincelada con bordes irregulares */}
            <path
              d="M 5,12 Q 15,8 30,10 T 60,9 Q 80,11 100,8 T 140,10 Q 170,7 200,11 T 240,9 Q 260,10 280,8 L 295,12 Q 290,15 280,14 Q 260,16 240,13 T 200,15 Q 170,13 140,16 T 100,14 Q 80,17 60,15 T 30,16 Q 15,14 5,12 Z"
              fill="url(#watercolorGradient)"
            />
            
            {/* Capa adicional para más profundidad */}
            <path
              d="M 10,11 Q 25,9 45,10 T 85,9 Q 110,12 135,9 T 175,11 Q 205,8 235,12 T 270,10 Q 285,11 290,9"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.4"
            />
            
            {/* Trazos sueltos para efecto de pincel */}
            <path
              d="M 50,13 Q 70,11 90,13"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              d="M 150,12 Q 170,10 190,12"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.45"
            />
          </svg>
        </div>
        <p className="text-base md:text-lg mt-6 font-body text-(--color-muted) max-w-2xl mx-auto leading-relaxed font-light tracking-wide">
          {siteContent?.catalogSubtitle?.[locale] || t.catalog.subtitle}
        </p>
      </div>

      {/* Compact Filter Bar */}
      <div className="mb-4 md:mb-6 sticky top-0 z-30 bg-(--color-bg) pt-2 md:pt-0 pb-4 transition-all">
        <div className="flex items-center justify-between gap-4 border-b border-(--color-border) pb-4">
          {/* Left: Filters Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 text-(--color-text) hover:text-(--color-primary) transition-colors group"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="text-xs md:text-sm uppercase tracking-[0.15em] font-medium group-hover:opacity-70 transition-opacity">
              {t.catalog.filters}
            </span>
            {(selectedCategories.length > 0 || selectedTags.length > 0 || selectedCollection || searchQuery) && (
              <span className="bg-(--color-primary) text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                {selectedCategories.length + selectedTags.length + (selectedCollection ? 1 : 0) + (searchQuery ? 1 : 0)}
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
                  {/* {mobileGridColumns === 1 ? ( */}
                    <path d="M4 4h7v7H4V4zm10 0h7v7h-7V4zM4 14h7v7H4v-7zm10 0h7v7h-7v-7z" />
                  {/* // ) : (
                  //   <path d="M4 4h16v16H4V4z" />
                  // )} */}
               </svg>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-(--color-muted) hidden md:inline">{t.catalog.order}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="text-xs md:text-sm bg-transparent border-none text-(--color-text) focus:ring-0 cursor-pointer font-medium hover:opacity-70 transition-opacity pr-8 py-0"
              >
                <option value="collections">{(t.catalog as any).sortCollections || 'Colecciones'}</option>
                <option value="date-desc">{t.catalog.sortDateDesc}</option>
                <option value="date-asc">{t.catalog.sortDateAsc}</option>
                <option value="popularity">{t.catalog.sortPopularity}</option>
                <option value="price-asc">{t.catalog.sortPriceAsc}</option>
                <option value="price-desc">{t.catalog.sortPriceDesc}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          showFilters ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setShowFilters(false)}
      />

      {/* Sidebar Panel */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-full max-w-[320px] bg-(--color-bg) shadow-2xl transform transition-transform duration-300 ease-out ${
          showFilters ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
         <div className="flex flex-col h-full">
           {/* Sidebar Header */}
           <div className="flex items-center justify-between p-6 border-b border-(--color-border)">
              <h2 className="text-lg font-heading font-medium text-(--color-text) tracking-wide">{t.catalog.filters}</h2>
              <button 
                onClick={() => setShowFilters(false)}
                className="text-(--color-muted) hover:text-(--color-text) transition-colors p-2 hover:bg-black/5 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
           </div>

           {/* Sidebar Content */}
           <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Search
              <div>
                 <SearchBar onSearch={setSearchQuery} initialValue={searchQuery} />
              </div> */}

                            {/* Collections */}
              {dbCollections.length > 0 && (
                <div>
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-medium text-(--color-muted) uppercase tracking-[0.18em]">
                        {(t.catalog as any).filterByCollection || 'Colección'}
                      </span>
                      {selectedCollection && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCollection(undefined);
                            saveCatalogState({
                              selectedCategories,
                              selectedTags,
                              searchQuery,
                              sortBy,
                              scrollPosition: 0,
                              selectedCollection: undefined,
                            });
                          }}
                          className="text-xs text-(--color-primary) hover:underline"
                        >
                          {t.common.clear || 'Limpiar'}
                        </button>
                      )}
                   </div>
                   <div className="flex flex-col gap-2">
                      {dbCollections.map((collection) => {
                        const isSelected = selectedCollection === collection.id;
                        const label = collection.title?.[locale] ?? collection.title?.es ?? collection.id;
                        
                        return (
                          <button
                            key={collection.id}
                            type="button"
                            onClick={() => setSelectedCollection(isSelected ? undefined : collection.id)}
                            className={`text-sm text-left py-2 px-3 rounded-lg transition-all ${
                              isSelected
                                ? 'bg-(--color-primary)/10 text-(--color-primary) font-medium'
                                : 'text-(--color-text) hover:bg-black/5'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                   </div>
                </div>
              )}

              {/* Categories */}
              <div>
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium text-(--color-muted) uppercase tracking-[0.18em]">
                      {t.categories.title || 'Categoría'}
                    </span>
                    {selectedCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategories([]);
                          saveCatalogState({
                            selectedCategories: [],
                            selectedTags,
                            selectedCollection,
                            searchQuery,
                            sortBy,
                            scrollPosition: 0,
                          });
                        }}
                        className="text-xs text-(--color-primary) hover:underline"
                      >
                        {t.common.clear || 'Limpiar'}
                      </button>
                    )}
                 </div>
                 <div className="flex flex-col gap-2">
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
                          className={`text-sm text-left py-2 px-3 rounded-lg transition-all ${
                            isSelected
                              ? 'bg-(--color-primary)/10 text-(--color-primary) font-medium'
                              : 'text-(--color-text) hover:bg-black/5'
                          }`}
                        >
                          {labelFor(category)}
                        </button>
                      );
                    })}
                 </div>
              </div>

              {/* Tags */}
              {availableTags.length > 0 && (
                <div>
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-medium text-(--color-muted) uppercase tracking-[0.18em]">
                        {(t.catalog as any).filterByTags || 'Etiquetas'}
                      </span>
                      {selectedTags.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTags([]);
                            saveCatalogState({
                              selectedCategories,
                              selectedTags: [],
                              selectedCollection,
                              searchQuery,
                              sortBy,
                              scrollPosition: 0,
                            });
                          }}
                          className="text-xs text-(--color-primary) hover:underline"
                        >
                          {t.common.clear || 'Limpiar'}
                        </button>
                      )}
                   </div>
                   <div className="flex flex-wrap gap-2">
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
              )}
           </div>
           
           {/* Sidebar Footer */}
           <div className="p-6 border-t border-(--color-border) bg-(--color-surface)/50">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full py-3 bg-(--color-primary) text-white text-sm uppercase tracking-widest font-medium hover:bg-(--color-primary)/90 transition-colors"
              >
                Ver Resultados
              </button>
           </div>
         </div>
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
      {sortBy === 'collections' ? (
        isLoading || collectionGroups.length === 0 ? (
          <ProductGrid
            products={[]}
            isLoading={isLoading}
            pricingConfig={pricingConfig}
            globalDiscount={globalDiscount}
            mobileColumns={mobileGridColumns}
            catalogState={{
              selectedCategories,
              selectedTags,
              selectedCollection,
              searchQuery,
              sortBy,
            }}
          />
        ) : (
          <div className="space-y-16">
            {collectionGroups.map((group) => (
              <section key={group.id} className="scroll-mt-24">
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-base md:text-xl font-dream-avenue text-(--color-muted)">
                    {group.label}
                  </h2>
                  <div className="flex-1 border-t border-(--color-border)" />
                </div>
                <ProductGrid
                  products={group.products}
                  pricingConfig={pricingConfig}
                  globalDiscount={globalDiscount}
                  mobileColumns={mobileGridColumns}
                  catalogState={{
                    selectedCategories,
                    selectedTags,
                    selectedCollection,
                    searchQuery,
                    sortBy,
                  }}
                />
              </section>
            ))}
          </div>
        )
      ) : (
        <ProductGrid
          products={sortedProducts}
          isLoading={isLoading}
          pricingConfig={pricingConfig}
          globalDiscount={globalDiscount}
          mobileColumns={mobileGridColumns}
          catalogState={{
            selectedCategories,
            selectedTags,
            selectedCollection,
            searchQuery,
            sortBy,
          }}
        />
      )}

      {/* Download PDF Button */}
      {/* <DownloadPDFButton
        pdfOptions={{
          products: sortedProducts,
          pricingTiers: pricingConfig ?? null,
          globalDiscount: globalDiscount ?? null,
          locale,
          selectedCategories,
          selectedTags,
          selectedCollection,
          searchQuery,
        }}
      /> */}
    </div>
  );
}
