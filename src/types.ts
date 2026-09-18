export type ResourceType = 'Website' | 'Post' | 'Video';

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  categoryId: string;
  subcategoryId?: string | null;
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
  parentId?: string | null;
  icon?: string;
  color?: string;
  order: number;
  createdAt: number;
  type?: 'resource' | 'bookmark';
}

export type MemberRole = 'owner' | 'editor' | 'viewer';

export interface DashboardMember {
  id: number;
  dashboardId: string;
  userId?: number | null;
  email: string;
  role: MemberRole;
  status: 'active' | 'invited';
  createdAt: string | number;
  isOwner?: boolean;
}

export interface Dashboard {
  id: string;
  name: string;
  ownerId: number;
  ownerEmail?: string;
  inviteCode: string;
  role: MemberRole;
  isOwner: boolean;
  memberCount: number;
  createdAt: string | number;
  updatedAt?: string | number;
}

