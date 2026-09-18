import { db } from './index.ts';
import { categories, resources, dashboards } from './schema.ts';
import { eq, and } from 'drizzle-orm';

export async function syncUserData(dashboardId: string, userId: number, data: any) {
  await db.transaction(async (tx) => {
    // Delete existing resources and categories for this specific dashboard
    await tx.delete(resources).where(eq(resources.dashboardId, dashboardId));
    await tx.delete(categories).where(eq(categories.dashboardId, dashboardId));
    
    // Insert new categories (parents first, then subcategories)
    if (data.categories && data.categories.length > 0) {
      // Sort parents (parentId == null or falsy) first to avoid foreign key errors on subcategories
      const sortedCats = [...data.categories].sort((a, b) => {
        const aHasParent = Boolean(a.parentId);
        const bHasParent = Boolean(b.parentId);
        if (!aHasParent && bHasParent) return -1;
        if (aHasParent && !bHasParent) return 1;
        return (a.order || 0) - (b.order || 0);
      });

      const catsToInsert = sortedCats.map((c: any) => ({
        id: c.id,
        dashboardId,
        userId,
        parentId: c.parentId || null,
        name: c.name,
        icon: c.icon,
        color: c.color,
        order: c.order ?? 0,
        createdAt: new Date(c.createdAt || Date.now()),
      }));
      await tx.insert(categories).values(catsToInsert);
    }
    
    // Insert new resources
    if (data.resources && data.resources.length > 0) {
      const resToInsert = data.resources.map((r: any) => ({
        id: r.id,
        dashboardId,
        userId,
        categoryId: r.categoryId,
        subcategoryId: r.subcategoryId || null,
        title: r.title,
        url: r.url,
        type: r.type,
        coverImage: r.coverImage,
        description: r.description,
        favorite: Boolean(r.favorite),
        completed: Boolean(r.completed),
        pinned: Boolean(r.pinned),
        createdAt: new Date(r.createdAt || Date.now()),
        updatedAt: new Date(r.updatedAt || Date.now()),
        lastOpenedAt: r.lastOpenedAt ? new Date(r.lastOpenedAt) : null,
        order: r.order ?? 0,
      }));
      await tx.insert(resources).values(resToInsert);
    }

    // Touch dashboard updatedAt timestamp
    await tx.update(dashboards)
      .set({ updatedAt: new Date() })
      .where(eq(dashboards.id, dashboardId));
  });
}

export async function getUserData(dashboardId: string) {
  const dashCategories = await db.select().from(categories).where(eq(categories.dashboardId, dashboardId));
  const dashResources = await db.select().from(resources).where(eq(resources.dashboardId, dashboardId));
  
  return {
    categories: dashCategories.map(c => ({
      ...c,
      parentId: c.parentId || undefined,
      createdAt: c.createdAt?.getTime() || Date.now(),
    })),
    resources: dashResources.map(r => ({
      ...r,
      subcategoryId: r.subcategoryId || undefined,
      createdAt: r.createdAt?.getTime() || Date.now(),
      updatedAt: r.updatedAt?.getTime() || Date.now(),
      lastOpenedAt: r.lastOpenedAt?.getTime() || undefined,
    })),
  };
}
