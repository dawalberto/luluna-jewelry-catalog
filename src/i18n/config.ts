import type { Locale, Translations } from '../types/i18n';
import en from './locales/en.json';
import es from './locales/es.json';

/**
 * i18n configuration
 */
export const locales: Locale[] = ['es', 'en'];
export const defaultLocale: Locale = 'es';

/**
 * Translations map
 */
export const translations: Record<Locale, Translations> = {
  es: es as Translations,
  en: en as Translations,
};

/**
 * Get translation for a specific locale
 */
export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations[defaultLocale];
}

/**
 * Get translated text using dot notation path
 */
export function t(locale: Locale, path: string): string {
  const trans = getTranslations(locale);
  const keys = path.split('.');
  let result: any = trans;

  for (const key of keys) {
    result = result?.[key];
    if (result === undefined) {
      console.warn(`Translation missing for path: ${path}`);
      return path;
    }
  }

  return typeof result === 'string' ? result : path;
}

/**
 * Detect browser language
 */
export function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;

  const browserLang = navigator.language.split('-')[0];
  return locales.includes(browserLang as Locale)
    ? (browserLang as Locale)
    : defaultLocale;
}
