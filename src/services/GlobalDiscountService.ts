import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import type { GlobalDiscount } from '../types';
import FirebaseClient from './FirebaseClient';

const GlobalDiscountSchema = z.object({
  active: z.boolean(),
  percent: z.number().min(0).max(100),
  title: z.string().default(''),
  description: z.string().optional(),
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
      return { active: false, percent: 0, title: '', description: '' };
    }

    const data = snap.data() as Partial<GlobalDiscount>;
    return GlobalDiscountSchema.parse({
      active: data.active ?? false,
      percent: data.percent ?? 0,
      title: data.title ?? '',
      description: data.description ?? '',
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
