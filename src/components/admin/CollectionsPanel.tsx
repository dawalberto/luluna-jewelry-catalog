import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { CollectionService, ProductService } from '../../services';
import type { CreateCollectionInput, UpdateCollectionInput } from '../../types';
import { useCollections, useProducts } from '../../utils/hooks';
import { Button, Input } from '../ui';

const collectionService = new CollectionService();
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
  if (!slug || !/^[a-z0-9]/.test(slug)) return 'collection';
  return slug;
}

function generateUniqueCollectionId(
  titleEs: string,
  titleEn: string,
  existingIds: Set<string>
): string {
  const baseSource = (titleEs || '').trim() || (titleEn || '').trim() || 'collection';
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

export default function CollectionsPanel() {
  const { t, locale } = useI18n();
  const {
    collections,
    isLoading: collectionsLoading,
    mutate: mutateCollections,
  } = useCollections();
  const { products, mutate: mutateProducts } = useProducts({ publishedOnly: false }, { limit: 100 });

  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [collectionSaving, setCollectionSaving] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [collectionForm, setCollectionForm] = useState<CreateCollectionInput>({
    id: '',
    title: { es: '', en: '' },
  });

  const autoCollectionId = useMemo(() => {
    if (editingCollectionId) return editingCollectionId;
    const existing = new Set(collections.map((c) => c.id));
    return generateUniqueCollectionId(collectionForm.title.es, collectionForm.title.en, existing);
  }, [collections, collectionForm.title.en, collectionForm.title.es, editingCollectionId]);

  const resetCollectionForm = () => {
    setEditingCollectionId(null);
    setCollectionForm({ id: '', title: { es: '', en: '' } });
  };

  const startCreateCollection = () => {
    resetCollectionForm();
    setShowCollectionForm(true);
  };

  const startEditCollection = (id: string) => {
    const existing = collections.find((c) => c.id === id);
    if (!existing) return;

    setEditingCollectionId(id);
    setCollectionForm({
      id: existing.id,
      title: {
        es: existing.title?.es ?? '',
        en: existing.title?.en ?? '',
      },
    });
    setShowCollectionForm(true);
  };

  const handleSaveCollection = async () => {
    setCollectionSaving(true);
    try {
      if (editingCollectionId) {
        const update: UpdateCollectionInput = {
          id: editingCollectionId,
          title: { es: collectionForm.title.es, en: collectionForm.title.en },
        };
        await collectionService.updateCollection(update);
        alert((t.admin as any).collectionSaved || 'Colección actualizada');
      } else {
        await collectionService.createCollection({
          id: autoCollectionId,
          title: { es: collectionForm.title.es, en: collectionForm.title.en },
        });
        alert((t.admin as any).collectionCreated || 'Colección creada');
      }

      resetCollectionForm();
      setShowCollectionForm(false);
      mutateCollections();
    } catch (err) {
      const anyErr = err as any;
      const message = typeof anyErr?.message === 'string' ? anyErr.message : '';
      console.error('Error saving collection', err);
      const errorMsg = (t.admin as any).collectionSaveError || 'Error guardando colección';
      alert(message ? `${errorMsg}: ${message}` : errorMsg);
    } finally {
      setCollectionSaving(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm((t.admin as any).collectionDeleteConfirm || '¿Estás seguro de eliminar esta colección?')) return;
    setCollectionSaving(true);
    try {
      // Remove collection from all products that have it
      const productsWithCollection = products.filter((p) => p.collectionId === id);

      for (const product of productsWithCollection) {
        await productService.updateProduct({
          id: product.id,
          collectionId: undefined,
        });
      }

      await collectionService.deleteCollection(id);
      mutateCollections();
      mutateProducts();
      alert((t.admin as any).collectionDeleted || 'Colección eliminada');
    } catch (err) {
      console.error(err);
      alert((t.admin as any).collectionDeleteError || 'Error eliminando colección');
    } finally {
      setCollectionSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-squircle shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-semibold">{(t.admin as any).collectionsTitle || 'Colecciones'}</h2>
        <Button
          type="button"
          onClick={() => {
            if (showCollectionForm) {
              setShowCollectionForm(false);
              resetCollectionForm();
            } else {
              startCreateCollection();
            }
          }}
          disabled={collectionSaving}
        >
          {showCollectionForm ? t.common.cancel : ((t.admin as any).newCollection || 'Nueva Colección')}
        </Button>
      </div>

      <p className="text-sm text-(--color-muted) mb-4">
        {(t.admin as any).collectionsDescription || 'Las colecciones permiten agrupar productos temáticamente (ej: Verano 2024, Edición Limitada).'}
      </p>

      {showCollectionForm && (
        <div className="bg-(--color-surface) p-6 rounded-squircle mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingCollectionId
              ? ((t.admin as any).editCollection || 'Editar Colección')
              : ((t.admin as any).newCollection || 'Nueva Colección')}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Título (Español) *
              </label>
              <Input
                type="text"
                value={collectionForm.title.es}
                onChange={(e) =>
                  setCollectionForm((prev) => ({
                    ...prev,
                    title: { ...prev.title, es: e.target.value },
                  }))
                }
                placeholder="Verano 2024"
                disabled={collectionSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Título (English) *
              </label>
              <Input
                type="text"
                value={collectionForm.title.en}
                onChange={(e) =>
                  setCollectionForm((prev) => ({
                    ...prev,
                    title: { ...prev.title, en: e.target.value },
                  }))
                }
                placeholder="Summer 2024"
                disabled={collectionSaving}
              />
            </div>

            <div className="bg-(--color-background) p-3 rounded-lg">
              <p className="text-xs text-(--color-muted) mb-1">ID (auto-generado):</p>
              <code className="text-sm font-mono text-(--color-primary)">{autoCollectionId}</code>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleSaveCollection}
                disabled={
                  collectionSaving ||
                  !collectionForm.title.es.trim() ||
                  !collectionForm.title.en.trim()
                }
              >
                {collectionSaving ? t.common.loading : t.common.save}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowCollectionForm(false);
                  resetCollectionForm();
                }}
                disabled={collectionSaving}
              >
                {t.common.cancel}
              </Button>
            </div>
          </div>
        </div>
      )}

      {collectionsLoading ? (
        <p className="text-center py-8 text-(--color-muted)">{t.common.loading}</p>
      ) : collections.length === 0 ? (
        <p className="text-center py-8 text-(--color-muted)">
          {(t.admin as any).noCollections || 'No hay colecciones creadas aún'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-(--color-border)">
                <th className="text-left py-3 px-2 font-semibold text-sm">ID</th>
                <th className="text-left py-3 px-2 font-semibold text-sm">
                  Español
                </th>
                <th className="text-left py-3 px-2 font-semibold text-sm">
                  English
                </th>
                <th className="text-right py-3 px-2 font-semibold text-sm">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {collections.map((collection) => (
                <tr key={collection.id} className="border-b border-(--color-border) hover:bg-(--color-surface)">
                  <td className="py-3 px-2">
                    <code className="text-xs font-mono text-(--color-muted)">{collection.id}</code>
                  </td>
                  <td className="py-3 px-2">{collection.title?.es ?? '-'}</td>
                  <td className="py-3 px-2">{collection.title?.en ?? '-'}</td>
                  <td className="py-3 px-2 text-right space-x-2">
                    <button
                      onClick={() => startEditCollection(collection.id)}
                      disabled={collectionSaving}
                      className="text-(--color-primary) hover:underline text-sm disabled:opacity-50"
                    >
                      {t.common.edit}
                    </button>
                    <button
                      onClick={() => handleDeleteCollection(collection.id)}
                      disabled={collectionSaving}
                      className="text-red-600 hover:underline text-sm disabled:opacity-50"
                    >
                      {t.common.delete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
