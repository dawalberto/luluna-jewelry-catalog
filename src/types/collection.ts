import { Timestamp } from 'firebase/firestore';
import type { MultilingualText } from './product';

export interface Collection {
  id: string;
  title: MultilingualText;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateCollectionInput {
  id: string;
  title: MultilingualText;
}

export interface UpdateCollectionInput {
  id: string;
  title?: MultilingualText;
}
