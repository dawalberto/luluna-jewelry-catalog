import type {
    CreatePaymentMethodInput,
    PaymentMethod,
    UpdatePaymentMethodInput,
} from '../types/paymentMethod';

export interface IPaymentMethodRepository {
  getAll(): Promise<PaymentMethod[]>;
  getById(id: string): Promise<PaymentMethod | null>;
  create(input: CreatePaymentMethodInput): Promise<PaymentMethod>;
  update(input: UpdatePaymentMethodInput): Promise<PaymentMethod>;
  delete(id: string): Promise<void>;
}
