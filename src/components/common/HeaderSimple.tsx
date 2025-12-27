
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import FirebaseClient from '../../services/FirebaseClient';

interface HeaderSimpleProps {
  locale?: 'es' | 'en';
}

export default function HeaderSimple({ locale = 'es' }: HeaderSimpleProps) {
  const [currentLocale, setCurrentLocale] = useState<'es' | 'en'>(locale);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isOnAdminPage, setIsOnAdminPage] = useState<boolean>(false);
  const firebase = useMemo(() => FirebaseClient.getInstance(), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const langParam = params.get('lang');
    if (langParam === 'es' || langParam === 'en') {
      setCurrentLocale(langParam);
      return;
    }

    const stored = window.localStorage.getItem('locale');
    if (stored === 'es' || stored === 'en') {
      setCurrentLocale(stored);
    }
  }, []);

  // Detectar en qué página estamos
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnAdminPage(window.location.pathname.includes('/admin'));
  }, []);

  // Verificar si el usuario es administrador
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebase.auth, async (user: User | null) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const adminSnap = await getDoc(doc(firebase.firestore, 'admins', user.uid));
        setIsAdmin(adminSnap.exists());
      } catch (e) {
        console.error('Error checking admin status:', e);
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, [firebase]);

  return (
    <>
      {/* Selector de idioma */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <a
          href="?lang=es"
          className={`px-2 py-1 text-xs font-medium uppercase tracking-widest transition-all duration-300 ${
            currentLocale === 'es'
              ? 'text-[#2E6A77] border-b border-[#2E6A77]'
              : 'text-gray-400 hover:text-black border-b border-transparent'
          }`}
        >
          ES
        </a>
        <a
          href="?lang=en"
          className={`px-2 py-1 text-xs font-medium uppercase tracking-widest transition-all duration-300 ${
            currentLocale === 'en'
              ? 'text-[#2E6A77] border-b border-[#2E6A77]'
              : 'text-gray-400 hover:text-black border-b border-transparent'
          }`}
        >
          EN
        </a>
      </div>

      {/* Botón de navegación fijo para administradores */}
      {isAdmin && (
        <a
          href={isOnAdminPage ? `/catalog?lang=${currentLocale}` : `/admin?lang=${currentLocale}`}
          className="fixed bottom-6 right-6 z-50 px-4 py-3 text-xl bg-[#2E6A77] text-white rounded hover:bg-[#2E6A77]/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          title={isOnAdminPage 
            ? (currentLocale === 'es' ? 'Ir al catálogo' : 'Go to catalog') 
            : (currentLocale === 'es' ? 'Ir a administración' : 'Go to admin')
          }
        >
          {isOnAdminPage 
            ? '📦'
            : '⚙️'
          }
        </a>
      )}
    </>
  );
}
