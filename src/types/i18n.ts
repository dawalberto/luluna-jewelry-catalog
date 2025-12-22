/**
 * Supported locales
 */
export type Locale = 'es' | 'en';

/**
 * Translation keys structure
 */
export interface Translations {
  common: {
    loading: string;
    error: string;
    search: string;
    filter: string;
    clear: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    create: string;
    back: string;
    next: string;
    previous: string;
    close: string;
  };
  nav: {
    home: string;
    catalog: string;
    about: string;
    contact: string;
    admin: string;
  };
  categories: {
    all: string;
    rings: string;
    necklaces: string;
    bracelets: string;
    earrings: string;
    sets: string;
    custom: string;
  };
  product: {
    price: string;
    addToCart: string;
    viewDetails: string;
    outOfStock: string;
    inStock: string;
  };
  catalog: {
    title: string;
    subtitle: string;
    noProducts: string;
    noResults: string;
    searchPlaceholder: string;
  };
  admin: {
    title: string;
    products: string;
    addProduct: string;
    editProduct: string;
    deleteProduct: string;
    deleteConfirm: string;
    uploadImages: string;
    productTitle: string;
    productDescription: string;
    productPrice: string;
    productCategory: string;
    productImages: string;
    published: string;
    draft: string;
    saveSuccess: string;
    saveError: string;
    deleteSuccess: string;
    deleteError: string;
  };
}
