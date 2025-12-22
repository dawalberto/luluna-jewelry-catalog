import { Timestamp } from 'firebase/firestore';
import type { MultilingualText } from './product';

export interface Tag {
  id: string;
  title: MultilingualText;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateTagInput {
  id: string;
  title: MultilingualText;
}

export interface UpdateTagInput {
  id: string;
  title?: MultilingualText;
}
