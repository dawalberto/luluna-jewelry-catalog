import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import type { GlobalDiscount, PricingConfig, Product } from '../../types';
import { siteConfig } from '../../config/env';
import { formatPrice } from '../../utils';
import { useCategories, useShippings, useTags } from '../../utils/hooks';

interface ProductDetailProps {
  product: Product;
  pricingConfig?: PricingConfig;
  globalDiscount?: GlobalDiscount;
}

export default function ProductDetail({ product, pricingConfig, globalDiscount }: ProductDetailProps) {
  const { locale, t } = useI18n();
  const { categories: dbCategories } = useCategories();
  const { tags: dbTags } = useTags();
  const { shippings } = useShippings();

  const baseUrl = import.meta.env.BASE_URL || '/';
  const withBase = (path: string) => `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

  const productLink = useMemo(() => {
    const relativePath = withBase(`/product/${product.id}`);
    return new URL(relativePath, siteConfig.url).toString();
  }, [product.id]);

  const images = useMemo(() => (Array.isArray(product.images) ? product.images : []), [product.images]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Calculate price using the same logic as ProductCard
  const { finalPrice, basePrice, discountPercent } = useMemo(() => {
    let base = 0;
    
    if (product.pricing?.type === 'custom' && product.pricing.customPrice) {
      base = product.pricing.customPrice;
    } else if (product.pricing?.type && product.pricing.type !== 'custom') {
      const tier = product.pricing.type;
      const tierPrice = pricingConfig?.[tier];
      if (typeof tierPrice === 'number' && Number.isFinite(tierPrice) && tierPrice > 0) {
        base = tierPrice;
      }
    } else if (product.price) {
      base = product.price;
    }

    let final = base;
    let discount = 0;

    // Apply product discount first
    if (product.discount?.enabled && product.discount.percent > 0) {
      discount = product.discount.percent;
      final = base * (1 - discount / 100);
    }

    // Apply global discount if no product discount
    if (discount === 0 && globalDiscount?.active && globalDiscount.percent > 0) {
      discount = globalDiscount.percent;
      final = base * (1 - discount / 100);
    }

    return {
      basePrice: base,
      finalPrice: final,
      discountPercent: discount,
    };
  }, [product, pricingConfig, globalDiscount]);

  const hasDiscount = discountPercent > 0;

  // Get category names
  const categoryNames = useMemo(() => {
    if (!product.categories || product.categories.length === 0) {
      return product.category ? [product.category] : [];
    }
    return product.categories.map((catId) => {
      const dbCat = dbCategories.find((c) => c.id === catId);
      const fromDb = (dbCat as any)?.title?.[locale] ?? (dbCat as any)?.title?.es;
      return typeof fromDb === 'string' && fromDb.length > 0 ? fromDb : catId;
    });
  }, [product.categories, product.category, dbCategories, locale]);

  // Get tag names with translations
  const tagNames = useMemo(() => {
    if (!product.tags || product.tags.length === 0) {
      return [];
    }
    return product.tags.map((tagId) => {
      const dbTag = dbTags.find((t) => t.id === tagId);
      const fromDb = dbTag?.title?.[locale] ?? dbTag?.title?.es;
      return typeof fromDb === 'string' && fromDb.length > 0 ? fromDb : tagId;
    });
  }, [product.tags, dbTags, locale]);

  const handleThumbnailClick = (index: number) => {
    setActiveImageIndex(index);
  };

  const handlePrevious = () => {
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <div className="min-h-screen bg-(--color-bg)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Button */}
        <a
          href={withBase('/catalog')}
          className="inline-flex items-center gap-2 text-(--color-primary) hover:text-(--color-gold) mb-6 sm:mb-8 group transition-colors"
        >
          <svg
            className="w-5 h-5 transition-transform group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-body">{t.common.back}</span>
        </a>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="relative aspect-square bg-(--color-surface) rounded-squircle overflow-hidden border border-(--color-border) group">
              <img
                src={images[activeImageIndex]}
                alt={product.title[locale] || product.title.es}
                className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                  isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                }`}
                onClick={toggleZoom}
              />
              
              {/* Image Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-(--color-surface-2) backdrop-blur-sm hover:bg-(--color-surface-2) text-(--color-primary) p-3 rounded-squircle transition-all opacity-0 group-hover:opacity-100 border border-(--color-border)"
                    aria-label={t.common.previous}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-(--color-surface-2) backdrop-blur-sm hover:bg-(--color-surface-2) text-(--color-primary) p-3 rounded-squircle transition-all opacity-0 group-hover:opacity-100 border border-(--color-border)"
                    aria-label={t.common.next}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-(--color-surface-2) backdrop-blur-md text-(--color-text) px-3 py-1 rounded-squircle text-xs font-body tracking-[0.22em] uppercase border border-(--color-border)">
                  {activeImageIndex + 1} / {images.length}
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <span className="bg-(--color-primary) text-white text-[10px] font-medium px-3 py-1.5 uppercase tracking-[0.2em]">
                    {t.productDetail.new}
                  </span>
                )}
                {hasDiscount && (
                  <span className="bg-(--color-gold) text-white text-[10px] font-medium px-3 py-1.5 uppercase tracking-[0.2em]">
                    -{discountPercent}%
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleThumbnailClick(index)}
                    className={`aspect-square bg-(--color-surface) rounded-squircle overflow-hidden transition-all duration-300 border border-(--color-border) ${
                      index === activeImageIndex
                        ? 'ring-1 ring-(--color-primary) opacity-100'
                        : 'opacity-60 hover:opacity-100 hover:ring-1 hover:ring-(--color-border-strong)'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title[locale] || product.title.es} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="flex flex-col pt-2">
            {/* Categories */}
            {categoryNames.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {categoryNames.map((name, index) => (
                  <span
                    key={index}
                    className="text-[10px] font-medium uppercase tracking-[0.22em] text-(--color-primary) border border-(--color-border-strong) px-3 py-1 rounded-squircle bg-(--color-surface)"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-medium text-(--color-text) mb-6 leading-tight tracking-tight">
              {product.title[locale] || product.title.es}
            </h1>

            {/* Price */}
            <div className="mb-8 pb-8 border-b border-(--color-border)">
              {hasDiscount ? (
                <div className="flex items-baseline gap-4 flex-wrap">
                  <span className="font-accent italic text-3xl md:text-4xl font-semibold text-(--color-primary)">
                    {formatPrice(finalPrice)}
                  </span>
                  <span className="font-accent italic text-xl text-(--color-muted) opacity-70 line-through font-light">
                    {formatPrice(basePrice)}
                  </span>
                  <span className="text-(--color-primary) text-[11px] font-medium px-3 py-1 bg-(--color-surface) border border-(--color-border-strong) rounded-squircle uppercase tracking-[0.18em]">
                    {t.productDetail.save} {formatPrice(basePrice - finalPrice)}
                  </span>
                </div>
              ) : (
                <span className="font-accent italic text-3xl md:text-4xl font-semibold text-(--color-text)">
                  {formatPrice(finalPrice)}
                </span>
              )}
            </div>

            {/* Discount Description */}
            {hasDiscount && product.discount?.description && (
              <div className="mb-8 p-6 bg-(--color-surface) border border-(--color-border) rounded-squircle">
                <p className="text-sm text-(--color-muted) font-body leading-relaxed">{product.discount.description}</p>
              </div>
            )}

            {/* Global Discount Banner */}
            {hasDiscount && !product.discount?.enabled && globalDiscount?.active && (
              <div className="mb-8 p-6 bg-(--color-surface) border border-(--color-border-strong) rounded-squircle">
                <p className="font-heading text-lg font-medium text-(--color-primary) mb-2">
                  {globalDiscount.title[locale] || globalDiscount.title.es}
                </p>
                {globalDiscount.description && (
                  <p className="text-sm text-(--color-muted) font-body font-light leading-relaxed">
                    {globalDiscount.description[locale] || globalDiscount.description.es}
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            <div className="mb-12">
              <p className="font-body text-base md:text-lg text-(--color-muted) leading-relaxed whitespace-pre-line font-light">
                {product.description[locale] || product.description.es}
              </p>
            </div>

            {/* Contact CTA */}
            <div className="mt-auto space-y-6">
              <h3 className="font-heading text-lg font-medium text-(--color-text) mb-4 text-center uppercase tracking-widest">
                {t.productDetail.shopViaDM}
              </h3>
              
              <a
                href="https://www.instagram.com/lulunajoyas/"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-squircle w-full bg-(--color-surface) hover:bg-(--color-surface-2) text-(--color-text) border border-(--color-border-strong) font-body text-base md:text-lg font-medium py-5 px-6 transition-all text-center tracking-wide"
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>{t.productDetail.contactInstagram}</span>
                </div>
              </a>

              <a
                href={`https://wa.me/659020036?text=${encodeURIComponent(
                  `${t.productDetail.whatsappMessage} ${productLink}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-squircle w-full bg-(--color-primary) hover:brightness-95 text-white font-body text-base md:text-lg font-medium py-5 px-6 transition-all text-center tracking-wide"
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>{t.productDetail.contactWhatsApp}</span>
                </div>
              </a>
            </div>

            {/* Product Features */}
            <div className="mt-10 pt-8 border-t border-gray-100">
              <h3 className="font-heading text-xs font-medium text-(--color-text) mb-6 uppercase tracking-widest">
                {t.productDetail.features || 'Características'}
              </h3>
              <ul className="space-y-4 font-body text-(--color-muted) font-light">
                <li className="flex items-start gap-3">
                  <span className="text-(--color-gold) mt-1">•</span>
                  <span>{t.productDetail.feature1}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-(--color-gold) mt-1">•</span>
                  <span>{t.productDetail.feature2}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-(--color-gold) mt-1">•</span>
                  <span>{t.productDetail.feature3}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-(--color-gold) mt-1">•</span>
                  <span>{t.productDetail.feature4}</span>
                </li>
              </ul>
            </div>

            {/* Tags - Subtle display */}
            {tagNames.length > 0 && (
              <div className="mt-8 pt-6 border-t border-(--color-border)">
                <div className="flex flex-wrap gap-2">
                  {tagNames.map((tagName, index) => (
                    <span
                      key={index}
                      className="text-xs text-(--color-muted) bg-(--color-surface) px-3 py-1 rounded-squircle font-light tracking-wide border border-(--color-border)"
                    >
                      {tagName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping Options */}
            {shippings.length > 0 && (
              <div className="mt-10 pt-8 border-t border-(--color-border)">
                <h3 className="font-heading text-xs font-medium text-(--color-text) mb-6 uppercase tracking-widest">
                  {(t.productDetail as any).shippingOptions || 'Opciones de envío'}
                </h3>
                <div className="space-y-4">
                  {shippings.map((shipping) => (
                    <div
                      key={shipping.id}
                      className="flex items-center justify-between p-4 bg-(--color-surface) rounded-squircle border border-(--color-border)"
                    >
                      <div className="flex-1">
                        <p className="font-body text-sm font-medium text-(--color-text) mb-1">
                          {shipping.description?.[locale] ?? shipping.description?.es}
                        </p>
                        <p className="font-body text-xs text-(--color-muted)">
                          {shipping.deliveryTime?.[locale] ?? shipping.deliveryTime?.es}
                        </p>
                      </div>
                      <div className="ml-4">
                        <span className="font-accent italic text-lg font-semibold text-(--color-primary)">
                          {formatPrice(shipping.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
