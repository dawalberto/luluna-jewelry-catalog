import { useState } from 'react';
import { useI18n } from '../../i18n';
import { PricingService, ProductService } from '../../services';
import type { PricingConfig, Product } from '../../types';
import { formatPrice } from '../../utils';
import { useCategories, useProducts } from '../../utils/hooks';
import { Button } from '../ui';
import ProductForm from './ProductForm';

const productService = new ProductService();
const pricingService = new PricingService();

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

export default function ProductsPanel() {
  const { t, locale } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { products, isLoading, mutate } = useProducts({ publishedOnly: false }, { limit: 100 });
  const { categories } = useCategories();
  const [pricing, setPricing] = useState<PricingConfig>({ S: 0, M: 0, L: 0 });

  // Load pricing config
  useState(() => {
    pricingService.getPricingConfig().then(setPricing).catch(console.error);
  });

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

  const productCategoryLabel = (product: Product) => {
    const categoryById = new Map(categories.map((c) => [c.id, c]));

    const localize = (id: string) => {
      const fromDb = categoryById.get(id)?.title?.[locale];
      if (typeof fromDb === 'string' && fromDb.length > 0) return fromDb;
      const legacy = (t as any)?.categories?.[id];
      if (typeof legacy === 'string') return legacy;
      return id;
    };

    const categoryList = product.categories?.length
      ? product.categories
      : product.category
        ? [product.category]
        : [];
    if (categoryList.length === 0) return '-';
    return categoryList.map((c) => localize(c)).join(', ');
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">{t.admin.products}</h2>
        <Button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingProduct(null);
            } else {
              setEditingProduct(null);
              setShowForm(true);
            }
          }}
        >
          {showForm ? t.common.cancel : t.admin.addProduct}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-squircle shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">
            {editingProduct ? 'Editar Producto' : t.admin.addProduct}
          </h2>
          <ProductForm
            product={editingProduct}
            onSuccess={() => {
              setShowForm(false);
              setEditingProduct(null);
              mutate();
              alert(t.admin.saveSuccess);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingProduct(null);
            }}
          />
        </div>
      )}

      <div className="bg-white rounded-squircle shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {t.admin.productTitle}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {t.admin.productDescription}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {t.admin.productCategories}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Tags
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {t.admin.productPrice}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Descuento
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Nuevo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {t.admin.productPopularity}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Creado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={11} className="px-6 py-4 text-center text-gray-500">
                  {t.common.loading}
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-4 text-center text-gray-500">
                  {t.catalog.noProducts}
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center" style={{ minWidth: '200px' }}>
                      {product.images[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.title[locale]}
                          className="w-12 h-12 rounded-squircle object-cover mr-3 shrink-0"
                        />
                      )}
                      <div className="text-sm font-medium text-gray-900">
                        {product.title[locale]}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500" style={{ maxWidth: '200px' }}>
                    <div className="line-clamp-2">
                      {product.description[locale]}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {productCategoryLabel(product)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    <div className="flex flex-wrap gap-1" style={{ maxWidth: '150px' }}>
                      {product.tags?.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-squircle"
                        >
                          {tag}
                        </span>
                      )) || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {(() => {
                      const finalPrice = getProductFinalPrice(product, pricing);
                      if (finalPrice == null) return '-';
                      return formatPrice(finalPrice);
                    })()}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {product.discount?.enabled ? (
                      <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded-squircle">
                        {product.discount.percent}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {product.isNew ? (
                      <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-squircle">
                        Nuevo
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {product.popularity ?? 0}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {product.createdAt?.toDate?.()?.toLocaleDateString?.() || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleTogglePublished(product)}
                      className={`px-2 py-1 text-xs rounded-squircle ${
                        product.published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.published ? t.admin.published : t.admin.draft}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium whitespace-nowrap">
                    <a
                      href={`/product/${product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {t.common.view}
                    </a>
                    <span className='px-2'>|</span>
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setShowForm(true);
                      }}
                      className="text-gray-900 hover:text-gray-700"
                    >
                      {t.common.edit}
                    </button>
                    <span className='px-2'>|</span>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
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
    </>
  );
}
