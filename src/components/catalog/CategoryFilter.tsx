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
            className={`px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-300 rounded-squircle border ${
              isSelected
                ? 'bg-(--color-primary) text-white border-(--color-primary)'
                : 'bg-(--color-surface) text-(--color-muted) border-(--color-border) hover:border-(--color-border-strong) hover:text-(--color-text)'
            }`}
          >
            {labelFor(category)}
          </button>
        );
      })}
    </div>
  );
}
