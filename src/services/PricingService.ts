import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import { firebaseConfig } from '../config/env';
import type { PricingConfig } from '../types';
import FirebaseClient from './FirebaseClient';

const PricingConfigSchema = z.object({
  S: z.number().nonnegative(),
  M: z.number().nonnegative(),
  L: z.number().nonnegative(),
});

const PRICING_DOC_PATH = { collection: 'settings', docId: 'pricing' } as const;

export class PricingService {
  private readonly db;
  private readonly auth;

  constructor() {
    const client = FirebaseClient.getInstance();
    this.db = client.firestore;
    this.auth = client.auth;
  }

  async getPricingConfig(): Promise<PricingConfig> {
    const ref = doc(this.db, PRICING_DOC_PATH.collection, PRICING_DOC_PATH.docId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      // Reasonable defaults; admin can change from /admin
      return { S: 0, M: 0, L: 0 };
    }

    const data = snap.data() as Partial<PricingConfig>;
    return PricingConfigSchema.parse({
      S: data.S ?? 0,
      M: data.M ?? 0,
      L: data.L ?? 0,
    });
  }

  async setPricingConfig(input: PricingConfig): Promise<void> {
    const validated = PricingConfigSchema.parse(input);

    const uid = this.auth.currentUser?.uid;
    if (!uid) {
      const err = new Error('Not authenticated');
      (err as any).code = 'not-authenticated';
      throw err;
    }

    // Useful when debugging PERMISSION_DENIED due to wrong project or stale rules.
    console.log('Saving pricing config', { projectId: firebaseConfig.projectId, uid, validated });

    const ref = doc(this.db, PRICING_DOC_PATH.collection, PRICING_DOC_PATH.docId);

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
