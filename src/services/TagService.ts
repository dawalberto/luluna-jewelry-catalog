import { z } from 'zod';
import type { ITagRepository } from '../repositories/ITagRepository';
import { TagRepository } from '../repositories/TagRepository';
import type { CreateTagInput, Tag, UpdateTagInput } from '../types/tag';

const MultilingualTextSchema = z.object({
  es: z.string().min(1),
  en: z.string().min(1),
});

const TagIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'id must be lowercase letters/numbers/hyphens');

const CreateTagSchema = z.object({
  id: TagIdSchema,
  title: MultilingualTextSchema,
});

const UpdateTagSchema = z.object({
  id: TagIdSchema,
  title: MultilingualTextSchema.optional(),
});

export class TagService {
  private repository: ITagRepository;

  constructor(repository?: ITagRepository) {
    this.repository = repository ?? new TagRepository();
  }

  async getTags(): Promise<Tag[]> {
    return this.repository.getAll();
  }

  async getTagById(id: string): Promise<Tag | null> {
    if (!id || id.trim() === '') throw new Error('Tag id is required');
    return this.repository.getById(id.trim());
  }

  async createTag(input: CreateTagInput): Promise<Tag> {
    const validated = CreateTagSchema.parse(input);
    return this.repository.create(validated);
  }

  async updateTag(input: UpdateTagInput): Promise<Tag> {
    const validated = UpdateTagSchema.parse(input);
    const existing = await this.repository.getById(validated.id);
    if (!existing) throw new Error('Tag not found');
    return this.repository.update(validated);
  }

  async deleteTag(id: string): Promise<void> {
    const validatedId = TagIdSchema.parse(id);
    const existing = await this.repository.getById(validatedId);
    if (!existing) throw new Error('Tag not found');
    await this.repository.delete(validatedId);
  }
}
