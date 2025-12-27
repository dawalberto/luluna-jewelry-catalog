import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { ShippingService } from '../../services/ShippingService';
import type { CreateShippingInput, UpdateShippingInput } from '../../types/shipping';
import { useShippings } from '../../utils/hooks';
import { Button, Input } from '../ui';

const shippingService = new ShippingService();

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

  if (!slug || !/^[a-z0-9]/.test(slug)) return 'shipping';
  return slug;
}

function generateUniqueShippingId(
  descEs: string,
  descEn: string,
  existingIds: Set<string>
): string {
  const baseSource = (descEs || '').trim() || (descEn || '').trim() || 'shipping';
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

export default function ShippingPanel() {
  const { t, locale } = useI18n();
  const { shippings, isLoading, mutate } = useShippings();

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateShippingInput>({
    id: '',
    description: { es: '', en: '' },
    deliveryTime: { es: '', en: '' },
    price: 0,
  });

  const autoId = useMemo(() => {
    if (editingId) return editingId;
    const existing = new Set(shippings.map((s) => s.id));
    return generateUniqueShippingId(form.description.es, form.description.en, existing);
  }, [shippings, form.description.es, form.description.en, editingId]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      id: '',
      description: { es: '', en: '' },
      deliveryTime: { es: '', en: '' },
      price: 0,
    });
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (id: string) => {
    const existing = shippings.find((s) => s.id === id);
    if (!existing) return;

    setEditingId(id);
    setForm({
      id: existing.id,
      description: {
        es: existing.description?.es ?? '',
        en: existing.description?.en ?? '',
      },
      deliveryTime: {
        es: existing.deliveryTime?.es ?? '',
        en: existing.deliveryTime?.en ?? '',
      },
      price: existing.price ?? 0,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const update: UpdateShippingInput = {
          id: editingId,
          description: { es: form.description.es, en: form.description.en },
          deliveryTime: { es: form.deliveryTime.es, en: form.deliveryTime.en },
          price: form.price,
        };
        await shippingService.updateShipping(update);
        alert((t.admin as any).shippingSaved || 'Envío actualizado');
      } else {
        await shippingService.createShipping({
          id: autoId,
          description: { es: form.description.es, en: form.description.en },
          deliveryTime: { es: form.deliveryTime.es, en: form.deliveryTime.en },
          price: form.price,
        });
        alert((t.admin as any).shippingCreated || 'Envío creado');
      }

      resetForm();
      setShowForm(false);
      mutate();
    } catch (err) {
      const anyErr = err as any;
      const message = typeof anyErr?.message === 'string' ? anyErr.message : '';
      console.error('Error saving shipping', err);
      const errorMsg = (t.admin as any).shippingSaveError || 'Error guardando envío';
      alert(message ? `${errorMsg}: ${message}` : errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm((t.admin as any).shippingDeleteConfirm || '¿Estás seguro de eliminar este envío?')) return;
    setSaving(true);
    try {
      await shippingService.deleteShipping(id);
      mutate();
      alert((t.admin as any).shippingDeleted || 'Envío eliminado');
    } catch (err) {
      console.error(err);
      alert((t.admin as any).shippingDeleteError || 'Error eliminando envío');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-squircle shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-semibold">{(t.admin as any).shippingsTitle || 'Envíos'}</h2>
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
          {showForm ? t.common.cancel : ((t.admin as any).addShipping || 'Agregar envío')}
        </Button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        {(t.admin as any).shippingsHelp || 'Administra las opciones de envío disponibles.'}
      </p>

      {showForm && (
        <div className="border border-gray-200 rounded-squircle p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input
              type="text"
              label={`${(t.admin as any).shippingDescription || 'Descripción'} (ES)`}
              value={form.description.es}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: { ...prev.description, es: e.target.value },
                }))
              }
              disabled={saving}
              placeholder="Envío certificado"
            />
            <Input
              type="text"
              label={`${(t.admin as any).shippingDescription || 'Descripción'} (EN)`}
              value={form.description.en}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: { ...prev.description, en: e.target.value },
                }))
              }
              disabled={saving}
              placeholder="Certified shipping"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input
              type="text"
              label={`${(t.admin as any).shippingDeliveryTime || 'Tiempo de envío'} (ES)`}
              value={form.deliveryTime.es}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  deliveryTime: { ...prev.deliveryTime, es: e.target.value },
                }))
              }
              disabled={saving}
              placeholder="48h"
            />
            <Input
              type="text"
              label={`${(t.admin as any).shippingDeliveryTime || 'Tiempo de envío'} (EN)`}
              value={form.deliveryTime.en}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  deliveryTime: { ...prev.deliveryTime, en: e.target.value },
                }))
              }
              disabled={saving}
              placeholder="48h"
            />
          </div>

          <div className="mb-4">
            <Input
              type="number"
              label={`${(t.admin as any).shippingPrice || 'Precio'} (€)`}
              value={form.price}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  price: parseFloat(e.target.value) || 0,
                }))
              }
              disabled={saving}
              min="0"
              step="0.01"
              placeholder="5"
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" onClick={handleSave} disabled={saving}>
              {editingId
                ? ((t.admin as any).updateShipping || 'Actualizar')
                : ((t.admin as any).createShipping || 'Crear')}
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
                {(t.admin as any).shippingDescription || 'Descripción'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {(t.admin as any).shippingDeliveryTime || 'Tiempo de envío'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {(t.admin as any).shippingPrice || 'Precio'}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  {t.common.loading}
                </td>
              </tr>
            ) : shippings.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  {(t.admin as any).noShippings || 'Aún no hay opciones de envío.'}
                </td>
              </tr>
            ) : (
              shippings.map((shipping) => (
                <tr key={shipping.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {shipping.description?.[locale] ??
                      shipping.description?.es ??
                      shipping.description?.en ??
                      shipping.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {shipping.deliveryTime?.[locale] ??
                      shipping.deliveryTime?.es ??
                      shipping.deliveryTime?.en ??
                      '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {shipping.price.toFixed(2)}€
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => startEdit(shipping.id)}
                      className="text-gray-900 hover:text-gray-700 transition-colors"
                      disabled={saving}
                    >
                      {t.common.edit}
                    </button>
                    <button
                      onClick={() => handleDelete(shipping.id)}
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
