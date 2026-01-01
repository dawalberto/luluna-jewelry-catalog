import type {
    Collection,
    CreateCollectionInput,
    UpdateCollectionInput,
} from '../types/collection';

export interface ICollectionRepository {
  getAll(): Promise<Collection[]>;
  getById(id: string): Promise<Collection | null>;
  create(input: CreateCollectionInput): Promise<Collection>;
  update(input: UpdateCollectionInput): Promise<Collection>;
  delete(id: string): Promise<void>;
}
