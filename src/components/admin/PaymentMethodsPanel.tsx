import { useMemo, useState } from "react"
import { useI18n } from "../../i18n"
import { PaymentMethodService } from "../../services/PaymentMethodService"
import type { CreatePaymentMethodInput, UpdatePaymentMethodInput } from "../../types/paymentMethod"
import { usePaymentMethods } from "../../utils/hooks"
import { Button, Input } from "../ui"

const paymentMethodService = new PaymentMethodService()

function slugifyId(input: string): string {
  const normalized = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

  const slug = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .replace(/-+/g, "-")

  if (!slug || !/^[a-z0-9]/.test(slug)) return "payment-method"
  return slug
}

function generateUniquePaymentMethodId(
  titleEs: string,
  titleEn: string,
  existingIds: Set<string>
): string {
  const baseSource = (titleEs || "").trim() || (titleEn || "").trim() || "payment-method"
  const base = slugifyId(baseSource).slice(0, 64)

  if (!existingIds.has(base)) return base

  for (let i = 2; i < 1000; i++) {
    const suffix = `-${i}`
    const truncated = base.slice(0, Math.max(1, 64 - suffix.length))
    const candidate = `${truncated}${suffix}`
    if (!existingIds.has(candidate)) return candidate
  }

  return `${base.slice(0, 60)}-${Date.now().toString(36).slice(-3)}`
}

export default function PaymentMethodsPanel() {
  const { t, locale } = useI18n()
  const { paymentMethods, isLoading, mutate } = usePaymentMethods()

  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreatePaymentMethodInput>({
    id: "",
    title: { es: "", en: "" },
  })

  const autoId = useMemo(() => {
    if (editingId) return editingId
    const existing = new Set(paymentMethods.map((m) => m.id))
    return generateUniquePaymentMethodId(form.title.es, form.title.en, existing)
  }, [paymentMethods, form.title.es, form.title.en, editingId])

  const resetForm = () => {
    setEditingId(null)
    setForm({
      id: "",
      title: { es: "", en: "" },
    })
  }

  const startCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const startEdit = (id: string) => {
    const existing = paymentMethods.find((m) => m.id === id)
    if (!existing) return

    setEditingId(id)
    setForm({
      id: existing.id,
      title: {
        es: existing.title?.es ?? "",
        en: existing.title?.en ?? "",
      },
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingId) {
        const update: UpdatePaymentMethodInput = {
          id: editingId,
          title: { es: form.title.es, en: form.title.en },
        }
        await paymentMethodService.updatePaymentMethod(update)
        alert((t.admin as any).paymentMethodSaved || "Método de pago actualizado")
      } else {
        await paymentMethodService.createPaymentMethod({
          id: autoId,
          title: { es: form.title.es, en: form.title.en },
        })
        alert((t.admin as any).paymentMethodCreated || "Método de pago creado")
      }

      resetForm()
      setShowForm(false)
      mutate()
    } catch (err) {
      const anyErr = err as any
      const message = typeof anyErr?.message === "string" ? anyErr.message : ""
      console.error("Error saving payment method", err)
      const errorMsg = (t.admin as any).paymentMethodSaveError || "Error guardando método de pago"
      alert(message ? `${errorMsg}: ${message}` : errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        (t.admin as any).paymentMethodDeleteConfirm ||
          "¿Estás seguro de eliminar este método de pago?"
      )
    )
      return
    setSaving(true)
    try {
      await paymentMethodService.deletePaymentMethod(id)
      mutate()
      alert((t.admin as any).paymentMethodDeleted || "Método de pago eliminado")
    } catch (err) {
      console.error(err)
      alert((t.admin as any).paymentMethodDeleteError || "Error eliminando método de pago")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-squircle shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-semibold">
          {(t.admin as any).paymentMethodsTitle || "Métodos de pago"}
        </h2>
        <Button
          type="button"
          onClick={() => {
            if (showForm) {
              setShowForm(false)
              resetForm()
            } else {
              startCreate()
            }
          }}
          disabled={saving}
        >
          {showForm ? t.common.cancel : (t.admin as any).addPaymentMethod || "Agregar método"}
        </Button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        {(t.admin as any).paymentMethodsHelp ||
          "Administra las opciones de métodos de pago (solo informativo)."}
      </p>

      {showForm && (
        <div className="border border-gray-200 rounded-squircle p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input
              type="text"
              label={`${(t.admin as any).paymentMethodTitle || "Nombre"} (ES)`}
              value={form.title.es}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  title: { ...prev.title, es: e.target.value },
                }))
              }
              disabled={saving}
              placeholder="Bizum"
            />
            <Input
              type="text"
              label={`${(t.admin as any).paymentMethodTitle || "Nombre"} (EN)`}
              value={form.title.en}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  title: { ...prev.title, en: e.target.value },
                }))
              }
              disabled={saving}
              placeholder="Bank transfer"
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" onClick={handleSave} disabled={saving}>
              {editingId
                ? (t.admin as any).updatePaymentMethod || "Actualizar"
                : (t.admin as any).createPaymentMethod || "Crear"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowForm(false)
                resetForm()
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
                {(t.admin as any).paymentMethodTitle || "Nombre"}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                  {t.common.loading}
                </td>
              </tr>
            ) : paymentMethods.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                  {(t.admin as any).noPaymentMethods || "Aún no hay métodos de pago."}
                </td>
              </tr>
            ) : (
              paymentMethods.map((method) => (
                <tr key={method.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {method.title?.[locale] ?? method.title?.es ?? method.title?.en ?? method.id}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => startEdit(method.id)}
                      className="text-gray-900 hover:text-gray-700 transition-colors"
                      disabled={saving}
                    >
                      {t.common.edit}
                    </button>
                    <button
                      onClick={() => handleDelete(method.id)}
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
  )
}
