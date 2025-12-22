import React, { useState } from 'react';
import { cloudinaryConfig } from '../../config/env';
import { useI18n } from '../../i18n';
import { ProductService } from '../../services';
import type { CreateProductInput, MultilingualText, ProductCategory, ProductPriceType } from '../../types';
import { Button, Input } from '../ui';

const productService = new ProductService();

interface ProductFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProductForm({ onSuccess, onCancel }: ProductFormProps) {
  const { t } = useI18n();

  const [formData, setFormData] = useState<CreateProductInput>({
    title: { es: '', en: '' },
    description: { es: '', en: '' },
    categories: ['rings'],
    pricing: { type: 'S' },
    discount: { enabled: false, percent: 0, description: '' },
    isNew: false,
    images: [],
    published: false,
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: keyof CreateProductInput, value: any, lang?: 'es' | 'en') => {
    if (lang) {
      setFormData((prev) => ({
        ...prev,
        [field]: { ...(prev[field] as MultilingualText), [lang]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const toggleCategory = (category: ProductCategory) => {
    setFormData((prev) => {
      const has = prev.categories.includes(category);
      const next = has
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      return {
        ...prev,
        categories: next.length > 0 ? next : prev.categories,
      };
    });
  };

  const setPriceType = (type: ProductPriceType) => {
    setFormData((prev) => {
      if (type === 'custom') {
        return {
          ...prev,
          pricing: {
            type,
            customPrice: prev.pricing.type === 'custom' ? prev.pricing.customPrice : 0,
          },
        };
      }
      return { ...prev, pricing: { type } };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!cloudinaryConfig.cloudName) {
      setError('Cloudinary cloud name is missing. Check PUBLIC_CLOUDINARY_CLOUD_NAME in .env');
      return;
    }

    if (!cloudinaryConfig.uploadPreset || cloudinaryConfig.uploadPreset === 'your_upload_preset') {
      setError(
        'Cloudinary upload preset is missing/invalid. Create an unsigned upload preset in Cloudinary and set PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env'
      );
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', cloudinaryConfig.uploadPreset);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await response.json().catch(() => ({} as any));
        if (!response.ok) {
          const message = data?.error?.message || `Cloudinary upload failed (HTTP ${response.status})`;
          throw new Error(message);
        }

        const url = (data as any)?.secure_url;
        if (typeof url !== 'string' || url.length === 0) {
          throw new Error('Cloudinary upload succeeded but no secure_url was returned');
        }
        return url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls.filter((u) => typeof u === 'string' && u.length > 0)],
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error uploading images';
      setError(message);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!formData.images || formData.images.length === 0) {
      setSaving(false);
      setError('Please upload at least one product image before saving.');
      return;
    }

    if (!formData.categories || formData.categories.length === 0) {
      setSaving(false);
      setError('Please select at least one category.');
      return;
    }

    if (formData.pricing.type === 'custom') {
      const price = formData.pricing.customPrice ?? 0;
      if (!Number.isFinite(price) || price <= 0) {
        setSaving(false);
        setError('Please enter a valid custom price.');
        return;
      }
    }

    if (formData.discount?.enabled) {
      const percent = formData.discount.percent ?? 0;
      if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
        setSaving(false);
        setError('Please enter a valid discount percentage (1-100).');
        return;
      }
    }

    try {
      await productService.createProduct(formData);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Error saving product');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t.admin.productTitle}
        </label>
        <Input
          placeholder="Español"
          value={formData.title.es}
          onChange={(e) => handleInputChange('title', e.target.value, 'es')}
          required
        />
        <Input
          placeholder="English"
          value={formData.title.en}
          onChange={(e) => handleInputChange('title', e.target.value, 'en')}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t.admin.productDescription}
        </label>
        <textarea
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E6A77]"
          rows={3}
          placeholder="Español"
          value={formData.description.es}
          onChange={(e) => handleInputChange('description', e.target.value, 'es')}
          required
        />
        <textarea
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E6A77]"
          rows={3}
          placeholder="English"
          value={formData.description.en}
          onChange={(e) => handleInputChange('description', e.target.value, 'en')}
          required
        />
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.admin.productCategories}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['rings', t.categories.rings],
              ['necklaces', t.categories.necklaces],
              ['bracelets', t.categories.bracelets],
              ['earrings', t.categories.earrings],
              ['sets', t.categories.sets],
              ['custom', t.categories.custom],
            ] as Array<[ProductCategory, string]>
          ).map(([cat, label]) => (
            <label key={cat} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.categories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="w-4 h-4 text-[#2E6A77] border-gray-300 rounded focus:ring-[#2E6A77]"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">{t.admin.productPrice}</label>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t.admin.priceType}</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E6A77]"
            value={formData.pricing.type}
            onChange={(e) => setPriceType(e.target.value as ProductPriceType)}
          >
            <option value="S">{t.admin.priceTypeS}</option>
            <option value="M">{t.admin.priceTypeM}</option>
            <option value="L">{t.admin.priceTypeL}</option>
            <option value="custom">{t.admin.priceTypeCustom}</option>
          </select>
        </div>

        {formData.pricing.type === 'custom' && (
          <Input
            type="number"
            label={t.admin.customPrice}
            value={formData.pricing.customPrice ?? 0}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                pricing: { type: 'custom', customPrice: parseFloat(e.target.value) },
              }))
            }
            min="0"
            step="0.01"
            required
          />
        )}
      </div>

      {/* Discount */}
      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="discountEnabled"
            checked={!!formData.discount?.enabled}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                discount: {
                  enabled: e.target.checked,
                  percent: prev.discount?.percent ?? 0,
                  description: prev.discount?.description ?? '',
                },
              }))
            }
            className="w-4 h-4 text-[#2E6A77] border-gray-300 rounded focus:ring-[#2E6A77]"
          />
          <label htmlFor="discountEnabled" className="ml-2 text-sm text-gray-700">
            {t.admin.discountEnabled}
          </label>
        </div>

        {formData.discount?.enabled && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label={t.admin.discountPercent}
              value={formData.discount.percent}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  discount: {
                    enabled: true,
                    percent: parseFloat(e.target.value),
                    description: prev.discount?.description ?? '',
                  },
                }))
              }
              min="0"
              max="100"
              step="1"
              required
            />
            <Input
              type="text"
              label={t.admin.discountDescription}
              value={formData.discount.description ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  discount: {
                    enabled: true,
                    percent: prev.discount?.percent ?? 0,
                    description: e.target.value,
                  },
                }))
              }
            />
          </div>
        )}
      </div>

      {/* New */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isNew"
          checked={!!formData.isNew}
          onChange={(e) => handleInputChange('isNew', e.target.checked)}
          className="w-4 h-4 text-[#2E6A77] border-gray-300 rounded focus:ring-[#2E6A77]"
        />
        <label htmlFor="isNew" className="ml-2 text-sm text-gray-700">
          {t.admin.isNew}
        </label>
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.admin.productImages}
        </label>
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#2E6A77] file:text-white hover:file:bg-[#245560]"
          />
          {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
          
          {formData.images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {formData.images.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Product ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Published */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="published"
          checked={formData.published}
          onChange={(e) => handleInputChange('published', e.target.checked)}
          className="w-4 h-4 text-[#2E6A77] border-gray-300 rounded focus:ring-[#2E6A77]"
        />
        <label htmlFor="published" className="ml-2 text-sm text-gray-700">
          {t.admin.published}
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={saving || uploading}>
          {saving ? t.common.loading : t.common.save}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t.common.cancel}
          </Button>
        )}
      </div>
    </form>
  );
}
