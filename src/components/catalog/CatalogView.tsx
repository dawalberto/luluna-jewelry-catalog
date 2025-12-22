import { useState } from 'react';
import type { ProductCategory } from '../../types';
import { useProducts } from '../../utils/hooks';
import CategoryFilter from './CategoryFilter';
import ProductGrid from './ProductGrid';
import SearchBar from './SearchBar';

export default function CatalogView() {
  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategory | 'all'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filters = {
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: searchQuery || undefined,
    publishedOnly: true,
  };

  const { products, isLoading } = useProducts(filters, { limit: 50 });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Bar */}
      <div className="flex justify-center mb-6">
        <SearchBar onSearch={setSearchQuery} />
      </div>

      {/* Category Filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Product Grid */}
      <ProductGrid products={products} isLoading={isLoading} />
    </div>
  );
}
