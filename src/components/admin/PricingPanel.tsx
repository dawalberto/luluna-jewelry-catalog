import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import { PricingService } from '../../services';
import type { PricingConfig } from '../../types';
import { Button, Input } from '../ui';

const pricingService = new PricingService();

export default function PricingPanel() {
  const { t } = useI18n();
  const [pricing, setPricing] = useState<PricingConfig>({ S: 0, M: 0, L: 0 });
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingSaving, setPricingSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const config = await pricingService.getPricingConfig();
        if (mounted) setPricing(config);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setPricingLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSavePricing = async () => {
    setPricingSaving(true);
    try {
      await pricingService.setPricingConfig(pricing);
      alert(t.admin.pricingSaved);
    } catch (err) {
      const anyErr = err as any;
      const code = typeof anyErr?.code === 'string' ? anyErr.code : '';
      const message = typeof anyErr?.message === 'string' ? anyErr.message : '';

      console.error('Error saving pricing', { code, message, err });

      const suffix = code ? ` (${code})` : '';
      alert(`${t.admin.pricingSaveError}${suffix}`);
    } finally {
      setPricingSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-squircle shadow-md p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-2">{t.admin.pricingTitle}</h2>
      <p className="text-sm text-gray-600 mb-4">{t.admin.pricingSizes}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          type="number"
          label={t.admin.pricingS}
          value={pricing.S}
          onChange={(e) => setPricing((prev) => ({ ...prev, S: parseFloat(e.target.value) }))}
          min="0"
          step="0.01"
          disabled={pricingLoading || pricingSaving}
        />
        <Input
          type="number"
          label={t.admin.pricingM}
          value={pricing.M}
          onChange={(e) => setPricing((prev) => ({ ...prev, M: parseFloat(e.target.value) }))}
          min="0"
          step="0.01"
          disabled={pricingLoading || pricingSaving}
        />
        <Input
          type="number"
          label={t.admin.pricingL}
          value={pricing.L}
          onChange={(e) => setPricing((prev) => ({ ...prev, L: parseFloat(e.target.value) }))}
          min="0"
          step="0.01"
          disabled={pricingLoading || pricingSaving}
        />
      </div>

      <div className="mt-4">
        <Button onClick={handleSavePricing} disabled={pricingLoading || pricingSaving}>
          {t.admin.pricingSave}
        </Button>
      </div>
    </div>
  );
}
