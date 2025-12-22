import { useI18n } from '../../i18n';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
}

export default function Header({}: HeaderProps) {
  const { locale } = useI18n();

  const catalogHref = `/catalog?lang=${locale}`;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href={catalogHref} className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-[#2E6A77] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
              LuLuna
            </span>
          </a>

          {/* Language Switcher */}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
