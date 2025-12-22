import {
    isSignInWithEmailLink,
    onAuthStateChanged,
    sendSignInLinkToEmail,
    signInWithEmailLink,
    signOut,
    type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { siteConfig } from '../../config/env';
import { I18nProvider, useI18n } from '../../i18n';
import FirebaseClient from '../../services/FirebaseClient';
import type { Locale } from '../../types/i18n';
import { Button, Input } from '../ui';
import LoadingSpinner from '../ui/LoadingSpinner';
import AdminPanel from './AdminPanel';

interface AdminAppProps {
  initialLocale?: Locale;
}

export default function AdminApp({ initialLocale }: AdminAppProps) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <AdminAuthGate />
    </I18nProvider>
  );
}

function AdminAuthGate() {
  const { t } = useI18n();
  const firebase = useMemo(() => FirebaseClient.getInstance(), []);

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebase.auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      setError('');

      if (!nextUser) {
        setIsAdmin(null);
        return;
      }

      setIsAdmin(null);
      try {
        const adminSnap = await getDoc(doc(firebase.firestore, 'admins', nextUser.uid));
        setIsAdmin(adminSnap.exists());
      } catch (e) {
        console.error(e);
        setIsAdmin(false);
        setError(t.admin.adminCheckError);
      }
    });

    return () => unsubscribe();
  }, [firebase, t.admin.adminCheckError]);

  // Complete passwordless sign-in when coming back from the email link.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const href = window.location.href;
    if (!isSignInWithEmailLink(firebase.auth, href)) return;

    setSubmitting(true);
    setError('');

    (async () => {
      try {
        const storedEmail = window.localStorage.getItem('emailForSignIn') || '';
        const emailToUse = storedEmail || window.prompt(t.admin.email) || '';

        if (!emailToUse.trim()) {
          setError(t.admin.signInError);
          return;
        }

        await signInWithEmailLink(firebase.auth, emailToUse.trim(), href);
        window.localStorage.removeItem('emailForSignIn');

        // Clean the URL (removes oobCode/mode/etc) after successful sign-in.
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error(e);
        setError(t.admin.signInError);
      } finally {
        setSubmitting(false);
      }
    })();
  }, [firebase, t.admin.email, t.admin.signInError]);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setLinkSent(false);

    try {
      const normalizedEmail = email.trim();

      const baseUrl = (siteConfig.url || 'http://localhost:4321').replace(/\/$/, '');
      const actionCodeSettings = {
        url: `${baseUrl}/admin`,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(firebase.auth, normalizedEmail, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', normalizedEmail);
      setLinkSent(true);
    } catch (e) {
      console.error(e);
      setError(t.admin.signInError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setError('');
    await signOut(firebase.auth);
  };

  if (!authReady) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">{t.admin.loginTitle}</h1>

          <p className="text-sm text-gray-600 mb-4">{t.admin.emailLinkHelp}</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {linkSent && !error && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
              {t.admin.linkSent}
            </div>
          )}

          <form onSubmit={handleSendLink} className="space-y-4">
            <Input
              type="email"
              label={t.admin.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Button type="submit" disabled={submitting} className="w-full">
              {t.admin.signIn}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center gap-4">
        <LoadingSpinner />
        <p className="text-sm text-gray-600">{t.admin.checkingAccess}</p>
        <Button variant="ghost" onClick={handleSignOut}>
          {t.admin.signOut}
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">{t.admin.title}</h1>
          <p className="text-gray-700 mb-6">{t.admin.notAuthorized}</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <Button onClick={handleSignOut} className="w-full">
            {t.admin.signOut}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto px-4 pt-6 flex justify-end">
        <Button variant="ghost" onClick={handleSignOut}>
          {t.admin.signOut}
        </Button>
      </div>
      <AdminPanel />
    </div>
  );
}
