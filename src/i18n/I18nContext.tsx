import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Locale, Translations } from '../types/i18n';
import { defaultLocale, detectBrowserLocale, getTranslations } from './config';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(
    initialLocale || defaultLocale
  );

  // Detect browser locale on mount
  useEffect(() => {
    if (!initialLocale) {
      const detected = detectBrowserLocale();
      setLocaleState(detected);
    }
  }, [initialLocale]);

  // Persist locale to localStorage
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  };

  // Load locale from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('locale');
      if (stored && (stored === 'es' || stored === 'en')) {
        setLocaleState(stored);
      }
    }
  }, []);

  const value: I18nContextValue = {
    locale,
    setLocale,
    t: getTranslations(locale),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (context) return context;

  const locale = defaultLocale;
  return {
    locale,
    setLocale: () => {
      // no-op fallback when used outside provider
    },
    t: getTranslations(locale),
  };
}
