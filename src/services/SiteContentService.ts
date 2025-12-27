import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import type { SiteContent } from '../types';
import FirebaseClient from './FirebaseClient';

const MultilingualTextSchema = z.object({
  es: z.string(),
  en: z.string(),
});

const SiteContentSchema = z.object({
  catalogTitle: MultilingualTextSchema,
  catalogSubtitle: MultilingualTextSchema,
});

const SITE_CONTENT_DOC_PATH = { collection: 'settings', docId: 'siteContent' } as const;

export class SiteContentService {
  private readonly db;

  constructor() {
    this.db = FirebaseClient.getInstance().firestore;
  }

  async getSiteContent(): Promise<SiteContent> {
    const ref = doc(this.db, SITE_CONTENT_DOC_PATH.collection, SITE_CONTENT_DOC_PATH.docId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      // Default values matching the current hardcoded text
      return {
        catalogTitle: {
          es: 'Catálogo Luluna',
          en: 'Luluna Catalog',
        },
        catalogSubtitle: {
          es: 'Joyería artesanal única y elegante',
          en: 'Unique and elegant handcrafted jewelry',
        },
      };
    }

    const data = snap.data() as Partial<SiteContent>;

    return SiteContentSchema.parse({
      catalogTitle: data.catalogTitle ?? {
        es: 'Catálogo Luluna',
        en: 'Luluna Catalog',
      },
      catalogSubtitle: data.catalogSubtitle ?? {
        es: 'Joyería artesanal única y elegante',
        en: 'Unique and elegant handcrafted jewelry',
      },
    });
  }

  async setSiteContent(input: SiteContent): Promise<void> {
    const validated = SiteContentSchema.parse(input);
    const ref = doc(this.db, SITE_CONTENT_DOC_PATH.collection, SITE_CONTENT_DOC_PATH.docId);

    await setDoc(
      ref,
      {
        ...validated,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}
