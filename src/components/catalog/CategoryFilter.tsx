import { useI18n } from '../../i18n';
import type { ProductCategory } from '../../types';
import { useCategories } from '../../utils/hooks';

interface CategoryFilterProps {
  selectedCategory?: ProductCategory | 'all';
  onCategoryChange: (category: ProductCategory | 'all') => void;
}

export default function CategoryFilter({
  selectedCategory = 'all',
  onCategoryChange,
}: CategoryFilterProps) {
  const { locale, t } = useI18n();
  const { categories: dbCategories } = useCategories();

  const categories: Array<ProductCategory | 'all'> = [
    'all',
    ...(dbCategories.length > 0
      ? dbCategories.map((c) => c.id)
      : Object.keys((t as any)?.categories ?? {}).filter((k) => k !== 'all')),
  ];

  const labelFor = (id: ProductCategory | 'all') => {
    if (id === 'all') return t.categories.all;
    const fromDb = dbCategories.find((c) => c.id === id)?.title?.[locale];
    if (typeof fromDb === 'string' && fromDb.length > 0) return fromDb;
    const legacy = (t as any)?.categories?.[id];
    if (typeof legacy === 'string') return legacy;
    return id;
  };

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {categories.map((category) => {
        const isSelected = selectedCategory === category;

        return (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-4 py-2 border-2 border-black text-sm font-bold uppercase transition-all duration-200 ${
              isSelected
                ? 'bg-[#2E6A77] text-white shadow-[2px_2px_0px_0px_#000000] -translate-y-1 -translate-x-1'
                : 'bg-white text-black hover:bg-gray-50 shadow-[2px_2px_0px_0px_#000000] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[2px_2px_0px_0px_#000000]'
            }`}
          >
            {labelFor(category)}
          </button>
        );
      })}
    </div>
  );
}
