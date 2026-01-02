import { z } from 'zod';
import { CategoryRepository } from '../repositories/CategoryRepository';
import type { ICategoryRepository } from '../repositories/ICategoryRepository';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../types';

const MultilingualTextSchema = z.object({
  es: z.string().min(1),
  en: z.string().min(1),
});

const CategoryIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'id must be lowercase letters/numbers/hyphens');

const CreateCategorySchema = z.object({
  id: CategoryIdSchema,
  title: MultilingualTextSchema,
});

const UpdateCategorySchema = z.object({
  id: CategoryIdSchema,
  title: MultilingualTextSchema.optional(),
  subcategories: z
    .array(
      z.object({
        id: CategoryIdSchema,
        title: MultilingualTextSchema,
      })
    )
    .optional(),
});

export class CategoryService {
  private repository: ICategoryRepository;

  constructor(repository?: ICategoryRepository) {
    this.repository = repository ?? new CategoryRepository();
  }

  async getCategories(): Promise<Category[]> {
    return this.repository.getAll();
  }

  async getCategoryById(id: string): Promise<Category | null> {
    if (!id || id.trim() === '') throw new Error('Category id is required');
    return this.repository.getById(id.trim());
  }

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const validated = CreateCategorySchema.parse(input);
    return this.repository.create(validated);
  }

  async updateCategory(input: UpdateCategoryInput): Promise<Category> {
    const validated = UpdateCategorySchema.parse(input);
    const existing = await this.repository.getById(validated.id);
    if (!existing) throw new Error('Category not found');
    return this.repository.update(validated);
  }

  async deleteCategory(id: string): Promise<void> {
    const validatedId = CategoryIdSchema.parse(id);
    const existing = await this.repository.getById(validatedId);
    if (!existing) throw new Error('Category not found');
    await this.repository.delete(validatedId);
  }
}
