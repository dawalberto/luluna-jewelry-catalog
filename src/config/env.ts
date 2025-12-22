/**
 * Firebase configuration loaded from environment variables
 */
export const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

/**
 * Cloudinary configuration
 */
export const cloudinaryConfig = {
  cloudName: import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME,
  apiKey: import.meta.env.PUBLIC_CLOUDINARY_API_KEY,
  apiSecret: import.meta.env.CLOUDINARY_API_SECRET,
  uploadPreset: import.meta.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET,
};

/**
 * Site configuration
 */
export const siteConfig = {
  url: import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321',
  defaultLocale: (import.meta.env.PUBLIC_DEFAULT_LOCALE || 'es') as 'es' | 'en',
  title: {
    es: 'LuLuna Joyería',
    en: 'LuLuna Jewelry',
  },
  description: {
    es: 'Joyería artesanal única y elegante',
    en: 'Unique and elegant handcrafted jewelry',
  },
};
