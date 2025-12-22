import { useState } from 'react';
import { useI18n } from '../../i18n';
import { ProductService } from '../../services';
import type { Product } from '../../types';
import { useProducts } from '../../utils/hooks';
import { Button } from '../ui';
import ProductForm from './ProductForm';

const productService = new ProductService();

function AdminPanelContent() {
  const { t, locale } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const { products, isLoading, mutate } = useProducts({ publishedOnly: false }, { limit: 100 });

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t.admin.title}</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? t.common.cancel : t.admin.addProduct}
        </Button>
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
                {t.admin.productCategory}
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
                    {t.categories[product.category]}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ${product.price.toFixed(2)}
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
