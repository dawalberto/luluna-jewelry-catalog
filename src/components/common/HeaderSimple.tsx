
import { useEffect, useState } from 'react';

interface HeaderSimpleProps {
  showAdmin?: boolean;
  locale?: 'es' | 'en';
}

export default function HeaderSimple({ showAdmin = false, locale = 'es' }: HeaderSimpleProps) {
  const [currentLocale, setCurrentLocale] = useState<'es' | 'en'>(locale);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const langParam = params.get('lang');
    if (langParam === 'es' || langParam === 'en') {
      setCurrentLocale(langParam);
      return;
    }

    const stored = window.localStorage.getItem('locale');
    if (stored === 'es' || stored === 'en') {
      setCurrentLocale(stored);
    }
  }, []);

  const nav = {
    home: currentLocale === 'es' ? 'Inicio' : 'Home',
    catalog: currentLocale === 'es' ? 'Catálogo' : 'Catalog',
    admin: currentLocale === 'es' ? 'Administración' : 'Admin',
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-[#2E6A77] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
              LuLuna
            </span>
          </a>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="/"
              className="text-gray-700 hover:text-[#2E6A77] transition-colors"
            >
              {nav.home}
            </a>
            <a
              href="/catalog"
              className="text-gray-700 hover:text-[#2E6A77] transition-colors"
            >
              {nav.catalog}
            </a>
            {showAdmin && (
              <a
                href="/admin"
                className="text-gray-700 hover:text-[#2E6A77] transition-colors"
              >
                {nav.admin}
              </a>
            )}
          </nav>

          {/* Language Switcher */}
          <div className="flex gap-2">
            <a
              href="?lang=es"
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                currentLocale === 'es'
                  ? 'bg-[#2E6A77] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ES
            </a>
            <a
              href="?lang=en"
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                currentLocale === 'en'
                  ? 'bg-[#2E6A77] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              EN
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
