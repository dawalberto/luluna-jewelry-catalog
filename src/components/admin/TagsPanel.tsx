import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { ProductService, TagService } from '../../services';
import type { CreateTagInput, UpdateTagInput } from '../../types';
import { useProducts, useTags } from '../../utils/hooks';
import { Button, Input } from '../ui';

const tagService = new TagService();
const productService = new ProductService();

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
  if (!slug || !/^[a-z0-9]/.test(slug)) return 'tag';
  return slug;
}

function generateUniqueTagId(
  titleEs: string,
  titleEn: string,
  existingIds: Set<string>
): string {
  const baseSource = (titleEs || '').trim() || (titleEn || '').trim() || 'tag';
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

export default function TagsPanel() {
  const { t, locale } = useI18n();
  const {
    tags,
    isLoading: tagsLoading,
    mutate: mutateTags,
  } = useTags();
  const { products, mutate: mutateProducts } = useProducts({ publishedOnly: false }, { limit: 100 });

  const [showTagForm, setShowTagForm] = useState(false);
  const [tagSaving, setTagSaving] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [tagForm, setTagForm] = useState<CreateTagInput>({
    id: '',
    title: { es: '', en: '' },
  });

  const autoTagId = useMemo(() => {
    if (editingTagId) return editingTagId;
    const existing = new Set(tags.map((t) => t.id));
    return generateUniqueTagId(tagForm.title.es, tagForm.title.en, existing);
  }, [tags, tagForm.title.en, tagForm.title.es, editingTagId]);

  const resetTagForm = () => {
    setEditingTagId(null);
    setTagForm({ id: '', title: { es: '', en: '' } });
  };

  const startCreateTag = () => {
    resetTagForm();
    setShowTagForm(true);
  };

  const startEditTag = (id: string) => {
    const existing = tags.find((t) => t.id === id);
    if (!existing) return;

    setEditingTagId(id);
    setTagForm({
      id: existing.id,
      title: {
        es: existing.title?.es ?? '',
        en: existing.title?.en ?? '',
      },
    });
    setShowTagForm(true);
  };

  const handleSaveTag = async () => {
    setTagSaving(true);
    try {
      if (editingTagId) {
        const update: UpdateTagInput = {
          id: editingTagId,
          title: { es: tagForm.title.es, en: tagForm.title.en },
        };
        await tagService.updateTag(update);
        alert((t.admin as any).tagSaved || 'Etiqueta actualizada');
      } else {
        await tagService.createTag({
          id: autoTagId,
          title: { es: tagForm.title.es, en: tagForm.title.en },
        });
        alert((t.admin as any).tagCreated || 'Etiqueta creada');
      }

      resetTagForm();
      setShowTagForm(false);
      mutateTags();
    } catch (err) {
      const anyErr = err as any;
      const message = typeof anyErr?.message === 'string' ? anyErr.message : '';
      console.error('Error saving tag', err);
      const errorMsg = (t.admin as any).tagSaveError || 'Error guardando etiqueta';
      alert(message ? `${errorMsg}: ${message}` : errorMsg);
    } finally {
      setTagSaving(false);
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm((t.admin as any).tagDeleteConfirm || '¿Estás seguro de eliminar esta etiqueta?')) return;
    setTagSaving(true);
    try {
      // Remove tag from all products that have it
      const productsWithTag = products.filter((p) => p.tags && p.tags.includes(id));

      for (const product of productsWithTag) {
        const updatedTags = product.tags!.filter((t) => t !== id);
        await productService.updateProduct({
          id: product.id,
          tags: updatedTags.length > 0 ? updatedTags : [],
        });
      }

      await tagService.deleteTag(id);
      mutateTags();
      mutateProducts();
      alert((t.admin as any).tagDeleted || 'Etiqueta eliminada');
    } catch (err) {
      console.error(err);
      alert((t.admin as any).tagDeleteError || 'Error eliminando etiqueta');
    } finally {
      setTagSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-squircle shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-semibold">{(t.admin as any).tagsTitle || 'Etiquetas'}</h2>
        <Button
          type="button"
          onClick={() => {
            if (showTagForm) {
              setShowTagForm(false);
              resetTagForm();
            } else {
              startCreateTag();
            }
          }}
          disabled={tagSaving}
        >
          {showTagForm ? t.common.cancel : ((t.admin as any).addTag || 'Agregar etiqueta')}
        </Button>
      </div>

      <p className="text-sm text-gray-600 mb-4">{(t.admin as any).tagsHelp || 'Administra las etiquetas disponibles.'}</p>

      {showTagForm && (
        <div className="border border-gray-200 rounded-squircle p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="text"
              label={`${(t.admin as any).tagName || 'Nombre'} (ES)`}
              value={tagForm.title.es}
              onChange={(e) =>
                setTagForm((prev: CreateTagInput) => ({
                  ...prev,
                  title: { ...prev.title, es: e.target.value },
                }))
              }
              disabled={tagSaving}
            />
            <Input
              type="text"
              label={`${(t.admin as any).tagName || 'Nombre'} (EN)`}
              value={tagForm.title.en}
              onChange={(e) =>
                setTagForm((prev: CreateTagInput) => ({
                  ...prev,
                  title: { ...prev.title, en: e.target.value },
                }))
              }
              disabled={tagSaving}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <Button type="button" onClick={handleSaveTag} disabled={tagSaving}>
              {editingTagId ? ((t.admin as any).updateTag || 'Actualizar') : ((t.admin as any).createTag || 'Crear')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowTagForm(false);
                resetTagForm();
              }}
              disabled={tagSaving}
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
                {(t.admin as any).tagName || 'Nombre'}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tagsLoading ? (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                  {t.common.loading}
                </td>
              </tr>
            ) : tags.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                  {(t.admin as any).noTags || 'Aún no hay etiquetas.'}
                </td>
              </tr>
            ) : (
              tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {tag.title?.[locale] ?? tag.title?.es ?? tag.title?.en ?? tag.id}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => startEditTag(tag.id)}
                      className="text-gray-900 hover:text-gray-700 transition-colors"
                      disabled={tagSaving}
                    >
                      {t.common.edit}
                    </button>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="text-red-600 hover:text-red-900 ml-4 transition-colors"
                      disabled={tagSaving}
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
