export type ResourceType = string;

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  categoryId: string;
  coverImage?: string;
  description?: string;
  tags?: string[];
  favorite: boolean;
  completed?: boolean;
  pinned?: boolean;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt?: number;
  order: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  order: number;
  createdAt: number;
}
