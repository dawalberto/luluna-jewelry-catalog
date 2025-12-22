import { useI18n } from '../../i18n';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
}

export default function Header({}: HeaderProps) {
  const { locale } = useI18n();

  const catalogHref = `/catalog?lang=${locale}`;

  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 transition-all duration-300">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href={catalogHref} className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-[#2E6A77] flex items-center justify-center rounded-squircle text-white font-heading text-xl transition-transform duration-300 group-hover:scale-105">
              L
            </div>
            <span className="text-2xl font-heading font-medium text-black tracking-wide">
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
