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
      className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* Image */}
      <div className="aspect-[4/5] overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={product.title[locale]}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
          {product.title[locale]}
        </h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description[locale]}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-[#2E6A77]">{formattedPrice}</span>

          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {categoryLabel}
          </span>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-[#2E6A77] bg-opacity-0 group-hover:bg-opacity-5 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}
