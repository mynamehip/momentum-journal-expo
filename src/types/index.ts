export enum MomentType {
  TEXT = 'TEXT',
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
}

export enum PrivacyLevel {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
  PUBLIC = 'PUBLIC',
}

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  mediaUrl?: string;
  localUri?: string; // Đường dẫn file trong máy
  type: MomentType;
  createdAt: number;
  moodScore: number;
  tags: string[];
  privacy: PrivacyLevel;
  location?: string;
  groupId?: string;
  userName?: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  defaultDestinations?: string[]; // 'personal' or groupId
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[];
  admins: string[];
  createdBy: string;
  createdAt: number;
  joinCode: string;
  localName?: string;
}

export interface DailyStat {
  date: string;
  avgMood: number;
  entryCount: number;
}
