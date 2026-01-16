import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    serverTimestamp,
    setDoc,
    updateDoc,
} from 'firebase/firestore';
import FirebaseClient from '../services/FirebaseClient';
import type {
    CreatePaymentMethodInput,
    PaymentMethod,
    UpdatePaymentMethodInput,
} from '../types/paymentMethod';
import type { IPaymentMethodRepository } from './IPaymentMethodRepository';

export class PaymentMethodRepository implements IPaymentMethodRepository {
  private readonly collectionName = 'paymentMethods';
  private readonly db;

  constructor() {
    this.db = FirebaseClient.getInstance().firestore;
  }

  async getAll(): Promise<PaymentMethod[]> {
    const snap = await getDocs(collection(this.db, this.collectionName));
    const paymentMethods: PaymentMethod[] = [];
    snap.forEach((d) => {
      paymentMethods.push({ id: d.id, ...d.data() } as PaymentMethod);
    });

    paymentMethods.sort((a, b) => a.id.localeCompare(b.id));
    return paymentMethods;
  }

  async getById(id: string): Promise<PaymentMethod | null> {
    const ref = doc(this.db, this.collectionName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as PaymentMethod;
  }

  async create(input: CreatePaymentMethodInput): Promise<PaymentMethod> {
    const ref = doc(this.db, this.collectionName, input.id);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new Error('Payment method already exists');
    }

    await setDoc(ref, {
      title: input.title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const saved = await getDoc(ref);
    return { id: saved.id, ...saved.data() } as PaymentMethod;
  }

  async update(input: UpdatePaymentMethodInput): Promise<PaymentMethod> {
    const ref = doc(this.db, this.collectionName, input.id);
    const existing = await getDoc(ref);

    if (!existing.exists()) {
      throw new Error('Payment method not found');
    }

    const updates: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    if (input.title !== undefined) {
      updates.title = input.title;
    }

    await updateDoc(ref, updates);

    const updated = await getDoc(ref);
    return { id: updated.id, ...updated.data() } as PaymentMethod;
  }

  async delete(id: string): Promise<void> {
    const ref = doc(this.db, this.collectionName, id);
    await deleteDoc(ref);
  }
}
