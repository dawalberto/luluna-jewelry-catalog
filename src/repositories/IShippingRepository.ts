import type { CreateShippingInput, Shipping, UpdateShippingInput } from '../types/shipping';

export interface IShippingRepository {
  getAll(): Promise<Shipping[]>;
  getById(id: string): Promise<Shipping | null>;
  create(input: CreateShippingInput): Promise<Shipping>;
  update(input: UpdateShippingInput): Promise<Shipping>;
  delete(id: string): Promise<void>;
}
