import { ShippingRepository } from '../repositories/ShippingRepository';
import type { CreateShippingInput, Shipping, UpdateShippingInput } from '../types/shipping';

export class ShippingService {
  private shippingRepository: ShippingRepository;

  constructor() {
    this.shippingRepository = new ShippingRepository();
  }

  async getAllShippings(): Promise<Shipping[]> {
    return this.shippingRepository.getAll();
  }

  async getShippingById(id: string): Promise<Shipping | null> {
    return this.shippingRepository.getById(id);
  }

  async createShipping(input: CreateShippingInput): Promise<Shipping> {
    return this.shippingRepository.create(input);
  }

  async updateShipping(input: UpdateShippingInput): Promise<Shipping> {
    return this.shippingRepository.update(input);
  }

  async deleteShipping(id: string): Promise<void> {
    return this.shippingRepository.delete(id);
  }
}
