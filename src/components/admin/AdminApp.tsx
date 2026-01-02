import {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { adminConfig, siteConfig } from '../../config/env';
import { I18nProvider, useI18n } from '../../i18n';
import FirebaseClient from '../../services/FirebaseClient';
import type { Locale } from '../../types/i18n';
import HeaderSimple from '../common/HeaderSimple';
import { Button, Input } from '../ui';
import LoadingSpinner from '../ui/LoadingSpinner';
import AdminPanel from './AdminPanel';

interface AdminAppProps {
  initialLocale?: Locale;
}

export default function AdminApp({ initialLocale }: AdminAppProps) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <HeaderSimple />
      <AdminAuthGate />
    </I18nProvider>
  );
}

function AdminAuthGate() {
  const { t } = useI18n();
  const firebase = useMemo(() => FirebaseClient.getInstance(), []);
  const allowedEmails = useMemo(() => new Set(adminConfig.allowedEmails), []);
  const allowlistEnabled = allowedEmails.size > 0;

  const getAuthErrorMessage = (e: unknown) => {
    const code = (e as any)?.code as string | undefined;
    if (code === 'auth/operation-not-allowed') return t.admin.googleNotEnabled;
    if (code === 'auth/popup-blocked') return t.admin.popupBlocked;
    if (code === 'auth/popup-closed-by-user') return t.admin.popupClosed;
    if (code === 'auth/unauthorized-domain') return t.admin.unauthorizedDomain;
    return t.admin.signInError;
  };

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

      if (allowlistEnabled) {
        const nextEmail = (nextUser.email || '').trim().toLowerCase();
        if (!nextEmail || !allowedEmails.has(nextEmail)) {
          setIsAdmin(false);
          setError(t.admin.emailNotAllowed);
          await signOut(firebase.auth);
          return;
        }
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
  }, [allowlistEnabled, allowedEmails, firebase, t.admin.adminCheckError, t.admin.emailNotAllowed]);

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
        setError(getAuthErrorMessage(e));
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

      if (allowlistEnabled && !allowedEmails.has(normalizedEmail.toLowerCase())) {
        setError(t.admin.emailNotAllowed);
        return;
      }

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
      setError(getAuthErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setError('');
    setLinkSent(false);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebase.auth, provider);
      const signedInEmail = (result.user.email || '').trim().toLowerCase();

      if (allowlistEnabled && (!signedInEmail || !allowedEmails.has(signedInEmail))) {
        setError(t.admin.emailNotAllowed);
        await signOut(firebase.auth);
      }
    } catch (e) {
      console.error(e);
      setError(getAuthErrorMessage(e));
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
        <div className="max-w-md mx-auto bg-white rounded-squircle shadow-md p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">{t.admin.loginTitle}</h1>

          <p className="text-sm text-gray-600 mb-4">{t.admin.emailLinkHelp}</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-squircle mb-4">
              {error}
            </div>
          )}

          {linkSent && !error && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-squircle mb-4">
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

          <div className="my-4 text-center text-sm text-gray-500">{t.admin.or}</div>

          <Button type="button" onClick={handleGoogleSignIn} disabled={submitting} className="w-full">
            {t.admin.signInWithGoogle}
          </Button>
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
        <div className="max-w-md mx-auto bg-white rounded-squircle shadow-md p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">{t.admin.title}</h1>
          <p className="text-gray-700 mb-6">{t.admin.notAuthorized}</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-squircle mb-4">
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
