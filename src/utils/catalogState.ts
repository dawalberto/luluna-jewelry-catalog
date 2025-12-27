import type { ProductCategory } from '../types';

const CATALOG_STATE_KEY = 'luluna_catalog_state';

export interface CatalogState {
  selectedCategory?: ProductCategory | 'all'; // Legacy: deprecated
  selectedCategories?: ProductCategory[]; // New: multiple categories
  selectedTags?: string[];
  searchQuery: string;
  sortBy: 'price-asc' | 'price-desc' | 'popularity' | 'date-desc' | 'date-asc';
  scrollPosition: number;
  timestamp: number;
  // Legacy fields for backward compatibility
  priceSortOrder?: 'none' | 'asc' | 'desc';
}

const STATE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export const saveCatalogState = (state: Omit<CatalogState, 'timestamp'>): void => {
  if (!isBrowser) return;
  
  try {
    const stateWithTimestamp: CatalogState = {
      ...state,
      timestamp: Date.now(),
    };
    localStorage.setItem(CATALOG_STATE_KEY, JSON.stringify(stateWithTimestamp));
  } catch (error) {
    console.error('Error saving catalog state:', error);
  }
};

export const loadCatalogState = (): CatalogState | null => {
  if (!isBrowser) return null;
  
  try {
    const stored = localStorage.getItem(CATALOG_STATE_KEY);
    if (!stored) return null;

    const state: CatalogState = JSON.parse(stored);
    
    // Check if state has expired
    if (Date.now() - state.timestamp > STATE_EXPIRY_MS) {
      clearCatalogState();
      return null;
    }

    // Migrate legacy selectedCategory to selectedCategories
    if (state.selectedCategory && state.selectedCategory !== 'all' && !state.selectedCategories) {
      state.selectedCategories = [state.selectedCategory];
    }

    // Ensure selectedCategories is valid (default to empty array if undefined)
    if (!state.selectedCategories) {
      state.selectedCategories = [];
    }

    return state;
  } catch (error) {
    console.error('Error loading catalog state:', error);
    return null;
  }
};

export const clearCatalogState = (): void => {
  if (!isBrowser) return;
  
  try {
    localStorage.removeItem(CATALOG_STATE_KEY);
  } catch (error) {
    console.error('Error clearing catalog state:', error);
  }
};
