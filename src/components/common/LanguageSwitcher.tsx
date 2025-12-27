import { locales, useI18n } from '../../i18n';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex gap-3">
      {locales.map((lang) => (
        <button
          key={lang}
          onClick={() => setLocale(lang)}
          className={`no-radius px-2 py-1 text-xs font-medium uppercase tracking-widest transition-all duration-300 ${
            locale === lang
              ? 'text-(--color-primary) border-b border-(--color-primary)'
              : 'text-(--color-muted) hover:text-(--color-text) border-b border-transparent'
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
