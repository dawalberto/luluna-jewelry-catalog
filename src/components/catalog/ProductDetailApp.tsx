import { useEffect, useState } from 'react';
import { I18nProvider, useI18n } from '../../i18n';
import { GlobalDiscountService } from '../../services/GlobalDiscountService';
import { PricingService } from '../../services/PricingService';
import { ProductService } from '../../services/ProductService';
import type { GlobalDiscount, PricingConfig, Product } from '../../types';
import Footer from '../common/Footer';
import HeaderSimple from '../common/HeaderSimple';
import LoadingSpinner from '../ui/LoadingSpinner';
import ProductDetail from './ProductDetail';

interface ProductDetailAppProps {
  productId: string;
}

function ProductDetailAppContent({ productId }: ProductDetailAppProps) {
  const { t } = useI18n();
  const [product, setProduct] = useState<Product | null>(null);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState<GlobalDiscount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProductData = async () => {
      try {
        setLoading(true);
        setError(null);

        const productService = new ProductService();
        const pricingService = new PricingService();
        const discountService = new GlobalDiscountService();

        // Load product
        const productData = await productService.getProductById(productId);

        if (!productData) {
          setError('Producto no encontrado');
          return;
        }

        // Check if product is published
        if (!productData.published) {
          setError('Este producto no está disponible');
          return;
        }

        // Load pricing config and global discount
        const [pricing, discount] = await Promise.all([
          pricingService.getPricingConfig(),
          discountService.getGlobalDiscount(),
        ]);

        setProduct(productData);
        setPricingConfig(pricing);
        setGlobalDiscount(discount);
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <HeaderSimple />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product || !pricingConfig) {
    return (
      <div className="min-h-screen flex flex-col">
        <HeaderSimple />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || t.catalog.productNotFound || 'Producto no encontrado'}
            </h1>
            <a
              href="/luluna-jewelry-catalog/catalog"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {t.catalog.backToCatalog || t.common.back || 'Volver al catálogo'}
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderSimple />
      <main className="flex-1">
        <ProductDetail
          product={product}
          pricingConfig={pricingConfig}
          globalDiscount={globalDiscount || undefined}
        />
      </main>
      <Footer />
    </div>
  );
}

export default function ProductDetailApp({ productId }: ProductDetailAppProps) {
  return (
    <I18nProvider>
      <ProductDetailAppContent productId={productId} />
    </I18nProvider>
  );
}
