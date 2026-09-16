import { db } from './index.ts';
import { categories, resources } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function syncUserData(userId: number, data: any) {
  // Simple sync: we could clear and insert, or upsert.
  // For simplicity since IDs are UUIDs from frontend, we can upsert or clear/insert.
  // Let's clear and insert for now to perfectly mirror the frontend state.
  
  await db.transaction(async (tx) => {
    // Delete existing
    await tx.delete(resources).where(eq(resources.userId, userId));
    await tx.delete(categories).where(eq(categories.userId, userId));
    
    // Insert new categories
    if (data.categories && data.categories.length > 0) {
      const catsToInsert = data.categories.map((c: any) => ({
        id: c.id,
        userId,
        name: c.name,
        icon: c.icon,
        color: c.color,
        order: c.order,
        createdAt: new Date(c.createdAt),
      }));
      await tx.insert(categories).values(catsToInsert);
    }
    
    // Insert new resources
    if (data.resources && data.resources.length > 0) {
      const resToInsert = data.resources.map((r: any) => ({
        id: r.id,
        userId,
        categoryId: r.categoryId,
        title: r.title,
        url: r.url,
        type: r.type,
        coverImage: r.coverImage,
        description: r.description,
        favorite: r.favorite,
        completed: r.completed,
        pinned: r.pinned,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
        lastOpenedAt: r.lastOpenedAt ? new Date(r.lastOpenedAt) : null,
        order: r.order,
      }));
      await tx.insert(resources).values(resToInsert);
    }
  });
}

export async function getUserData(userId: number) {
  const userCategories = await db.select().from(categories).where(eq(categories.userId, userId));
  const userResources = await db.select().from(resources).where(eq(resources.userId, userId));
  
  return {
    categories: userCategories.map(c => ({
      ...c,
      createdAt: c.createdAt?.getTime() || Date.now(),
    })),
    resources: userResources.map(r => ({
      ...r,
      createdAt: r.createdAt?.getTime() || Date.now(),
      updatedAt: r.updatedAt?.getTime() || Date.now(),
      lastOpenedAt: r.lastOpenedAt?.getTime() || undefined,
    })),
  };
}
