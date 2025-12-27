import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import { GlobalDiscountService } from '../../services';
import type { GlobalDiscount } from '../../types';
import { Button, Input } from '../ui';

const globalDiscountService = new GlobalDiscountService();

const defaultGlobalDiscount: GlobalDiscount = {
  active: false,
  percent: 0,
  title: { es: '', en: '' },
  description: { es: '', en: '' },
};

export default function GlobalDiscountPanel() {
  const { t } = useI18n();
  const [globalDiscount, setGlobalDiscount] = useState<GlobalDiscount>(defaultGlobalDiscount);
  const [globalDiscountLoading, setGlobalDiscountLoading] = useState(true);
  const [globalDiscountSaving, setGlobalDiscountSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const config = await globalDiscountService.getGlobalDiscount();
        if (mounted) setGlobalDiscount(config);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setGlobalDiscountLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveGlobalDiscount = async () => {
    setGlobalDiscountSaving(true);
    try {
      await globalDiscountService.setGlobalDiscount(globalDiscount);
      alert(t.admin.globalDiscountSaved);
    } catch (err) {
      const anyErr = err as any;
      const code = typeof anyErr?.code === 'string' ? anyErr.code : '';
      const message = typeof anyErr?.message === 'string' ? anyErr.message : '';
      console.error('Error saving global discount', { code, message, err });

      const suffix = code ? ` (${code})` : '';
      alert(`${t.admin.globalDiscountSaveError}${suffix}`);
    } finally {
      setGlobalDiscountSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-squircle shadow-md p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-2">{t.admin.globalDiscountTitle}</h2>
      <p className="text-sm text-gray-600 mb-4">{t.admin.globalDiscountHelp}</p>

      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="globalDiscountActive"
          checked={!!globalDiscount.active}
          onChange={(e) =>
            setGlobalDiscount((prev) => ({ ...prev, active: e.target.checked }))
          }
          disabled={globalDiscountLoading || globalDiscountSaving}
          className="w-4 h-4 text-(--color-primary) border-gray-300 rounded-squircle focus:ring-(--color-border-strong)"
        />
        <label htmlFor="globalDiscountActive" className="ml-2 text-sm text-gray-700">
          {t.admin.globalDiscountActive}
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          type="number"
          label={t.admin.globalDiscountPercent}
          value={globalDiscount.percent}
          onChange={(e) =>
            setGlobalDiscount((prev) => ({ ...prev, percent: parseFloat(e.target.value) }))
          }
          min="0"
          max="100"
          step="1"
          disabled={globalDiscountLoading || globalDiscountSaving}
        />
        <Input
          type="text"
          label={`${t.admin.globalDiscountName} (ES)`}
          value={globalDiscount.title?.es ?? ''}
          onChange={(e) =>
            setGlobalDiscount((prev) => ({
              ...prev,
              title: { ...(prev.title ?? { es: '', en: '' }), es: e.target.value },
            }))
          }
          disabled={globalDiscountLoading || globalDiscountSaving}
        />
        <Input
          type="text"
          label={`${t.admin.globalDiscountName} (EN)`}
          value={globalDiscount.title?.en ?? ''}
          onChange={(e) =>
            setGlobalDiscount((prev) => ({
              ...prev,
              title: { ...(prev.title ?? { es: '', en: '' }), en: e.target.value },
            }))
          }
          disabled={globalDiscountLoading || globalDiscountSaving}
        />
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.admin.globalDiscountDescription} (ES)
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-squircle focus:outline-none focus:ring-2 focus:ring-(--color-border-strong)"
              rows={3}
              value={globalDiscount.description?.es ?? ''}
              onChange={(e) =>
                setGlobalDiscount((prev) => ({
                  ...prev,
                  description: {
                    ...(prev.description ?? { es: '', en: '' }),
                    es: e.target.value,
                  },
                }))
              }
              disabled={globalDiscountLoading || globalDiscountSaving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.admin.globalDiscountDescription} (EN)
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-squircle focus:outline-none focus:ring-2 focus:ring-(--color-border-strong)"
              rows={3}
              value={globalDiscount.description?.en ?? ''}
              onChange={(e) =>
                setGlobalDiscount((prev) => ({
                  ...prev,
                  description: {
                    ...(prev.description ?? { es: '', en: '' }),
                    en: e.target.value,
                  },
                }))
              }
              disabled={globalDiscountLoading || globalDiscountSaving}
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Button
          onClick={handleSaveGlobalDiscount}
          disabled={globalDiscountLoading || globalDiscountSaving}
        >
          {t.admin.globalDiscountSave}
        </Button>
      </div>
    </div>
  );
}
