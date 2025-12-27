import { useEffect, useMemo, useState } from 'react';
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
  const [transition, setTransition] = useState<null | {
    fromIndex: number;
    toIndex: number;
    direction: 'left' | 'right';
    animate: boolean;
  }>(null);

  // Reset carousel when product changes
  useEffect(() => {
    setActiveImageIndex(0);
    setIsAutoPlaying(true);
    setTransition(null);
  }, [product.id]);

  const requestImageChange = (nextIndex: number, direction: 'left' | 'right') => {
    if (!hasMultipleImages) return;
    if (transition) return;
    if (nextIndex === activeImageIndex) return;

    setTransition({
      fromIndex: activeImageIndex,
      toIndex: nextIndex,
      direction,
      animate: false,
    });
  };

  useEffect(() => {
    if (!transition) return;

    const rafId = transition.animate
      ? 0
      : window.requestAnimationFrame(() => {
          setTransition((prev) => {
            if (!prev) return prev;
            if (prev.animate) return prev;
            return { ...prev, animate: true };
          });
        });

    const timeoutId = window.setTimeout(() => {
      setActiveImageIndex(transition.toIndex);
      setTransition(null);
    }, 520);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [transition]);

  // Auto-advance images unless user interacts
  useEffect(() => {
    if (!hasMultipleImages) return;
    if (!isAutoPlaying) return;
    if (transition) return;

    const intervalId = window.setInterval(() => {
      const nextIndex = (activeImageIndex + 1) % images.length;
      // Moving forward should pan-left (new image comes from right)
      requestImageChange(nextIndex, 'left');
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [activeImageIndex, hasMultipleImages, images.length, isAutoPlaying, transition]);

  const imageUrl = images[activeImageIndex] || images[0];

  const stopAutoplay = () => {
    setIsAutoPlaying(false);
  };

  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasMultipleImages) return;
    const nextIndex = (activeImageIndex - 1 + images.length) % images.length;
    stopAutoplay();
    // Moving backward should pan-right (new image comes from left)
    requestImageChange(nextIndex, 'right');
  };

  const goNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasMultipleImages) return;
    const nextIndex = (activeImageIndex + 1) % images.length;
    stopAutoplay();
    // Moving forward should pan-left (new image comes from right)
    requestImageChange(nextIndex, 'left');
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
      <div className="relative aspect-3/4 overflow-hidden bg-[#F5F5F5]">
        {transition ? (
          <>
            {/* Outgoing image */}
            <img
              key={`out-${transition.fromIndex}`}
              src={images[transition.fromIndex]}
              alt={product.title[locale]}
              loading="lazy"
              className={`absolute inset-0 z-[1] h-full w-full object-cover transition-transform duration-500 ease-out ${
                transition.animate
                  ? transition.direction === 'left'
                    ? '-translate-x-full'
                    : 'translate-x-full'
                  : 'translate-x-0'
              }`}
              style={{ willChange: transition.animate ? 'transform' : 'auto' }}
            />
            {/* Incoming image */}
            <img
              key={`in-${transition.toIndex}`}
              src={images[transition.toIndex]}
              alt={product.title[locale]}
              loading="lazy"
              className={`absolute inset-0 z-[2] h-full w-full object-cover transition-transform duration-500 ease-out ${
                transition.animate
                  ? 'translate-x-0'
                  : transition.direction === 'left'
                    ? 'translate-x-full'
                    : '-translate-x-full'
              }`}
              style={{ willChange: transition.animate ? 'transform' : 'auto' }}
            />
          </>
        ) : (
          <img
            key={`static-${activeImageIndex}`}
            src={imageUrl}
            alt={product.title[locale]}
            loading="lazy"
            className="absolute inset-0 z-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
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
