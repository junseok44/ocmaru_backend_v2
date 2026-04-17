export type EntityId = string | number;

export interface User {
  id: EntityId;
  username?: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  isAdmin?: boolean;
  [key: string]: unknown;
}

export interface Category {
  id: EntityId;
  name: string;
  type?: string;
  description?: string | null;
  icon?: string | null;
  [key: string]: unknown;
}

export interface Agenda {
  id: EntityId;
  title: string;
  description?: string;
  status?: string;
  categoryId?: EntityId;
  category?: Category;
  [key: string]: unknown;
}

export interface Opinion {
  id: EntityId;
  content: string;
  userId?: EntityId;
  user?: User;
  likes?: number;
  createdAt?: string;
  [key: string]: unknown;
}

export interface Cluster {
  id: EntityId;
  title?: string;
  summary?: string;
  opinionCount?: number;
  [key: string]: unknown;
}

export interface Report {
  id: EntityId;
  status?: string;
  reportType?: string;
  description?: string;
  opinionId?: EntityId;
  agendaId?: EntityId;
  commentId?: EntityId;
  [key: string]: unknown;
}

export interface InsertOpinion {
  content: string;
  type?: "text" | "voice";
  voiceUrl?: string;
  [key: string]: unknown;
}
