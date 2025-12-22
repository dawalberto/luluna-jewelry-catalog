import { Timestamp } from 'firebase/firestore';
import type { MultilingualText } from './product';

export interface Category {
  id: string;
  title: MultilingualText;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateCategoryInput {
  id: string;
  title: MultilingualText;
}

export interface UpdateCategoryInput {
  id: string;
  title?: MultilingualText;
}
