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
import type { CreateShippingInput, Shipping, UpdateShippingInput } from '../types/shipping';
import type { IShippingRepository } from './IShippingRepository';

export class ShippingRepository implements IShippingRepository {
  private readonly collectionName = 'shippings';
  private readonly db;

  constructor() {
    this.db = FirebaseClient.getInstance().firestore;
  }

  async getAll(): Promise<Shipping[]> {
    const snap = await getDocs(collection(this.db, this.collectionName));
    const shippings: Shipping[] = [];
    snap.forEach((d) => {
      shippings.push({ id: d.id, ...d.data() } as Shipping);
    });

    // Stable ordering: by id
    shippings.sort((a, b) => a.id.localeCompare(b.id));
    return shippings;
  }

  async getById(id: string): Promise<Shipping | null> {
    const ref = doc(this.db, this.collectionName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Shipping;
  }

  async create(input: CreateShippingInput): Promise<Shipping> {
    const ref = doc(this.db, this.collectionName, input.id);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new Error('Shipping already exists');
    }

    await setDoc(ref, {
      description: input.description,
      deliveryTime: input.deliveryTime,
      price: input.price,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const saved = await getDoc(ref);
    return { id: saved.id, ...saved.data() } as Shipping;
  }

  async update(input: UpdateShippingInput): Promise<Shipping> {
    const ref = doc(this.db, this.collectionName, input.id);
    const existing = await getDoc(ref);

    if (!existing.exists()) {
      throw new Error('Shipping not found');
    }

    const updates: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    if (input.description !== undefined) {
      updates.description = input.description;
    }
    if (input.deliveryTime !== undefined) {
      updates.deliveryTime = input.deliveryTime;
    }
    if (input.price !== undefined) {
      updates.price = input.price;
    }

    await updateDoc(ref, updates);

    const updated = await getDoc(ref);
    return { id: updated.id, ...updated.data() } as Shipping;
  }

  async delete(id: string): Promise<void> {
    const ref = doc(this.db, this.collectionName, id);
    await deleteDoc(ref);
  }
}
