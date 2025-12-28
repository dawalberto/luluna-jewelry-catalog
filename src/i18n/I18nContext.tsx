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

  // Initialize locale synchronously from browser storage
  const getInitialLocale = (): Locale => {
    if (typeof window === 'undefined') {
      return initialLocale || defaultLocale;
    }

    // Priority: ?lang= -> localStorage -> initialLocale -> browser detection
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get('lang');

    if (langParam === 'es' || langParam === 'en') {
      localStorage.setItem('locale', langParam);
      return langParam;
    }

    const stored = localStorage.getItem('locale');
    if (stored && (stored === 'es' || stored === 'en')) {
      return stored;
    }

    if (initialLocale) {
      return initialLocale;
    }

    return detectBrowserLocale();
  };

  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  // Update URL parameter when it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const langParam = params.get('lang');

    if (langParam === 'es' || langParam === 'en') {
      if (langParam !== locale) {
        setLocaleState(langParam);
        localStorage.setItem('locale', langParam);
      }
    }
  }, [locale]);

  // Persist locale to localStorage
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  };

  const tempLocaleEs: Locale = 'es';

  const value: I18nContextValue = {
    locale: tempLocaleEs,
    setLocale,
    t: getTranslations(tempLocaleEs),
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
