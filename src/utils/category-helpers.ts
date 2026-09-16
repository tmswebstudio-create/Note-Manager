import { Category, Resource } from '../types';

/**
 * Checks if a category is strictly a bookmark category.
 * If explicitly marked with type: 'bookmark', returns true.
 * If explicitly marked with type: 'resource', returns false.
 * For existing/legacy categories without type:
 * - If it has learning resources (Video, Post), it is NOT a bookmark category.
 * - If it exclusively has website bookmarks (and 0 learning resources), it IS a bookmark category.
 */
export function isBookmarkCategory(
  category: Category, 
  allCategories: Category[] = [], 
  allResources: Resource[] = []
): boolean {
  if (category.type === 'bookmark') return true;
  if (category.type === 'resource') return false;

  // If this is a subcategory, check its parent first
  if (category.parentId) {
    const parent = allCategories.find(c => c.id === category.parentId);
    if (parent) {
      if (parent.type === 'bookmark') return true;
      if (parent.type === 'resource') return false;
      if (isBookmarkCategory(parent, allCategories, allResources)) return true;
    }
  }

  // Legacy fallback based on assigned resource types
  const subIds = allCategories.filter(sub => sub.parentId === category.id).map(sub => sub.id);
  const relevantIds = [category.id, ...subIds];

  const hasLearningResources = allResources.some(
    r => (relevantIds.includes(r.categoryId) || (r.subcategoryId && relevantIds.includes(r.subcategoryId))) && r.type !== 'Website'
  );
  if (hasLearningResources) return false;

  const hasBookmarkResources = allResources.some(
    r => (relevantIds.includes(r.categoryId) || (r.subcategoryId && relevantIds.includes(r.subcategoryId))) && r.type === 'Website'
  );
  if (hasBookmarkResources) return true;

  // If no resources assigned, check if name matches common bookmark terms
  const bookmarkKeywords = ['bookmark', 'website', 'social', 'tools', 'utilities', 'links'];
  if (bookmarkKeywords.some(k => category.name.toLowerCase().includes(k))) {
    return true;
  }

  return false;
}

/**
 * Checks if a category is a learning resource / playlist category.
 */
export function isResourceCategory(
  category: Category, 
  allCategories: Category[] = [], 
  allResources: Resource[] = []
): boolean {
  return !isBookmarkCategory(category, allCategories, allResources);
}
