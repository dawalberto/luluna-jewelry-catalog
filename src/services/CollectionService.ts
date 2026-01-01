import { z } from 'zod';
import { CollectionRepository } from '../repositories/CollectionRepository';
import type { ICollectionRepository } from '../repositories/ICollectionRepository';
import type { Collection, CreateCollectionInput, UpdateCollectionInput } from '../types/collection';

const MultilingualTextSchema = z.object({
  es: z.string().min(1),
  en: z.string().min(1),
});

const CollectionIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'id must be lowercase letters/numbers/hyphens');

const CreateCollectionSchema = z.object({
  id: CollectionIdSchema,
  title: MultilingualTextSchema,
});

const UpdateCollectionSchema = z.object({
  id: CollectionIdSchema,
  title: MultilingualTextSchema.optional(),
});

export class CollectionService {
  private repository: ICollectionRepository;

  constructor(repository?: ICollectionRepository) {
    this.repository = repository ?? new CollectionRepository();
  }

  async getCollections(): Promise<Collection[]> {
    return this.repository.getAll();
  }

  async getCollectionById(id: string): Promise<Collection | null> {
    if (!id || id.trim() === '') throw new Error('Collection id is required');
    return this.repository.getById(id.trim());
  }

  async createCollection(input: CreateCollectionInput): Promise<Collection> {
    const validated = CreateCollectionSchema.parse(input);
    return this.repository.create(validated);
  }

  async updateCollection(input: UpdateCollectionInput): Promise<Collection> {
    const validated = UpdateCollectionSchema.parse(input);
    const existing = await this.repository.getById(validated.id);
    if (!existing) throw new Error('Collection not found');
    return this.repository.update(validated);
  }

  async deleteCollection(id: string): Promise<void> {
    const validatedId = CollectionIdSchema.parse(id);
    const existing = await this.repository.getById(validatedId);
    if (!existing) throw new Error('Collection not found');
    await this.repository.delete(validatedId);
  }
}
