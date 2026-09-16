import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const categories = pgTable('categories', {
  id: text('id').primaryKey(), // using text for UUIDs from frontend or we can let DB handle it, but frontend generates UUIDs.
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  icon: text('icon'),
  color: text('color'),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const resources = pgTable('resources', {
  id: text('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  categoryId: text('category_id').references(() => categories.id).notNull(),
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
  categories: many(categories),
  resources: many(resources),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  resources: many(resources),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  user: one(users, {
    fields: [resources.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [resources.categoryId],
    references: [categories.id],
  }),
}));
