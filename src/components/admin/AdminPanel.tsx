import { useState } from 'react';
import { useI18n } from '../../i18n';
import { Button } from '../ui';
import CategoriesPanel from './CategoriesPanel';
import CollectionsPanel from './CollectionsPanel';
import GlobalDiscountPanel from './GlobalDiscountPanel';
import HomePanel from './HomePanel';
import PricingPanel from './PricingPanel';
import ProductsPanel from './ProductsPanel';
import ShippingPanel from './ShippingPanel';
import StoragePanel from './StoragePanel';
import SubcategoriesPanel from './SubcategoriesPanel';
import TagsPanel from './TagsPanel';

function AdminPanelContent() {
  const { t } = useI18n();
  type AdminTab = 'home' | 'products' | 'pricing' | 'discount' | 'categories' | 'subcategories' | 'collections' | 'tags' | 'shippings' | 'storage';
  const [activeTab, setActiveTab] = useState<AdminTab>('products');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-900">{t.admin.title}</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label={t.admin.title}>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'products' ? 'outline' : 'ghost'}
          onClick={() => setActiveTab('products')}
          aria-current={activeTab === 'products' ? 'page' : undefined}
        >
          {t.admin.products}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'pricing' ? 'outline' : 'ghost'}
          onClick={() => setActiveTab('pricing')}
          aria-current={activeTab === 'pricing' ? 'page' : undefined}
        >
          {t.admin.pricingTitle}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'categories' ? 'outline' : 'ghost'}
          onClick={() => setActiveTab('categories')}
          aria-current={activeTab === 'categories' ? 'page' : undefined}
        >
          {t.admin.categoriesTitle}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'subcategories' ? 'outline' : 'ghost'}
          onClick={() => setActiveTab('subcategories')}
          aria-current={activeTab === 'subcategories' ? 'page' : undefined}
        >
          {(t.admin as any).subcategoriesTitle || 'Subcategorías'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'collections' ? 'outline' : 'ghost'}
          onClick={() => setActiveTab('collections')}
          aria-current={activeTab === 'collections' ? 'page' : undefined}
        >
          {(t.admin as any).collectionsTitle || 'Colecciones'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'tags' ? 'outline' : 'ghost'}
          onClick={() => setActiveTab('tags')}
          aria-current={activeTab === 'tags' ? 'page' : undefined}
        >
          {(t.admin as any).tagsTitle || 'Etiquetas'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'shippings' ? 'outline' : 'ghost'}
          onClick={() => setActiveTab('shippings')}
          aria-current={activeTab === 'shippings' ? 'page' : undefined}
        >
          {(t.admin as any).shippingsTitle || 'Envíos'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'discount' ? 'outline' : 'ghost'}
          onClick={() => setActiveTab('discount')}
          aria-current={activeTab === 'discount' ? 'page' : undefined}
        >
          {t.admin.globalDiscountTitle}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'home' ? 'outline' : 'ghost'}
          onClick={() => setActiveTab('home')}
          aria-current={activeTab === 'home' ? 'page' : undefined}
        >
          {(t.admin as any).home || 'Inicio'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'storage' ? 'outline' : 'ghost'}
          onClick={() => setActiveTab('storage')}
          aria-current={activeTab === 'storage' ? 'page' : undefined}
        >
          {(t.admin as any).storageTitle || 'Almacenamiento'}
        </Button>
      </div>

      {activeTab === 'home' && <HomePanel />}
      {activeTab === 'products' && <ProductsPanel />}
      {activeTab === 'pricing' && <PricingPanel />}
      {activeTab === 'discount' && <GlobalDiscountPanel />}
      {activeTab === 'categories' && <CategoriesPanel />}
      {activeTab === 'subcategories' && <SubcategoriesPanel />}
      {activeTab === 'collections' && <CollectionsPanel />}
      {activeTab === 'tags' && <TagsPanel />}
      {activeTab === 'shippings' && <ShippingPanel />}
      {activeTab === 'storage' && <StoragePanel />}
    </div>
  );
}

export default function AdminPanel() {
  return <AdminPanelContent />;
}
