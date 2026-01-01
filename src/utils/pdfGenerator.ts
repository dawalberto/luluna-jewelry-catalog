import jsPDF from 'jspdf';
import type { Product, PricingConfig, GlobalDiscount, ProductCategory } from '../types';

/**
 * Design tokens matching global.css
 */
const DESIGN = {
  colors: {
    primary: '#2F6B80',
    text: '#262626',
    gold: '#D4AF37',
    muted: '#787878',
    bg: '#F9F7F2',
  },
  fonts: {
    // Using closest jsPDF standard fonts to match web fonts
    // Playfair Display (serif, elegant) -> Times (serif)
    // Manrope (sans-serif, modern) -> Helvetica (sans-serif)
    heading: 'times',
    body: 'helvetica',
  },
};

/**
 * Format price value for display
 */
function formatPrice(value: number): string {
  const hasDecimals = value % 1 !== 0;
  if (hasDecimals) {
    return `${value.toFixed(2)}€`;
  }
  return `${Math.round(value)}€`;
}

/**
 * Calculate product price with discounts
 */
function calculatePrice(
  product: Product,
  pricingTiers: PricingConfig | null,
  globalDiscount: GlobalDiscount | null
): { price: number; originalPrice?: number } {
  // Get base price
  let basePrice = 0;
  if (product.pricing.type === 'custom' && product.pricing.customPrice) {
    basePrice = product.pricing.customPrice;
  } else if (pricingTiers && product.pricing.type !== 'custom') {
    basePrice = pricingTiers[product.pricing.type];
  } else if (product.price) {
    basePrice = product.price; // Legacy fallback
  }

  // Apply discounts
  let finalPrice = basePrice;
  let discountPercent = 0;

  // Product-specific discount takes precedence
  if (product.discount?.enabled && product.discount.percent > 0) {
    discountPercent = product.discount.percent;
  } else if (globalDiscount?.active && globalDiscount.percent > 0) {
    discountPercent = globalDiscount.percent;
  }

  if (discountPercent > 0) {
    finalPrice = basePrice * (1 - discountPercent / 100);
    return { price: finalPrice, originalPrice: basePrice };
  }

  return { price: finalPrice };
}

/**
 * Load image from URL as base64
 */
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load image:', url, error);
    return null;
  }
}

/**
 * Generate filter summary text
 */
function getFilterSummary(
  categories: ProductCategory[],
  tags: string[],
  collection: string | undefined,
  searchQuery: string,
  locale: string
): string {
  const filters: string[] = [];
  
  if (categories.length > 0) {
    filters.push(`${locale === 'es' ? 'Categorías' : 'Categories'}: ${categories.join(', ')}`);
  }
  
  if (tags.length > 0) {
    filters.push(`${locale === 'es' ? 'Etiquetas' : 'Tags'}: ${tags.join(', ')}`);
  }
  
  if (collection) {
    filters.push(`${locale === 'es' ? 'Colección' : 'Collection'}: ${collection}`);
  }
  
  if (searchQuery.trim()) {
    filters.push(`${locale === 'es' ? 'Búsqueda' : 'Search'}: "${searchQuery}"`);
  }
  
  return filters.length > 0 
    ? filters.join(' | ') 
    : (locale === 'es' ? 'Todos los productos' : 'All products');
}

export interface PDFGeneratorOptions {
  products: Product[];
  pricingTiers: PricingConfig | null;
  globalDiscount: GlobalDiscount | null;
  locale: string;
  selectedCategories?: ProductCategory[];
  selectedTags?: string[];
  selectedCollection?: string;
  searchQuery?: string;
  onProgress?: (loaded: number, total: number) => void;
}

/**
 * Generate and download catalog PDF
 */
