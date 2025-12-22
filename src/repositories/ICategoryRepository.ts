import type {
    Category,
    CreateCategoryInput,
    UpdateCategoryInput,
} from '../types';

export interface ICategoryRepository {
  getAll(): Promise<Category[]>;
  getById(id: string): Promise<Category | null>;
  create(input: CreateCategoryInput): Promise<Category>;
  update(input: UpdateCategoryInput): Promise<Category>;
  delete(id: string): Promise<void>;
}
