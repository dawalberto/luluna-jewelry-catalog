import { Timestamp } from 'firebase/firestore';
import type { MultilingualText } from './product';

export interface Shipping {
  id: string;
  description: MultilingualText;
  deliveryTime: MultilingualText;
  price: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateShippingInput {
  id: string;
  description: MultilingualText;
  deliveryTime: MultilingualText;
  price: number;
}

export interface UpdateShippingInput {
  id: string;
  description?: MultilingualText;
  deliveryTime?: MultilingualText;
  price?: number;
}
