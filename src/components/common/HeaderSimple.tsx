
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
        className={`px-3 py-1 border-2 border-black text-sm font-bold uppercase transition-all ${
          currentLocale === 'es'
            ? 'bg-[#2E6A77] text-white shadow-[2px_2px_0px_0px_#000000] -translate-y-0.5 -translate-x-0.5'
            : 'bg-white text-black hover:bg-gray-100 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[2px_2px_0px_0px_#000000]'
        }`}
      >
        ES
      </a>
      <a
        href="?lang=en"
        className={`px-3 py-1 border-2 border-black text-sm font-bold uppercase transition-all ${
          currentLocale === 'en'
            ? 'bg-[#2E6A77] text-white shadow-[2px_2px_0px_0px_#000000] -translate-y-0.5 -translate-x-0.5'
            : 'bg-white text-black hover:bg-gray-100 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[2px_2px_0px_0px_#000000]'
        }`}
      >
        EN
      </a>
    </div>
  );
}
