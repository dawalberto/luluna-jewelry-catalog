import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { CategoryService, GlobalDiscountService, PricingService, ProductService, TagService } from '../../services';
import type { CreateCategoryInput, CreateTagInput, GlobalDiscount, PricingConfig, Product, UpdateCategoryInput, UpdateTagInput } from '../../types';
import { useCategories, useProducts, useTags } from '../../utils/hooks';
import { Button, Input } from '../ui';
import ProductForm from './ProductForm';

const productService = new ProductService();
const pricingService = new PricingService();
const globalDiscountService = new GlobalDiscountService();
const categoryService = new CategoryService();
const tagService = new TagService();

const defaultPricing: PricingConfig = { S: 0, M: 0, L: 0 };
const defaultGlobalDiscount: GlobalDiscount = {
  active: false,
  percent: 0,
  title: { es: '', en: '' },
  description: { es: '', en: '' },
};

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
  if (!slug || !/^[a-z0-9]/.test(slug)) return 'category';
  return slug;
}

function generateUniqueCategoryId(
  titleEs: string,
  titleEn: string,
  existingIds: Set<string>
): string {
  const baseSource = (titleEs || '').trim() || (titleEn || '').trim() || 'category';
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
  type AdminTab = 'products' | 'pricing' | 'discount' | 'categories' | 'tags';
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { products, isLoading, mutate } = useProducts({ publishedOnly: false }, { limit: 100 });
  const {
    categories,
    isLoading: categoriesLoading,
    mutate: mutateCategories,
  } = useCategories();
  const {
    tags,
    isLoading: tagsLoading,
    mutate: mutateTags,
  } = useTags();
  const [pricing, setPricing] = useState<PricingConfig>(defaultPricing);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingSaving, setPricingSaving] = useState(false);

  const [globalDiscount, setGlobalDiscount] = useState<GlobalDiscount>(defaultGlobalDiscount);
  const [globalDiscountLoading, setGlobalDiscountLoading] = useState(true);
  const [globalDiscountSaving, setGlobalDiscountSaving] = useState(false);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CreateCategoryInput>({
    id: '',
    title: { es: '', en: '' },
  });

  // Tags state
  const [showTagForm, setShowTagForm] = useState(false);
  const [tagSaving, setTagSaving] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [tagForm, setTagForm] = useState<CreateTagInput>({
    id: '',
    title: { es: '', en: '' },
  });

  const autoCategoryId = useMemo(() => {
    if (editingCategoryId) return editingCategoryId;
    const existing = new Set(categories.map((c) => c.id));
    return generateUniqueCategoryId(categoryForm.title.es, categoryForm.title.en, existing);
  }, [categories, categoryForm.title.en, categoryForm.title.es, editingCategoryId]);

  const autoTagId = useMemo(() => {
    if (editingTagId) return editingTagId;
    const existing = new Set(tags.map((t) => t.id));
    return generateUniqueCategoryId(tagForm.title.es, tagForm.title.en, existing);
  }, [tags, tagForm.title.en, tagForm.title.es, editingTagId]);

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

  const productCategoryLabel = useMemo(() => {
    const categoryById = new Map(categories.map((c) => [c.id, c]));

    const localize = (id: string) => {
      const fromDb = categoryById.get(id)?.title?.[locale];
      if (typeof fromDb === 'string' && fromDb.length > 0) return fromDb;
      const legacy = (t as any)?.categories?.[id];
      if (typeof legacy === 'string') return legacy;
      return id;
    };

    return (product: Product) => {
      const categories = product.categories?.length
        ? product.categories
        : product.category
          ? [product.category]
          : [];
      if (categories.length === 0) return '-';
      return categories.map((c) => localize(c)).join(', ');
    };
  }, [categories, locale, t]);

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryForm({ id: '', title: { es: '', en: '' } });
  };

  const startCreateCategory = () => {
    resetCategoryForm();
    setShowCategoryForm(true);
  };

  const startEditCategory = (id: string) => {
    const existing = categories.find((c) => c.id === id);
    if (!existing) return;

    setEditingCategoryId(id);
    setCategoryForm({
      id: existing.id,
      title: {
        es: existing.title?.es ?? '',
        en: existing.title?.en ?? '',
      },
    });
    setShowCategoryForm(true);
  };

  const handleSaveCategory = async () => {
    setCategorySaving(true);
    try {
      if (editingCategoryId) {
        const update: UpdateCategoryInput = {
          id: editingCategoryId,
          title: { es: categoryForm.title.es, en: categoryForm.title.en },
        };
        await categoryService.updateCategory(update);
        alert(t.admin.categorySaved);
      } else {
        await categoryService.createCategory({
          id: autoCategoryId,
          title: { es: categoryForm.title.es, en: categoryForm.title.en },
        });
        alert(t.admin.categoryCreated);
      }

      resetCategoryForm();
      setShowCategoryForm(false);
      mutateCategories();
    } catch (err) {
      const anyErr = err as any;
      const message = typeof anyErr?.message === 'string' ? anyErr.message : '';
      console.error('Error saving category', err);
      alert(message ? `${t.admin.categorySaveError}: ${message}` : t.admin.categorySaveError);
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(t.admin.categoryDeleteConfirm)) return;
    setCategorySaving(true);
    try {
      await categoryService.deleteCategory(id);
      mutateCategories();
      alert(t.admin.categoryDeleted);
    } catch (err) {
      console.error(err);
      alert(t.admin.categoryDeleteError);
    } finally {
      setCategorySaving(false);
    }
  };

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    if (tab !== 'products') setShowForm(false);
    if (tab !== 'categories') {
      setShowCategoryForm(false);
      resetCategoryForm();
    }
    if (tab !== 'tags') {
      setShowTagForm(false);
      resetTagForm();
    }
  };

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
      mutate(); // Refresh products
      alert((t.admin as any).tagDeleted || 'Etiqueta eliminada');
    } catch (err) {
      console.error(err);
      alert((t.admin as any).tagDeleteError || 'Error eliminando etiqueta');
    } finally {
      setTagSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-900">{t.admin.title}</h1>
        {activeTab === 'products' && (
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
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label={t.admin.title}>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'products' ? 'outline' : 'ghost'}
          onClick={() => handleTabChange('products')}
          aria-current={activeTab === 'products' ? 'page' : undefined}
        >
          {t.admin.products}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'pricing' ? 'outline' : 'ghost'}
          onClick={() => handleTabChange('pricing')}
          aria-current={activeTab === 'pricing' ? 'page' : undefined}
        >
          {t.admin.pricingTitle}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'discount' ? 'outline' : 'ghost'}
          onClick={() => handleTabChange('discount')}
          aria-current={activeTab === 'discount' ? 'page' : undefined}
        >
          {t.admin.globalDiscountTitle}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'categories' ? 'outline' : 'ghost'}
          onClick={() => handleTabChange('categories')}
          aria-current={activeTab === 'categories' ? 'page' : undefined}
        >
          {t.admin.categoriesTitle}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'tags' ? 'outline' : 'ghost'}
          onClick={() => handleTabChange('tags')}
          aria-current={activeTab === 'tags' ? 'page' : undefined}
        >
          {(t.admin as any).tagsTitle || 'Etiquetas'}
        </Button>
      </div>

      {activeTab === 'products' && (
        <>
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
                          return `€${finalPrice.toFixed(2)}`;
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
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setShowForm(true);
                          }}
                          className="text-gray-900 hover:text-gray-700"
                        >
                          {t.common.edit}
                        </button>
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
        </>
      )}

      {activeTab === 'pricing' && (
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
      )}

      {activeTab === 'discount' && (
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
              className="w-4 h-4 text-[#2E6A77] border-gray-300 rounded-squircle focus:ring-[#2E6A77]"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-squircle focus:outline-none focus:ring-2 focus:ring-[#2E6A77]"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-squircle focus:outline-none focus:ring-2 focus:ring-[#2E6A77]"
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
      )}

      {activeTab === 'categories' && (
        <div className="bg-white rounded-squircle shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-semibold">{t.admin.categoriesTitle}</h2>
            <Button
              type="button"
              onClick={() => {
                if (showCategoryForm) {
                  setShowCategoryForm(false);
                  resetCategoryForm();
                } else {
                  startCreateCategory();
                }
              }}
              disabled={categorySaving}
            >
              {showCategoryForm ? t.common.cancel : t.admin.addCategory}
            </Button>
          </div>

          <p className="text-sm text-gray-600 mb-4">{t.admin.categoriesHelp}</p>

          {showCategoryForm && (
            <div className="border border-gray-200 rounded-squircle p-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="text"
                  label={`${t.admin.categoryName} (ES)`}
                  value={categoryForm.title.es}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      title: { ...prev.title, es: e.target.value },
                    }))
                  }
                  disabled={categorySaving}
                />
                <Input
                  type="text"
                  label={`${t.admin.categoryName} (EN)`}
                  value={categoryForm.title.en}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      title: { ...prev.title, en: e.target.value },
                    }))
                  }
                  disabled={categorySaving}
                />
              </div>

              <div className="mt-4 flex gap-2">
                <Button type="button" onClick={handleSaveCategory} disabled={categorySaving}>
                  {editingCategoryId ? t.admin.updateCategory : t.admin.createCategory}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowCategoryForm(false);
                    resetCategoryForm();
                  }}
                  disabled={categorySaving}
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
                    {t.admin.categoryName}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoriesLoading ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                      {t.common.loading}
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                      {t.admin.noCategories}
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {cat.title?.[locale] ?? cat.title?.es ?? cat.title?.en ?? cat.id}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => startEditCategory(cat.id)}
                          className="text-gray-900 hover:text-gray-700 transition-colors"
                          disabled={categorySaving}
                        >
                          {t.common.edit}
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-red-600 hover:text-red-900 ml-4 transition-colors"
                          disabled={categorySaving}
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
      )}

      {activeTab === 'tags' && (
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
      )}
    </div>
  );
}

export default function AdminPanel() {
  return <AdminPanelContent />;
}
