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

  const mainImage = product.images[0];
  const imageUrl = mainImage;

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
        <img
          src={imageUrl}
          alt={product.title[locale]}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/35 via-black/0 to-black/0" />

        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700 backdrop-blur">
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
