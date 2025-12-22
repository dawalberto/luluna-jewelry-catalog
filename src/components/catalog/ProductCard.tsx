import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

const categoryTranslations = {
  rings: { es: 'Anillos', en: 'Rings' },
  necklaces: { es: 'Collares', en: 'Necklaces' },
  bracelets: { es: 'Pulseras', en: 'Bracelets' },
  earrings: { es: 'Pendientes', en: 'Earrings' },
  sets: { es: 'Conjuntos', en: 'Sets' },
  custom: { es: 'Personalizado', en: 'Custom' },
};

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const { locale } = useI18n();

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
    e.stopPropagation();
    if (!hasMultipleImages) return;
    const nextIndex = (activeImageIndex - 1 + images.length) % images.length;
    stopAutoplay();
    // Moving backward should pan-right (new image comes from left)
    requestImageChange(nextIndex, 'right');
  };

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasMultipleImages) return;
    const nextIndex = (activeImageIndex + 1) % images.length;
    stopAutoplay();
    // Moving forward should pan-left (new image comes from right)
    requestImageChange(nextIndex, 'left');
  };

  const formattedPrice = new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: locale === 'es' ? 'EUR' : 'USD',
  }).format(product.price);

  const categoryLabel = categoryTranslations[product.category]?.[locale] || product.category;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-shadow duration-300 hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-3/4 overflow-hidden bg-gray-100">
        {transition ? (
          <>
            <img
              src={images[transition.fromIndex]}
              alt={product.title[locale]}
              loading="lazy"
              className={`absolute inset-0 z-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] ${
                transition.animate
                  ? transition.direction === 'left'
                    ? '-translate-x-full'
                    : 'translate-x-full'
                  : 'translate-x-0'
              }`}
            />
            <img
              src={images[transition.toIndex]}
              alt={product.title[locale]}
              loading="lazy"
              className={`absolute inset-0 z-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] ${
                transition.animate
                  ? 'translate-x-0'
                  : transition.direction === 'left'
                    ? 'translate-x-full'
                    : '-translate-x-full'
              }`}
            />
          </>
        ) : (
          <img
            src={imageUrl}
            alt={product.title[locale]}
            loading="lazy"
            className="z-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}

        {hasMultipleImages && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={goPrev}
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-800 backdrop-blur transition-colors hover:bg-white pointer-events-auto"
            >
              <svg
                className="h-5 w-5"
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
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-800 backdrop-blur transition-colors hover:bg-white pointer-events-auto"
            >
              <svg
                className="h-5 w-5"
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

        <div className="absolute left-3 top-3 z-20 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700 backdrop-blur">
          {categoryLabel}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-semibold leading-snug text-gray-900 line-clamp-2">
          {product.title[locale]}
        </h3>

        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
          {product.description[locale]}
        </p>

        <div className="mt-4 flex items-end justify-between gap-4">
          <span className="text-3xl font-bold leading-none text-(--color-primary)">
            {formattedPrice}
          </span>
        </div>
      </div>
    </div>
  );
}
