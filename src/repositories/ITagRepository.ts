import type { CreateTagInput, Tag, UpdateTagInput } from '../types/tag';

export interface ITagRepository {
  getAll(): Promise<Tag[]>;
  getById(id: string): Promise<Tag | null>;
  create(input: CreateTagInput): Promise<Tag>;
  update(input: UpdateTagInput): Promise<Tag>;
  delete(id: string): Promise<void>;
}
