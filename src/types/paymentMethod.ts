import { Timestamp } from 'firebase/firestore';
import type { MultilingualText } from './product';

export interface PaymentMethod {
  id: string;
  title: MultilingualText;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreatePaymentMethodInput {
  id: string;
  title: MultilingualText;
}

export interface UpdatePaymentMethodInput {
  id: string;
  title?: MultilingualText;
}
