export * from './catalogState';
export * from './cloudinary';
export * from './hooks';

/**
 * Formats a price value for display.
 * Shows decimals only if the value has them (e.g., 20 instead of 20.00, but 15.50 for 15.5)
 * @param value - The price value to format
 * @returns Formatted price string with euro symbol
 */
export function formatPrice(value: number): string {
  // Check if the number has decimals
  const hasDecimals = value % 1 !== 0;
  
  if (hasDecimals) {
    return `${value.toFixed(2)}€`;
  }
  
  return `${Math.round(value)}€`;
}

