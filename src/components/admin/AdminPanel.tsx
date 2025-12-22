import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { PricingService, ProductService } from '../../services';
import type { PricingConfig, Product } from '../../types';
import { useProducts } from '../../utils/hooks';
import { Button, Input } from '../ui';
import ProductForm from './ProductForm';

const productService = new ProductService();
const pricingService = new PricingService();

const defaultPricing: PricingConfig = { S: 0, M: 0, L: 0 };

function getProductBasePrice(product: Product, pricing: PricingConfig): number | null {
  if (product.pricing) {
    if (product.pricing.type === 'custom') {
      const price = product.pricing.customPrice;
      return typeof price === 'number' && Number.isFinite(price) ? price : null;
    }

    const tierPrice = pricing[product.pricing.type];
    return typeof tierPrice === 'number' && Number.isFinite(tierPrice) ? tierPrice : null;
  }

  if (typeof product.price === 'number' && Number.isFinite(product.price)) {
    return product.price;
  }

  return null;
}

function getProductFinalPrice(product: Product, pricing: PricingConfig): number | null {
  const base = getProductBasePrice(product, pricing);
  if (base == null) return null;

  if (product.discount?.enabled) {
    const percent = product.discount.percent;
    if (typeof percent === 'number' && Number.isFinite(percent) && percent > 0) {
      return Math.max(0, base * (1 - percent / 100));
    }
  }

  return base;
}

function AdminPanelContent() {
  const { t, locale } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const { products, isLoading, mutate } = useProducts({ publishedOnly: false }, { limit: 100 });
  const [pricing, setPricing] = useState<PricingConfig>(defaultPricing);
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

  const handleDelete = async (id: string) => {
    if (!confirm(t.admin.deleteConfirm)) return;

    try {
      await productService.deleteProduct(id);
      mutate();
      alert(t.admin.deleteSuccess);
    } catch (err) {
      alert(t.admin.deleteError);
      console.error(err);
    }
  };

  const handleTogglePublished = async (product: Product) => {
    try {
      await productService.togglePublished(product.id);
      mutate();
    } catch (err) {
      console.error(err);
    }
  };

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

      // Give a more actionable error to confirm if this is a rules/auth issue.
      const suffix = code ? ` (${code})` : '';
      alert(`${t.admin.pricingSaveError}${suffix}`);
    } finally {
      setPricingSaving(false);
    }
  };

  const productCategoryLabel = useMemo(() => {
    return (product: Product) => {
      const categories = product.categories?.length
        ? product.categories
        : product.category
          ? [product.category]
          : [];
      if (categories.length === 0) return '-';
      return categories.map((c) => t.categories[c]).join(', ');
    };
  }, [t.categories]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t.admin.title}</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? t.common.cancel : t.admin.addProduct}
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
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

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">{t.admin.addProduct}</h2>
          <ProductForm
            onSuccess={() => {
              setShowForm(false);
              mutate();
              alert(t.admin.saveSuccess);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.admin.productTitle}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.admin.productCategories}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.admin.productPrice}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.common.edit}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  {t.common.loading}
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  {t.catalog.noProducts}
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {product.images[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.title[locale]}
                          className="w-12 h-12 rounded object-cover mr-3"
                        />
                      )}
                      <div className="text-sm font-medium text-gray-900">
                        {product.title[locale]}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {productCategoryLabel(product)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {(() => {
                      const finalPrice = getProductFinalPrice(product, pricing);
                      if (finalPrice == null) return '-';
                      return `$${finalPrice.toFixed(2)}`;
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleTogglePublished(product)}
                      className={`px-2 py-1 text-xs rounded-full ${
                        product.published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.published ? t.admin.published : t.admin.draft}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900 ml-4"
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

export default function AdminPanel() {
  return <AdminPanelContent />;
}
