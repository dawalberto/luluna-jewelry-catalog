import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { CategoryService } from '../../services';
import type { Subcategory, UpdateCategoryInput } from '../../types';
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

  if (!slug || !/^[a-z0-9]/.test(slug)) return 'subcategory';
  return slug;
}

function generateUniqueSubcategoryId(
  titleEs: string,
  titleEn: string,
  existingIds: Set<string>
): string {
  const baseSource = (titleEs || '').trim() || (titleEn || '').trim() || 'subcategory';
  const base = slugifyId(baseSource).slice(0, 64);

  if (!existingIds.has(base)) return base;

  for (let i = 2; i < 1000; i++) {
    const suffix = `-${i}`;
    const truncated = base.slice(0, Math.max(1, 64 - suffix.length));
    const candidate = `${truncated}${suffix}`;
    if (!existingIds.has(candidate)) return candidate;
  }

  return `${base.slice(0, 60)}-${Date.now().toString(36).slice(-3)}`;
}

type EditingKey = { parentId: string; subId: string };

export default function SubcategoriesPanel() {
  const { t, locale } = useI18n();
  const { categories, isLoading: categoriesLoading, mutate: mutateCategories } = useCategories();

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<EditingKey | null>(null);
  const [formParentId, setFormParentId] = useState('');
  const [formTitleEs, setFormTitleEs] = useState('');
  const [formTitleEn, setFormTitleEn] = useState('');

  const categoryOptions = useMemo(() => {
    return categories
      .map((c) => ({
        id: c.id,
        label: c.title?.[locale] ?? c.title?.es ?? c.title?.en ?? c.id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categories, locale]);

  const rows = useMemo(() => {
    const out: Array<{
      parentId: string;
      parentLabel: string;
      subId: string;
      subLabel: string;
    }> = [];

    categories.forEach((cat) => {
      const parentLabel = cat.title?.[locale] ?? cat.title?.es ?? cat.title?.en ?? cat.id;
      (cat.subcategories ?? []).forEach((sub) => {
        const subLabel = sub.title?.[locale] ?? sub.title?.es ?? sub.title?.en ?? sub.id;
        out.push({ parentId: cat.id, parentLabel, subId: sub.id, subLabel });
      });
    });

    out.sort((a, b) => {
      const byParent = a.parentLabel.localeCompare(b.parentLabel);
      if (byParent !== 0) return byParent;
      return a.subLabel.localeCompare(b.subLabel);
    });

    return out;
  }, [categories, locale]);

  const resetForm = () => {
    setEditing(null);
    setFormParentId('');
    setFormTitleEs('');
    setFormTitleEn('');
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (parentId: string, subId: string) => {
    const parent = categories.find((c) => c.id === parentId);
    const sub = parent?.subcategories?.find((s) => s.id === subId);
    if (!parent || !sub) return;

    setEditing({ parentId, subId });
    setFormParentId(parentId);
    setFormTitleEs(sub.title?.es ?? '');
    setFormTitleEn(sub.title?.en ?? '');
    setShowForm(true);
  };

  const upsertSubcategoryInCategory = (
    parentId: string,
    updater: (prev: Subcategory[]) => Subcategory[]
  ): UpdateCategoryInput => {
    const parent = categories.find((c) => c.id === parentId);
    const existing = parent?.subcategories ?? [];
    return {
      id: parentId,
      subcategories: updater(existing),
    };
  };

  const handleSave = async () => {
    if (!formParentId) {
      alert((t.admin as any).subcategoriesParentRequired || 'Selecciona una categoría.');
      return;
    }

    if (!formTitleEs.trim() || !formTitleEn.trim()) {
      alert((t.admin as any).subcategoryNameRequired || 'Rellena el nombre (ES y EN).');
      return;
    }

    setSaving(true);
    try {
      if (!editing) {
        const parent = categories.find((c) => c.id === formParentId);
        const existingIds = new Set((parent?.subcategories ?? []).map((s) => s.id));
        const newId = generateUniqueSubcategoryId(formTitleEs, formTitleEn, existingIds);

        const patch = upsertSubcategoryInCategory(formParentId, (prev) => [
          ...prev,
          { id: newId, title: { es: formTitleEs, en: formTitleEn } },
        ]);

        await categoryService.updateCategory(patch);
        alert((t.admin as any).subcategoryCreated || 'Subcategoría creada');
      } else {
        const { parentId: originalParentId, subId: originalSubId } = editing;

        // Same parent: update in place
        if (formParentId === originalParentId) {
          const patch = upsertSubcategoryInCategory(formParentId, (prev) =>
            prev.map((s) =>
              s.id === originalSubId
                ? { ...s, title: { es: formTitleEs, en: formTitleEn } }
                : s
            )
          );

          await categoryService.updateCategory(patch);
          alert((t.admin as any).subcategorySaved || 'Subcategoría actualizada');
        } else {
          // Move to another parent
          const originalParent = categories.find((c) => c.id === originalParentId);
          const moving = originalParent?.subcategories?.find((s) => s.id === originalSubId);
          if (!moving) throw new Error('Subcategory not found');

          const newParent = categories.find((c) => c.id === formParentId);
          const newIds = new Set((newParent?.subcategories ?? []).map((s) => s.id));
          if (newIds.has(originalSubId)) {
            throw new Error('Target category already has a subcategory with the same id');
          }

          const removePatch = upsertSubcategoryInCategory(originalParentId, (prev) =>
            prev.filter((s) => s.id !== originalSubId)
          );

          const addPatch = upsertSubcategoryInCategory(formParentId, (prev) => [
            ...prev,
            { id: originalSubId, title: { es: formTitleEs, en: formTitleEn } },
          ]);

          await categoryService.updateCategory(removePatch);
          await categoryService.updateCategory(addPatch);
          alert((t.admin as any).subcategorySaved || 'Subcategoría actualizada');
        }
      }

      resetForm();
      setShowForm(false);
      mutateCategories();
    } catch (err) {
      const anyErr = err as any;
      const message = typeof anyErr?.message === 'string' ? anyErr.message : '';
      console.error('Error saving subcategory', err);
      alert(
        message
          ? `${(t.admin as any).subcategorySaveError || 'Error guardando subcategoría'}: ${message}`
          : (t.admin as any).subcategorySaveError || 'Error guardando subcategoría'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (parentId: string, subId: string) => {
    if (!confirm((t.admin as any).subcategoryDeleteConfirm || '¿Eliminar esta subcategoría?')) return;
    setSaving(true);
    try {
      const patch = upsertSubcategoryInCategory(parentId, (prev) => prev.filter((s) => s.id !== subId));
      await categoryService.updateCategory(patch);
      mutateCategories();
      alert((t.admin as any).subcategoryDeleted || 'Subcategoría eliminada');
    } catch (err) {
      console.error(err);
      alert((t.admin as any).subcategoryDeleteError || 'Error eliminando subcategoría');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-squircle shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-semibold">{(t.admin as any).subcategoriesTitle || 'Subcategorías'}</h2>
        <Button
          type="button"
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              resetForm();
            } else {
              startCreate();
            }
          }}
          disabled={saving}
        >
          {showForm ? t.common.cancel : (t.admin as any).addSubcategory || 'Agregar subcategoría'}
        </Button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        {(t.admin as any).subcategoriesHelp ||
          'Administra subcategorías, seleccionando siempre una categoría padre.'}
      </p>

      {showForm && (
        <div className="border border-gray-200 rounded-squircle p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-xs font-semibold text-(--color-muted) mb-1 uppercase tracking-[0.18em]">
                {(t.admin as any).parentCategory || 'Categoría padre'}
              </label>
              <select
                className="w-full px-3 py-2 md:px-4 md:py-3 rounded-squircle border bg-(--color-surface-2) border-(--color-border) font-body text-(--color-text) transition-all focus:outline-none focus:ring-2 focus:ring-(--color-border-strong)"
                value={formParentId}
                onChange={(e) => setFormParentId(e.target.value)}
                disabled={saving}
              >
                <option value="" disabled>
                  {(t.admin as any).selectParentCategory || 'Selecciona una categoría'}
                </option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden sm:block" />

            <Input
              type="text"
              label={`${(t.admin as any).subcategoryName || 'Nombre'} (ES)`}
              value={formTitleEs}
              onChange={(e) => setFormTitleEs(e.target.value)}
              disabled={saving}
            />
            <Input
              type="text"
              label={`${(t.admin as any).subcategoryName || 'Name'} (EN)`}
              value={formTitleEn}
              onChange={(e) => setFormTitleEn(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <Button type="button" onClick={handleSave} disabled={saving}>
              {editing ? (t.admin as any).updateSubcategory || 'Actualizar' : (t.admin as any).createSubcategory || 'Crear'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              disabled={saving}
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
                {(t.admin as any).subcategoryName || 'Subcategoría'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {(t.admin as any).parentCategory || 'Categoría padre'}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categoriesLoading ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  {t.common.loading}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  {(t.admin as any).noSubcategories || 'Aún no hay subcategorías.'}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={`${r.parentId}:${r.subId}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{r.subLabel}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{r.parentLabel}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => startEdit(r.parentId, r.subId)}
                      className="text-gray-900 hover:text-gray-700 transition-colors"
                      disabled={saving}
                    >
                      {t.common.edit}
                    </button>
                    <button
                      onClick={() => handleDelete(r.parentId, r.subId)}
                      className="text-red-600 hover:text-red-900 ml-4 transition-colors"
                      disabled={saving}
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
