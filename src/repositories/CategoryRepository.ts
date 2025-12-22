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
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../types';
import type { ICategoryRepository } from './ICategoryRepository';

export class CategoryRepository implements ICategoryRepository {
  private readonly collectionName = 'categories';
  private readonly db;

  constructor() {
    this.db = FirebaseClient.getInstance().firestore;
  }

  async getAll(): Promise<Category[]> {
    const snap = await getDocs(collection(this.db, this.collectionName));
    const categories: Category[] = [];
    snap.forEach((d) => {
      categories.push({ id: d.id, ...d.data() } as Category);
    });

    // Stable-ish ordering: by id to avoid needing Firestore indexes.
    categories.sort((a, b) => a.id.localeCompare(b.id));
    return categories;
  }

  async getById(id: string): Promise<Category | null> {
    const ref = doc(this.db, this.collectionName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Category;
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const ref = doc(this.db, this.collectionName, input.id);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new Error('Category already exists');
    }

    await setDoc(ref, {
      title: input.title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const created = await this.getById(input.id);
    if (!created) throw new Error('Failed to create category');
    return created;
  }

  async update(input: UpdateCategoryInput): Promise<Category> {
    const { id, ...patch } = input;
    const ref = doc(this.db, this.collectionName, id);

    await updateDoc(ref, {
      ...patch,
      updatedAt: serverTimestamp(),
    });

    const updated = await this.getById(id);
    if (!updated) throw new Error('Failed to update category');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const ref = doc(this.db, this.collectionName, id);
    await deleteDoc(ref);
  }
}
