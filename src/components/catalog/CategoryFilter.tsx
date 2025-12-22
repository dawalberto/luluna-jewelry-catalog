import { useI18n } from '../../i18n';
import type { ProductCategory } from '../../types';

interface CategoryFilterProps {
  selectedCategory?: ProductCategory | 'all';
  onCategoryChange: (category: ProductCategory | 'all') => void;
}

const categories: (ProductCategory | 'all')[] = [
  'all',
  'rings',
  'necklaces',
  'bracelets',
  'earrings',
  'sets',
  'custom',
];

const categoryTranslations: Record<ProductCategory | 'all', { es: string; en: string }> = {
  all: { es: 'Todos', en: 'All' },
  rings: { es: 'Anillos', en: 'Rings' },
  necklaces: { es: 'Collares', en: 'Necklaces' },
  bracelets: { es: 'Pulseras', en: 'Bracelets' },
  earrings: { es: 'Pendientes', en: 'Earrings' },
  sets: { es: 'Conjuntos', en: 'Sets' },
  custom: { es: 'Personalizado', en: 'Custom' },
};

export default function CategoryFilter({
  selectedCategory = 'all',
  onCategoryChange,
}: CategoryFilterProps) {
  const { locale } = useI18n();

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {categories.map((category) => {
        const isSelected = selectedCategory === category;

        return (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              isSelected
                ? 'bg-[#2E6A77] text-white shadow-md'
                : 'bg-[#F9E5E5] text-gray-700 hover:bg-[#f0d0d0]'
            }`}
          >
            {categoryTranslations[category][locale]}
          </button>
        );
      })}
    </div>
  );
}
