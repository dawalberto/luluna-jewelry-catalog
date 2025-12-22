import { useI18n } from '../../i18n';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
}

export default function Header({}: HeaderProps) {
  const { locale } = useI18n();

  const catalogHref = `/catalog?lang=${locale}`;

  return (
    <header className="bg-white border-b-3 border-black sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href={catalogHref} className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-[#2E6A77] border-3 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000000] transition-transform group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[6px_6px_0px_0px_#000000]">
              <span className="text-white font-black text-2xl">L</span>
            </div>
            <span className="text-3xl font-black text-black uppercase tracking-tighter">
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
