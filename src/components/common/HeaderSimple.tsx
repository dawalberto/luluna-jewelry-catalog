import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import FirebaseClient from '../../services/FirebaseClient';

export default function HeaderSimple() {
  const { locale, setLocale } = useI18n();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isOnAdminPage, setIsOnAdminPage] = useState<boolean>(false);
  const firebase = useMemo(() => FirebaseClient.getInstance(), []);

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
      {/* Botón de navegación fijo para administradores */}
      {isAdmin && (
        <a
          href={isOnAdminPage ? `/catalog` : `/admin`}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 px-3 py-2 sm:px-4 sm:py-3 text-lg sm:text-xl bg-[#2E6A77] text-white rounded hover:bg-[#2E6A77]/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          title={isOnAdminPage 
            ? (locale === 'es' ? 'Ir al catálogo' : 'Go to catalog') 
            : (locale === 'es' ? 'Ir a administración' : 'Go to admin')
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
