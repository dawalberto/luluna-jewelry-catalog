import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import type { GlobalDiscount, PricingConfig, Product, ProductCategory } from '../../types';
import { formatPrice } from '../../utils';
import { useCategories } from '../../utils/hooks';

interface ProductCardProps {
  product: Product;
  pricingConfig?: PricingConfig;
  globalDiscount?: GlobalDiscount;
  onClick?: () => void;
}

export default function ProductCard({ product, pricingConfig, globalDiscount, onClick }: ProductCardProps) {
  const { locale, t } = useI18n();
  const { categories: dbCategories } = useCategories();

  const images = useMemo(() => (Array.isArray(product.images) ? product.images : []), [product.images]);
  const hasMultipleImages = images.length > 1;
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const suppressClickRef = useRef(false);
  const pointerDragRef = useRef<{
    pointerId: number | null;
    startX: number;
    startScrollLeft: number;
    isDragging: boolean;
  }>({ pointerId: null, startX: 0, startScrollLeft: 0, isDragging: false });
  const scrollRafRef = useRef<number | null>(null);

  // Reset carousel when product changes
  useEffect(() => {
    setActiveImageIndex(0);
    setIsAutoPlaying(true);
    suppressClickRef.current = false;

    const scroller = scrollerRef.current;
    if (scroller) {
      scroller.scrollLeft = 0;
    }
  }, [product.id]);

  const stopAutoplay = () => {
    setIsAutoPlaying(false);
  };

  const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const width = scroller.getBoundingClientRect().width;
    if (!width || !Number.isFinite(width)) return;
    scroller.scrollTo({ left: index * width, behavior });
  };

  // Auto-advance images unless user interacts
  useEffect(() => {
    if (!hasMultipleImages) return;
    if (!isAutoPlaying) return;

    const scroller = scrollerRef.current;
    if (!scroller) return;

    const intervalId = window.setInterval(() => {
      const nextIndex = (activeImageIndex + 1) % images.length;
      scrollToIndex(nextIndex, 'smooth');
      setActiveImageIndex(nextIndex);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [activeImageIndex, hasMultipleImages, images.length, isAutoPlaying]);

  const imageUrl = images[activeImageIndex] || images[0];

  const handleImageContainerClickCapture = (e: React.MouseEvent) => {
    if (!hasMultipleImages) return;
    if (!suppressClickRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    suppressClickRef.current = false;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!hasMultipleImages) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('button')) return;

    const scroller = scrollerRef.current;
    if (!scroller) return;

    stopAutoplay();

    pointerDragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScrollLeft: scroller.scrollLeft,
      isDragging: true,
    };

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!hasMultipleImages) return;
    const state = pointerDragRef.current;
    if (!state.isDragging) return;
    if (state.pointerId !== e.pointerId) return;

    const scroller = scrollerRef.current;
    if (!scroller) return;

    const deltaX = e.clientX - state.startX;
    if (Math.abs(deltaX) > 8) suppressClickRef.current = true;

    scroller.scrollLeft = state.startScrollLeft - deltaX;
  };

  const snapToNearest = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const width = scroller.getBoundingClientRect().width;
    if (!width || !Number.isFinite(width)) return;
    const nextIndex = Math.max(0, Math.min(images.length - 1, Math.round(scroller.scrollLeft / width)));
    setActiveImageIndex(nextIndex);
    scrollToIndex(nextIndex, 'smooth');
  };

  const onPointerUpOrCancel = (e: React.PointerEvent) => {
    const state = pointerDragRef.current;
    if (!state.isDragging) return;
    if (state.pointerId !== e.pointerId) return;
    state.isDragging = false;
    state.pointerId = null;
    snapToNearest();
  };

  const onScrollerScroll = () => {
    if (!hasMultipleImages) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;

    if (scrollRafRef.current != null) {
      window.cancelAnimationFrame(scrollRafRef.current);
    }
    scrollRafRef.current = window.requestAnimationFrame(() => {
      const width = scroller.getBoundingClientRect().width;
      if (!width || !Number.isFinite(width)) return;
      const idx = Math.max(0, Math.min(images.length - 1, Math.round(scroller.scrollLeft / width)));
      setActiveImageIndex((prev) => (prev === idx ? prev : idx));
    });
  };

  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasMultipleImages) return;
    const nextIndex = (activeImageIndex - 1 + images.length) % images.length;
    stopAutoplay();
    setActiveImageIndex(nextIndex);
    scrollToIndex(nextIndex, 'smooth');
  };

  const goNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasMultipleImages) return;
    const nextIndex = (activeImageIndex + 1) % images.length;
    stopAutoplay();
    setActiveImageIndex(nextIndex);
    scrollToIndex(nextIndex, 'smooth');
  };

  const categories = useMemo(() => {
    const list: ProductCategory[] = Array.isArray(product.categories) && product.categories.length > 0
      ? product.categories
      : product.category
        ? [product.category]
        : [];
    return list;
  }, [product.categories, product.category]);

  const categoryLabel = useMemo(() => {
    if (categories.length === 0) return '';
    const first = categories[0];
    const fromDb = dbCategories.find((c) => c.id === first)?.title?.[locale];
    const base =
      (typeof fromDb === 'string' && fromDb.length > 0
        ? fromDb
        : (t as any)?.categories?.[first] ?? first) as string;
    if (categories.length <= 1) return base;
    return `${base} +${categories.length - 1}`;
  }, [categories, dbCategories, locale, t]);

  const basePrice = useMemo(() => {
    if (product.pricing) {
      if (product.pricing.type === 'custom') {
        const price = product.pricing.customPrice;
        return typeof price === 'number' && Number.isFinite(price) ? price : null;
      }

      const tier = product.pricing.type;
      if (!pricingConfig) return null;
      const tierPrice = pricingConfig[tier];
      return typeof tierPrice === 'number' && Number.isFinite(tierPrice) ? tierPrice : null;
    }

    if (typeof product.price === 'number' && Number.isFinite(product.price)) return product.price;
    return null;
  }, [product.pricing, product.price, pricingConfig]);

  const effectiveDiscountPercent = useMemo(() => {
    if (product.discount?.enabled) {
      const percent = product.discount.percent;
      return typeof percent === 'number' && Number.isFinite(percent) ? percent : 0;
    }

    if (globalDiscount?.active) {
      const percent = globalDiscount.percent;
      return typeof percent === 'number' && Number.isFinite(percent) ? percent : 0;
    }

    return 0;
  }, [product.discount?.enabled, product.discount?.percent, globalDiscount?.active, globalDiscount?.percent]);

  const finalPrice = useMemo(() => {
    if (basePrice == null) return null;
    if (effectiveDiscountPercent > 0) {
      return Math.max(0, basePrice * (1 - effectiveDiscountPercent / 100));
    }
    return basePrice;
  }, [basePrice, effectiveDiscountPercent]);

  const baseUrl = import.meta.env.BASE_URL || '/';
  const productHref = `${baseUrl.replace(/\/$/, '')}/product/${product.id}`;

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const cardContent = (
    <>
      {/* Image */}
      <div
        ref={imageContainerRef}
        className="relative aspect-3/4 overflow-hidden bg-[#F5F5F5]"
        style={{ touchAction: 'pan-y' }}
        onClickCapture={handleImageContainerClickCapture}
      >
        {hasMultipleImages ? (
          <div
            ref={scrollerRef}
            className="absolute inset-0 z-0 flex w-full h-full overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUpOrCancel}
            onPointerCancel={onPointerUpOrCancel}
            onScroll={onScrollerScroll}
          >
            {images.map((src, idx) => (
              <div key={src || idx} className="h-full w-full shrink-0 snap-start">
                <img
                  src={src}
                  alt={`${product.title[locale]} - ${idx + 1}`}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="h-full w-full object-cover select-none"
                  draggable={false}
                  style={{ pointerEvents: 'none' }}
                />
              </div>
            ))}
          </div>
        ) : (
          <img
            key={`static-${activeImageIndex}`}
            src={imageUrl}
            alt={product.title[locale]}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 z-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            draggable={false}
          />
        )}

        {hasMultipleImages && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={goPrev}
              className="absolute left-1 md:left-2 top-1/2 z-20 -translate-y-1/2 bg-white/80 backdrop-blur-md p-1.5 md:p-2 text-black transition-all hover:bg-white hover:scale-105 active:scale-95 pointer-events-auto rounded-squircle opacity-100 md:opacity-0 md:group-hover:opacity-100 duration-300"
            >
              <svg
                className="h-3 w-3 md:h-4 md:w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <button
              type="button"
              aria-label="Next image"
              onClick={goNext}
              className="absolute right-1 md:right-2 top-1/2 z-20 -translate-y-1/2 bg-white/80 backdrop-blur-md p-1.5 md:p-2 text-black transition-all hover:bg-white hover:scale-105 active:scale-95 pointer-events-auto rounded-squircle opacity-100 md:opacity-0 md:group-hover:opacity-100 duration-300"
            >
              <svg
                className="h-3 w-3 md:h-4 md:w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}

        <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-black/35 via-black/0 to-black/0" />

        {!!categoryLabel && (
          <div className="absolute left-2 top-2 md:left-3 md:top-3 z-20 bg-white/90 backdrop-blur-sm px-2 py-0.5 md:px-3 md:py-1 text-[9px] md:text-[10px] font-medium uppercase tracking-widest text-black">
            {categoryLabel}
          </div>
        )}

        {product.isNew && (
          <div className="absolute right-2 top-2 md:right-3 md:top-3 z-20 bg-(--color-primary) px-2 py-0.5 md:px-3 md:py-1 text-[9px] md:text-[10px] font-medium uppercase tracking-widest text-white">
            {t.admin.isNew}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 md:p-5 bg-white text-center no-radius">
        <h3 className="text-sm md:text-lg font-heading font-medium leading-tight text-(--color-text) line-clamp-2">
          {product.title[locale]}
        </h3>

        <p className="mt-1 md:mt-2 text-xs md:text-sm font-body text-gray-500 line-clamp-2 font-light">
          {product.description[locale]}
        </p>

        <div className="mt-2 md:mt-4 flex items-center justify-center gap-1 md:gap-2">
          {finalPrice == null ? (
            <span className="text-base md:text-lg font-medium text-gray-400">-</span>
          ) : effectiveDiscountPercent > 0 && basePrice != null && finalPrice !== basePrice ? (
            <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-0">
              <span className="text-xs md:text-sm text-gray-400 line-through font-light">{formatPrice(basePrice)}</span>
              <span className="text-base md:text-lg font-medium text-(--color-primary)">
                {formatPrice(finalPrice)}
              </span>
            </div>
          ) : (
            <span className="text-base md:text-lg font-medium text-(--color-text)">
              {formatPrice(finalPrice)}
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <div
        onClick={handleCardClick}
        className="group relative overflow-hidden bg-white transition-shadow duration-500 hover:shadow-lg cursor-pointer"
      >
        {cardContent}
      </div>
    );
  }

  return (
    <a
      href={productHref}
      className="group relative overflow-hidden bg-white transition-shadow duration-500 hover:shadow-lg cursor-pointer block no-underline"
    >
      {cardContent}
    </a>
  );
}
