import { I18nProvider } from '../../i18n';
import type { Locale } from '../../types/i18n';
import AdminPanel from './AdminPanel';

interface AdminAppProps {
  initialLocale?: Locale;
}

export default function AdminApp({ initialLocale }: AdminAppProps) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <AdminPanel />
    </I18nProvider>
  );
}
