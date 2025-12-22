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
import type { CreateTagInput, Tag, UpdateTagInput } from '../types/tag';
import type { ITagRepository } from './ITagRepository';

export class TagRepository implements ITagRepository {
  private readonly collectionName = 'tags';
  private readonly db;

  constructor() {
    this.db = FirebaseClient.getInstance().firestore;
  }

  async getAll(): Promise<Tag[]> {
    const snap = await getDocs(collection(this.db, this.collectionName));
    const tags: Tag[] = [];
    snap.forEach((d) => {
      tags.push({ id: d.id, ...d.data() } as Tag);
    });

    // Stable ordering: by id
    tags.sort((a, b) => a.id.localeCompare(b.id));
    return tags;
  }

  async getById(id: string): Promise<Tag | null> {
    const ref = doc(this.db, this.collectionName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Tag;
  }

  async create(input: CreateTagInput): Promise<Tag> {
    const ref = doc(this.db, this.collectionName, input.id);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new Error('Tag already exists');
    }

    await setDoc(ref, {
      title: input.title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const created = await this.getById(input.id);
    if (!created) throw new Error('Failed to create tag');
    return created;
  }

  async update(input: UpdateTagInput): Promise<Tag> {
    const { id, ...patch } = input;
    const ref = doc(this.db, this.collectionName, id);

    await updateDoc(ref, {
      ...patch,
      updatedAt: serverTimestamp(),
    });

    const updated = await this.getById(id);
    if (!updated) throw new Error('Failed to update tag');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const ref = doc(this.db, this.collectionName, id);
    await deleteDoc(ref);
  }
}
