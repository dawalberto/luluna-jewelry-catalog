import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import type { GlobalDiscount } from '../types';
import FirebaseClient from './FirebaseClient';

const MultilingualTextSchema = z.object({
  es: z.string(),
  en: z.string(),
});

const GlobalDiscountSchema = z.object({
  active: z.boolean(),
  percent: z.number().min(0).max(100),
  title: MultilingualTextSchema,
  description: MultilingualTextSchema.optional(),
});

const DISCOUNT_DOC_PATH = { collection: 'settings', docId: 'discount' } as const;

export class GlobalDiscountService {
  private readonly db;

  constructor() {
    this.db = FirebaseClient.getInstance().firestore;
  }

  async getGlobalDiscount(): Promise<GlobalDiscount> {
    const ref = doc(this.db, DISCOUNT_DOC_PATH.collection, DISCOUNT_DOC_PATH.docId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return { active: false, percent: 0, title: { es: '', en: '' }, description: { es: '', en: '' } };
    }

    const data = snap.data() as Partial<GlobalDiscount>;

    // Backward compatibility: allow previous string fields.
    const rawTitle: any = (data as any).title;
    const rawDescription: any = (data as any).description;

    const title =
      typeof rawTitle === 'string'
        ? { es: rawTitle, en: rawTitle }
        : rawTitle && typeof rawTitle === 'object'
          ? { es: rawTitle.es ?? '', en: rawTitle.en ?? '' }
          : { es: '', en: '' };

    const description =
      typeof rawDescription === 'string'
        ? { es: rawDescription, en: rawDescription }
        : rawDescription && typeof rawDescription === 'object'
          ? { es: rawDescription.es ?? '', en: rawDescription.en ?? '' }
          : { es: '', en: '' };

    return GlobalDiscountSchema.parse({
      active: data.active ?? false,
      percent: data.percent ?? 0,
      title,
      description,
    });
  }

  async setGlobalDiscount(input: GlobalDiscount): Promise<void> {
    const validated = GlobalDiscountSchema.parse(input);
    const ref = doc(this.db, DISCOUNT_DOC_PATH.collection, DISCOUNT_DOC_PATH.docId);

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
