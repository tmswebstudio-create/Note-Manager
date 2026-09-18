import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const dashboards = pgTable('dashboards', {
  id: text('id').primaryKey(),
  name: text('name').notNull().default('My Dashboard'),
  ownerId: integer('owner_id').references(() => users.id).notNull(),
  inviteCode: text('invite_code').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const dashboardMembers = pgTable('dashboard_members', {
  id: serial('id').primaryKey(),
  dashboardId: text('dashboard_id').references(() => dashboards.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id),
  email: text('email').notNull(),
  role: text('role').notNull().default('editor'), // 'owner' | 'editor' | 'viewer'
  status: text('status').notNull().default('active'), // 'active' | 'invited'
  invitedBy: integer('invited_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  dashboardId: text('dashboard_id').references(() => dashboards.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id),
  parentId: text('parent_id'),
  name: text('name').notNull(),
  icon: text('icon'),
  color: text('color'),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const resources = pgTable('resources', {
  id: text('id').primaryKey(),
  dashboardId: text('dashboard_id').references(() => dashboards.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id),
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  subcategoryId: text('subcategory_id'),
  title: text('title').notNull(),
  url: text('url').notNull(),
  type: text('type').notNull(),
  coverImage: text('cover_image'),
  description: text('description'),
  favorite: boolean('favorite').default(false),
  completed: boolean('completed').default(false),
  pinned: boolean('pinned').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastOpenedAt: timestamp('last_opened_at'),
  order: integer('order').default(0).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  ownedDashboards: many(dashboards),
  memberships: many(dashboardMembers),
}));

export const dashboardsRelations = relations(dashboards, ({ one, many }) => ({
  owner: one(users, {
    fields: [dashboards.ownerId],
    references: [users.id],
  }),
  members: many(dashboardMembers),
  categories: many(categories),
  resources: many(resources),
}));

export const dashboardMembersRelations = relations(dashboardMembers, ({ one }) => ({
  dashboard: one(dashboards, {
    fields: [dashboardMembers.dashboardId],
    references: [dashboards.id],
  }),
  user: one(users, {
    fields: [dashboardMembers.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  dashboard: one(dashboards, {
    fields: [categories.dashboardId],
    references: [dashboards.id],
  }),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'subcategories',
  }),
  subcategories: many(categories, {
    relationName: 'subcategories',
  }),
  resources: many(resources),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  dashboard: one(dashboards, {
    fields: [resources.dashboardId],
    references: [dashboards.id],
  }),
  category: one(categories, {
    fields: [resources.categoryId],
    references: [categories.id],
  }),
}));

