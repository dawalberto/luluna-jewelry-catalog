import { I18nProvider } from '../../i18n';
import type { Locale } from '../../types/i18n';
import HeaderSimple from '../common/HeaderSimple';
import CatalogView from './CatalogView';

interface CatalogAppProps {
  initialLocale?: Locale;
}

export default function CatalogApp({ initialLocale }: CatalogAppProps) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <HeaderSimple />
      <CatalogView />
    </I18nProvider>
  );
}
