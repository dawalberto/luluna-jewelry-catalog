import { locales, useI18n } from '../../i18n';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex gap-3">
      {locales.map((lang) => (
        <button
          key={lang}
          onClick={() => setLocale(lang)}
          className={`px-3 py-1 border-2 border-black text-sm font-bold uppercase transition-all ${
            locale === lang
              ? 'bg-[#2E6A77] text-white shadow-[2px_2px_0px_0px_#000000] -translate-y-0.5 -translate-x-0.5'
              : 'bg-white text-black hover:bg-gray-100 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[2px_2px_0px_0px_#000000]'
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