export async function generateCatalogPDF(options: PDFGeneratorOptions): Promise<void> {
  const {
    products,
    pricingTiers,
    globalDiscount,
    locale,
    selectedCategories = [],
    selectedTags = [],
    selectedCollection,
    searchQuery = '',
    onProgress,
  } = options;

  // Create PDF in A4 portrait format
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // Responsive column count based on page width
  // A4 width is 210mm, we'll use 2 columns for smaller, 3 for standard
  const columnCount = pageWidth > 200 ? 3 : 2;
  const columnGap = 8;
  const columnWidth = (contentWidth - columnGap * (columnCount - 1)) / columnCount;

  let currentY = margin;
  let currentColumn = 0;

  // === Header ===
  const addHeader = (isFirstPage = false) => {
    // Brand name
    pdf.setFont(DESIGN.fonts.heading, 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(DESIGN.colors.primary);
    pdf.text('Luluna Jewelry', pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    // Tagline
    pdf.setFont(DESIGN.fonts.body, 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(DESIGN.colors.muted);
    const tagline = locale === 'es' ? 'Catálogo de Joyería' : 'Jewelry Catalog';
    pdf.text(tagline, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;

    if (isFirstPage) {
      // Filter summary
      pdf.setFontSize(9);
      pdf.setTextColor(DESIGN.colors.text);
      const filterSummary = getFilterSummary(
        selectedCategories,
        selectedTags,
        selectedCollection,
        searchQuery,
        locale
      );
      const summaryLines = pdf.splitTextToSize(filterSummary, contentWidth);
      pdf.text(summaryLines, pageWidth / 2, currentY, { align: 'center' });
      currentY += summaryLines.length * 4 + 5;

      // Date and count
      pdf.setFontSize(8);
      pdf.setTextColor(DESIGN.colors.muted);
      const date = new Date().toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const countText = locale === 'es' 
        ? `${products.length} producto${products.length !== 1 ? 's' : ''}`
        : `${products.length} product${products.length !== 1 ? 's' : ''}`;
      pdf.text(`${date} • ${countText}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;
    } else {
      currentY += 5;
    }

    // Separator line
    pdf.setDrawColor(DESIGN.colors.primary);
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;
  };

  // === Footer ===
  const addFooter = (pageNum: number) => {
    const footerY = pageHeight - 10;
    
    pdf.setFont(DESIGN.fonts.body, 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(DESIGN.colors.muted);
    
    // URL on left
    pdf.text('luluna.es', margin, footerY);
    
    // Page number on right
    pdf.text(`${pageNum}`, pageWidth - margin, footerY, { align: 'right' });
  };

  // === Add new page ===
  const addNewPage = (pageNum: number) => {
    pdf.addPage();
    currentY = margin;
    currentColumn = 0;
    addHeader(false);
    addFooter(pageNum);
  };

  // Initialize first page
  let pageNum = 1;
  addHeader(true);
  addFooter(pageNum);

  // === Render Products ===
  const maxImageHeight = columnWidth * 1.25; // Max height: 5:4 aspect ratio
  const maxProductHeight = maxImageHeight + 25; // Image + text below

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    // Report progress
    if (onProgress) {
      onProgress(i + 1, products.length);
    }

    // Calculate position
    const x = margin + currentColumn * (columnWidth + columnGap);
    
    // Check if we need a new page (using max height)
    if (currentY + maxProductHeight > pageHeight - 20) {
      pageNum++;
      addNewPage(pageNum);
    }

    let actualImageHeight = maxImageHeight;
    
    // Load and add product image
    if (product.images && product.images.length > 0) {
      const imageUrl = product.images[0];
      const imageData = await loadImageAsBase64(imageUrl);
      
      if (imageData) {
        try {
          // Get image dimensions to maintain aspect ratio
          const img = new Image();
          img.src = imageData;
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
          
          // Calculate dimensions maintaining aspect ratio
          const aspectRatio = img.height / img.width;
          actualImageHeight = Math.min(columnWidth * aspectRatio, maxImageHeight);
          
          pdf.addImage(imageData, 'JPEG', x, currentY, columnWidth, actualImageHeight);
        } catch (error) {
          // If image fails, draw placeholder
          pdf.setFillColor(DESIGN.colors.bg);
          pdf.rect(x, currentY, columnWidth, actualImageHeight, 'F');
          pdf.setTextColor(DESIGN.colors.muted);
          pdf.setFontSize(8);
          pdf.text('Image unavailable', x + columnWidth / 2, currentY + actualImageHeight / 2, { 
            align: 'center' 
          });
        }
      } else {
        // Placeholder for missing image
        pdf.setFillColor(DESIGN.colors.bg);
        pdf.rect(x, currentY, columnWidth, actualImageHeight, 'F');
      }
    }

    let textY = currentY + actualImageHeight + 4;

    // Product title
    pdf.setFont(DESIGN.fonts.heading, 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(DESIGN.colors.text);
    const title = product.title[locale] || product.title.es || '';
    const titleLines = pdf.splitTextToSize(title, columnWidth);
    pdf.text(titleLines.slice(0, 2), x, textY); // Max 2 lines
    textY += titleLines.slice(0, 2).length * 4;

    // Categories
    if (product.categories && product.categories.length > 0) {
      pdf.setFont(DESIGN.fonts.body, 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(DESIGN.colors.muted);
      const categoryText = product.categories[0] + 
        (product.categories.length > 1 ? ` +${product.categories.length - 1}` : '');
      pdf.text(categoryText, x, textY);
      textY += 4;
    }

    // Price
    const { price, originalPrice } = calculatePrice(product, pricingTiers, globalDiscount);
    pdf.setFont(DESIGN.fonts.body, 'bold');
    pdf.setFontSize(10);
    
    if (originalPrice) {
      // Show strikethrough original price
      pdf.setTextColor(DESIGN.colors.muted);
      pdf.setFontSize(8);
      const originalPriceText = formatPrice(originalPrice);
      pdf.text(originalPriceText, x, textY);
      const textWidth = pdf.getTextWidth(originalPriceText);
      pdf.setLineWidth(0.3);
      pdf.line(x, textY - 1, x + textWidth, textY - 1);
      
      // Show discounted price
      pdf.setTextColor(DESIGN.colors.gold);
      pdf.setFontSize(10);
      pdf.text(formatPrice(price), x + textWidth + 2, textY);
    } else {
      pdf.setTextColor(DESIGN.colors.text);
      pdf.text(formatPrice(price), x, textY);
    }

    // "New" badge
    if (product.isNew) {
      const badgeX = x + columnWidth - 15;
      const badgeY = currentY + 3;
      pdf.setFillColor(DESIGN.colors.gold);
      pdf.roundedRect(badgeX, badgeY, 12, 5, 1, 1, 'F');
      pdf.setFont(DESIGN.fonts.body, 'bold');
      pdf.setFontSize(6);
      pdf.setTextColor(255, 255, 255);
      const badgeText = locale === 'es' ? 'NUEVO' : 'NEW';
      pdf.text(badgeText, badgeX + 6, badgeY + 3.5, { align: 'center' });
    }

    // Move to next position
    currentColumn++;
    if (currentColumn >= columnCount) {
      currentColumn = 0;
      // Use the actual image height for this product + text space
      currentY += actualImageHeight + 33; // image + text (~25) + gap (8)
    }
  }

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Luluna_Catalog_${timestamp}.pdf`;

  // Download PDF
  pdf.save(filename);
}
