import { useI18n } from '../../i18n';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const creationYear = 2025;
  const yearDisplay = currentYear === creationYear ? `${currentYear}` : `${creationYear}/${currentYear}`;
  const { t } = useI18n();

  return (
    <footer className="bg-(--color-surface) border-t border-(--color-border) mt-20">
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col items-center gap-6">
          {/* Language Switcher */}
          {/* <LanguageSwitcher /> */}
          
          <div className="text-center text-(--color-muted) font-body space-y-2">
            <p className="text-sm">
              © {yearDisplay} Luluna Jewelry. {t.footer.copyright}
            </p>
            <p className="text-xs">
              {t.footer.madeWith}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
