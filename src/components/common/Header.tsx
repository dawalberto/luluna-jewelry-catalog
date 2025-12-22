import { useI18n } from '../../i18n';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  showAdmin?: boolean;
}

export default function Header({ showAdmin = false }: HeaderProps) {
  const { t, locale } = useI18n();

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
              {t.nav.home}
            </a>
            <a
              href="/catalog"
              className="text-gray-700 hover:text-[#2E6A77] transition-colors"
            >
              {t.nav.catalog}
            </a>
            {showAdmin && (
              <a
                href="/admin"
                className="text-gray-700 hover:text-[#2E6A77] transition-colors"
              >
                {t.nav.admin}
              </a>
            )}
          </nav>

          {/* Language Switcher */}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
