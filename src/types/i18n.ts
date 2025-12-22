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
    title: string;
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
  productDetail: {
    new: string;
    save: string;
    description: string;
    shopViaDM: string;
    contactInstagram: string;
    contactWhatsApp: string;
    whatsappMessage: string;
    secureCheckout: string;
    features: string;
    feature1: string;
    feature2: string;
    feature3: string;
    feature4: string;
  };
  catalog: {
    title: string;
    subtitle: string;
    promoTitle: string;
    promoDescription: string;
    sortBy: string;
    sortDefault: string;
    sortPopularity: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    noProducts: string;
    noResults: string;
    searchPlaceholder: string;
  };
  admin: {
    title: string;
    products: string;

    // Categories
    categoriesTitle: string;
    categoriesHelp: string;
    addCategory: string;
    createCategory: string;
    updateCategory: string;
    categoryId: string;
    categoryName: string;
    noCategories: string;
    categoryCreated: string;
    categorySaved: string;
    categorySaveError: string;
    categoryDeleteConfirm: string;
    categoryDeleted: string;
    categoryDeleteError: string;

    // Tags
    tagsTitle: string;
    tagsHelp: string;
    addTag: string;
    createTag: string;
    updateTag: string;
    tagName: string;
    noTags: string;
    tagCreated: string;
    tagSaved: string;
    tagSaveError: string;
    tagDeleteConfirm: string;
    tagDeleted: string;
    tagDeleteError: string;
    productTags: string;

    // Auth / access control
    loginTitle: string;
    email: string;
    password: string;
    signIn: string;
    signOut: string;
    checkingAccess: string;
    notAuthorized: string;
    signInError: string;
    adminCheckError: string;
    emailLinkHelp: string;
    linkSent: string;

    addProduct: string;
    editProduct: string;
    deleteProduct: string;
    deleteConfirm: string;
    uploadImages: string;
    productTitle: string;
    productDescription: string;
    productPrice: string;
    productCategory: string;
    productCategories: string;
    productPopularity: string;
    productPopularityHelp: string;
    pricingTitle: string;
    pricingSizes: string;
    pricingS: string;
    pricingM: string;
    pricingL: string;
    pricingSave: string;
    pricingSaved: string;
    pricingSaveError: string;

    globalDiscountTitle: string;
    globalDiscountHelp: string;
    globalDiscountActive: string;
    globalDiscountPercent: string;
    globalDiscountName: string;
    globalDiscountDescription: string;
    globalDiscountSave: string;
    globalDiscountSaved: string;
    globalDiscountSaveError: string;

    priceType: string;
    priceTypeS: string;
    priceTypeM: string;
    priceTypeL: string;
    priceTypeCustom: string;
    customPrice: string;
    discountEnabled: string;
    discountPercent: string;
    discountDescription: string;
    isNew: string;
    productImages: string;
    published: string;
    draft: string;
    saveSuccess: string;
    saveError: string;
    deleteSuccess: string;
    deleteError: string;
  };
}
