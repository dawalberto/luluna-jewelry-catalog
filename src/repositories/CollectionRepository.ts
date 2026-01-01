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
import type { Collection, CreateCollectionInput, UpdateCollectionInput } from '../types/collection';
import type { ICollectionRepository } from './ICollectionRepository';

export class CollectionRepository implements ICollectionRepository {
  private readonly collectionName = 'collections';
  private readonly db;

  constructor() {
    this.db = FirebaseClient.getInstance().firestore;
  }

  async getAll(): Promise<Collection[]> {
    const snap = await getDocs(collection(this.db, this.collectionName));
    const collections: Collection[] = [];
    snap.forEach((d) => {
      collections.push({ id: d.id, ...d.data() } as Collection);
    });

    // Stable-ish ordering: by id to avoid needing Firestore indexes.
    collections.sort((a, b) => a.id.localeCompare(b.id));
    return collections;
  }

  async getById(id: string): Promise<Collection | null> {
    const ref = doc(this.db, this.collectionName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Collection;
  }

  async create(input: CreateCollectionInput): Promise<Collection> {
    const ref = doc(this.db, this.collectionName, input.id);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new Error('Collection already exists');
    }

    await setDoc(ref, {
      title: input.title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const created = await this.getById(input.id);
    if (!created) throw new Error('Failed to create collection');
    return created;
  }

  async update(input: UpdateCollectionInput): Promise<Collection> {
    const { id, ...patch } = input;
    const ref = doc(this.db, this.collectionName, id);

    await updateDoc(ref, {
      ...patch,
      updatedAt: serverTimestamp(),
    });

    const updated = await this.getById(id);
    if (!updated) throw new Error('Failed to update collection');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const ref = doc(this.db, this.collectionName, id);
    await deleteDoc(ref);
  }
}
