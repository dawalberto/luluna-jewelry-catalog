import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { CategoryService } from '../../services';
import type { CreateCategoryInput, UpdateCategoryInput } from '../../types';
import { useCategories } from '../../utils/hooks';
import { Button, Input } from '../ui';

const categoryService = new CategoryService();

function slugifyId(input: string): string {
  const normalized = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .replace(/-+/g, '-');

  // Must start with [a-z0-9]
  if (!slug || !/^[a-z0-9]/.test(slug)) return 'category';
  return slug;
}

function generateUniqueCategoryId(
  titleEs: string,
  titleEn: string,
  existingIds: Set<string>
): string {
  const baseSource = (titleEs || '').trim() || (titleEn || '').trim() || 'category';
  const base = slugifyId(baseSource).slice(0, 64);

  if (!existingIds.has(base)) return base;

  // Append numeric suffix, keeping within max length.
  for (let i = 2; i < 1000; i++) {
    const suffix = `-${i}`;
    const truncated = base.slice(0, Math.max(1, 64 - suffix.length));
    const candidate = `${truncated}${suffix}`;
    if (!existingIds.has(candidate)) return candidate;
  }

  // Very unlikely fallback.
  return `${base.slice(0, 60)}-${Date.now().toString(36).slice(-3)}`;
}

export default function CategoriesPanel() {
  const { t, locale } = useI18n();
  const {
    categories,
    isLoading: categoriesLoading,
    mutate: mutateCategories,
  } = useCategories();

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CreateCategoryInput>({
    id: '',
    title: { es: '', en: '' },
  });

  const autoCategoryId = useMemo(() => {
    if (editingCategoryId) return editingCategoryId;
    const existing = new Set(categories.map((c) => c.id));
    return generateUniqueCategoryId(categoryForm.title.es, categoryForm.title.en, existing);
  }, [categories, categoryForm.title.en, categoryForm.title.es, editingCategoryId]);

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryForm({ id: '', title: { es: '', en: '' } });
  };

  const startCreateCategory = () => {
    resetCategoryForm();
    setShowCategoryForm(true);
  };

  const startEditCategory = (id: string) => {
    const existing = categories.find((c) => c.id === id);
    if (!existing) return;

    setEditingCategoryId(id);
    setCategoryForm({
      id: existing.id,
      title: {
        es: existing.title?.es ?? '',
        en: existing.title?.en ?? '',
      },
    });
    setShowCategoryForm(true);
  };

  const handleSaveCategory = async () => {
    setCategorySaving(true);
    try {
      if (editingCategoryId) {
        const update: UpdateCategoryInput = {
          id: editingCategoryId,
          title: { es: categoryForm.title.es, en: categoryForm.title.en },
        };
        await categoryService.updateCategory(update);
        alert(t.admin.categorySaved);
      } else {
        await categoryService.createCategory({
          id: autoCategoryId,
          title: { es: categoryForm.title.es, en: categoryForm.title.en },
        });
        alert(t.admin.categoryCreated);
      }

      resetCategoryForm();
      setShowCategoryForm(false);
      mutateCategories();
    } catch (err) {
      const anyErr = err as any;
      const message = typeof anyErr?.message === 'string' ? anyErr.message : '';
      console.error('Error saving category', err);
      alert(message ? `${t.admin.categorySaveError}: ${message}` : t.admin.categorySaveError);
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(t.admin.categoryDeleteConfirm)) return;
    setCategorySaving(true);
    try {
      await categoryService.deleteCategory(id);
      mutateCategories();
      alert(t.admin.categoryDeleted);
    } catch (err) {
      console.error(err);
      alert(t.admin.categoryDeleteError);
    } finally {
      setCategorySaving(false);
    }
  };

  return (
    <div className="bg-white rounded-squircle shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-semibold">{t.admin.categoriesTitle}</h2>
        <Button
          type="button"
          onClick={() => {
            if (showCategoryForm) {
              setShowCategoryForm(false);
              resetCategoryForm();
            } else {
              startCreateCategory();
            }
          }}
          disabled={categorySaving}
        >
          {showCategoryForm ? t.common.cancel : t.admin.addCategory}
        </Button>
      </div>

      <p className="text-sm text-gray-600 mb-4">{t.admin.categoriesHelp}</p>

      {showCategoryForm && (
        <div className="border border-gray-200 rounded-squircle p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="text"
              label={`${t.admin.categoryName} (ES)`}
              value={categoryForm.title.es}
              onChange={(e) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  title: { ...prev.title, es: e.target.value },
                }))
              }
              disabled={categorySaving}
            />
            <Input
              type="text"
              label={`${t.admin.categoryName} (EN)`}
              value={categoryForm.title.en}
              onChange={(e) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  title: { ...prev.title, en: e.target.value },
                }))
              }
              disabled={categorySaving}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <Button type="button" onClick={handleSaveCategory} disabled={categorySaving}>
              {editingCategoryId ? t.admin.updateCategory : t.admin.createCategory}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowCategoryForm(false);
                resetCategoryForm();
              }}
              disabled={categorySaving}
            >
              {t.common.cancel}
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-squircle shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.admin.categoryName}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categoriesLoading ? (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                  {t.common.loading}
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                  {t.admin.noCategories}
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {cat.title?.[locale] ?? cat.title?.es ?? cat.title?.en ?? cat.id}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => startEditCategory(cat.id)}
                      className="text-gray-900 hover:text-gray-700 transition-colors"
                      disabled={categorySaving}
                    >
                      {t.common.edit}
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-600 hover:text-red-900 ml-4 transition-colors"
                      disabled={categorySaving}
                    >
                      {t.common.delete}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
