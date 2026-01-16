import { PaymentMethodRepository } from '../repositories/PaymentMethodRepository';
import type {
    CreatePaymentMethodInput,
    PaymentMethod,
    UpdatePaymentMethodInput,
} from '../types/paymentMethod';

export class PaymentMethodService {
  private paymentMethodRepository: PaymentMethodRepository;

  constructor() {
    this.paymentMethodRepository = new PaymentMethodRepository();
  }

  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.getAll();
  }

  async getPaymentMethodById(id: string): Promise<PaymentMethod | null> {
    return this.paymentMethodRepository.getById(id);
  }

  async createPaymentMethod(input: CreatePaymentMethodInput): Promise<PaymentMethod> {
    return this.paymentMethodRepository.create(input);
  }

  async updatePaymentMethod(input: UpdatePaymentMethodInput): Promise<PaymentMethod> {
    return this.paymentMethodRepository.update(input);
  }

  async deletePaymentMethod(id: string): Promise<void> {
    return this.paymentMethodRepository.delete(id);
  }
}
