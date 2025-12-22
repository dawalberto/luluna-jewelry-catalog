
import { useEffect, useState } from 'react';

interface HeaderSimpleProps {
  locale?: 'es' | 'en';
}

export default function HeaderSimple({ locale = 'es' }: HeaderSimpleProps) {
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

  return (
    <div className="absolute top-4 right-4 z-50 flex gap-2">
      <a
        href="?lang=es"
        className={`px-2 py-1 text-xs font-medium uppercase tracking-widest transition-all duration-300 ${
          currentLocale === 'es'
            ? 'text-[#2E6A77] border-b border-[#2E6A77]'
            : 'text-gray-400 hover:text-black border-b border-transparent'
        }`}
      >
        ES
      </a>
      <a
        href="?lang=en"
        className={`px-2 py-1 text-xs font-medium uppercase tracking-widest transition-all duration-300 ${
          currentLocale === 'en'
            ? 'text-[#2E6A77] border-b border-[#2E6A77]'
            : 'text-gray-400 hover:text-black border-b border-transparent'
        }`}
      >
        EN
      </a>
    </div>
  );
}
