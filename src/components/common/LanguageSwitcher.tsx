import { locales, useI18n } from '../../i18n';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex gap-2">
      {locales.map((lang) => (
        <button
          key={lang}
          onClick={() => setLocale(lang)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            locale === lang
              ? 'bg-[#2E6A77] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
