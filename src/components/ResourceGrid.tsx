import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { ResourceCard } from './ResourceCard';
import { Resource, Category } from '../types';
import { 
  Layers, Plus, FolderPlus, Edit2, Trash2, ArrowLeft, 
  FolderTree, Play, FileText, ChevronRight, Sparkles 
} from 'lucide-react';
import { cn } from './Sidebar';
import { CategoryIcon } from './CategoryIcon';
import { CategoryModal } from './CategoryModal';
import { isResourceCategory } from '../utils/category-helpers';

export function ResourceGrid({ 
  onEdit, 
  onAddResource 
}: { 
  onEdit: (r: Resource) => void; 
  onAddResource?: (defaultCategoryId?: string, defaultSubcategoryId?: string) => void;
}) {
  const { 
    resources, 
    categories, 
    activeCategoryId, 
    activeSubcategoryId, 
    setActiveCategory,
    setActiveSubcategory, 
    setActiveView,
    activeView, 
    searchQuery,
    deleteCategory
  } = useStore();

  const [categoryModalConfig, setCategoryModalConfig] = useState<{
    isOpen: boolean;
    editingCategory?: Category | null;
    parentId?: string | null;
    parentName?: string;
    categoryType?: 'resource' | 'bookmark';
  }>({
    isOpen: false,
    editingCategory: null,
    parentId: null,
    categoryType: 'resource',
  });

  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Video' | 'Post'>('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // STRICT RULE: ResourceGrid only displays learning resources (Video, Post), NEVER website bookmarks
  const learningResources = useMemo(() => {
    return resources.filter(r => r.type !== 'Website');
  }, [resources]);

  // Parent categories strictly for resources/playlists (excluding bookmark categories)
  const parentCategories = useMemo(() => {
    return categories.filter(c => !c.parentId && isResourceCategory(c, categories, resources));
  }, [categories, resources]);

  // Subcategories map strictly for resources/playlists (excluding bookmark subcategories)
  const subcategoriesMap = useMemo(() => {
    const map: Record<string, Category[]> = {};
    categories.forEach(c => {
      if (c.parentId && isResourceCategory(c, categories, resources)) {
        if (!map[c.parentId]) map[c.parentId] = [];
        map[c.parentId].push(c);
      }
    });
    return map;
  }, [categories, resources]);

  const activeCategory = activeCategoryId ? categories.find(c => c.id === activeCategoryId) : null;
  const currentSubcategories = activeCategoryId ? (subcategoriesMap[activeCategoryId] || []) : [];

  // Filtered resources based on active view and category/subcategory
  let filtered = learningResources;

  if (activeView === 'favorites') {
    filtered = filtered.filter(r => r.favorite);
  } else if (activeView === 'recent') {
    filtered = filtered.filter(r => r.lastOpenedAt);
  } else if (activeView === 'category' && activeCategoryId) {
    filtered = filtered.filter(r => r.categoryId === activeCategoryId);
    if (activeSubcategoryId) {
      filtered = filtered.filter(r => r.subcategoryId === activeSubcategoryId);
    }
  }

  // Type filter (Video / Post)
  if (typeFilter !== 'ALL') {
    filtered = filtered.filter(r => r.type === typeFilter);
  }

  // Search filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(r => 
      r.title.toLowerCase().includes(q) || 
      r.description?.toLowerCase().includes(q) || 
      r.url.toLowerCase().includes(q)
    );
  }

  // Sort logic
  if (activeView === 'recent') {
    filtered = [...filtered].sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));
  } else {
    filtered = [...filtered].sort((a, b) => b.createdAt - a.createdAt);
  }

  const openAddCategoryModal = () => {
    setCategoryModalConfig({
      isOpen: true,
      editingCategory: null,
      parentId: null,
      categoryType: 'resource',
    });
  };

  const openAddSubcategoryModal = (parentId: string, parentName: string) => {
    setCategoryModalConfig({
      isOpen: true,
      editingCategory: null,
      parentId,
      parentName,
      categoryType: 'resource',
    });
  };

  const openEditCategoryModal = (cat: Category) => {
    setCategoryModalConfig({
      isOpen: true,
      editingCategory: cat,
      parentId: cat.parentId || null,
      categoryType: 'resource',
    });
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 w-full">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. SECTION: PLAYLISTS & CATEGORIES (Shown on All Resources page) */}
      {/* ------------------------------------------------------------- */}
      {activeView === 'home' && !searchQuery && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <FolderTree size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Playlists & Categories
                  </h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {parentCategories.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Topic collections, playlists, and sub-categories for your videos and articles
                </p>
              </div>
            </div>

            <button
              onClick={openAddCategoryModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-200/60 dark:border-indigo-800/60 transition-all active:scale-95 shadow-sm"
              title="Create new playlist or category"
            >
              <Plus size={14} />
              <span>New Category</span>
            </button>
          </div>

          {/* Grid of Categories Cards */}
          {parentCategories.length === 0 ? (
            <div 
              onClick={openAddCategoryModal}
              className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600/50 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer flex flex-col items-center justify-center text-center transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <FolderTree size={22} />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">No playlists or categories created</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Click here to create your first learning category with custom icon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {parentCategories.map(cat => {
                const count = learningResources.filter(r => r.categoryId === cat.id).length;
                const subs = subcategoriesMap[cat.id] || [];

                return (
                  <div
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id, null)}
                    className="group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-400 dark:hover:border-indigo-600/60 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Top bar with icon, title & action controls */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <CategoryIcon 
                            icon={cat.icon} 
                            name={cat.name} 
                            isSubcategory={false} 
                            size="md" 
                          />
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {cat.name}
                            </h3>
                            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                              {count} {count === 1 ? 'resource' : 'resources'}
                            </span>
                          </div>
                        </div>

                        {/* Quick edit / add subcategory */}
                        <div 
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => openAddSubcategoryModal(cat.id, cat.name)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-md"
                            title="Add sub-category"
                          >
                            <FolderPlus size={13} />
                          </button>
                          <button
                            onClick={() => openEditCategoryModal(cat)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
                            title="Edit category"
                          >
                            <Edit2 size={13} />
                          </button>
                          {confirmDeleteId === cat.id ? (
                            <button
                              onClick={() => deleteCategory(cat.id)}
                              className="px-1.5 py-0.5 bg-red-500 text-white rounded text-[10px] font-bold"
                              title="Confirm delete"
                            >
                              Del
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(cat.id)}
                              className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded-md"
                              title="Delete category"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Subcategories tags preview */}
                      {subs.length > 0 && (
                        <div className="mt-3.5 flex flex-wrap gap-1.5">
                          {subs.slice(0, 3).map(sub => {
                            const subCount = learningResources.filter(r => r.categoryId === cat.id && r.subcategoryId === sub.id).length;
                            return (
                              <span
                                key={sub.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCategory(cat.id, sub.id);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-600 dark:text-slate-400 rounded-md text-[10px] font-medium transition-colors"
                              >
                                <CategoryIcon icon={sub.icon} name={sub.name} isSubcategory={true} size="xs" />
                                <span>{sub.name}</span>
                                <span className="opacity-60 text-[9px]">({subCount})</span>
                              </span>
                            );
                          })}
                          {subs.length > 3 && (
                            <span className="text-[10px] font-medium text-slate-400 self-center">
                              +{subs.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Explore Link */}
                    <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      <span>View category</span>
                      <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. CATEGORY VIEW SPECIFIC HEADER (Breadcrumbs & Subcategories) */}
      {/* ------------------------------------------------------------- */}
      {activeView === 'category' && activeCategoryId && activeCategory && (
        <div className="space-y-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          
          {/* Breadcrumbs Navigation */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <button 
              onClick={() => setActiveView('home')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={13} />
              <span>All Resources</span>
            </button>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold">{activeCategory.name}</span>
            {activeSubcategoryId && (
              <>
                <span>/</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  {categories.find(c => c.id === activeSubcategoryId)?.name || 'Subcategory'}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CategoryIcon 
                icon={activeCategory.icon} 
                name={activeCategory.name} 
                isSubcategory={false} 
                size="lg" 
              />
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{activeCategory.name}</span>
                  <button
                    onClick={() => openEditCategoryModal(activeCategory)}
                    className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={`Edit ${activeCategory.name}`}
                  >
                    <Edit2 size={14} />
                  </button>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {learningResources.filter(r => r.categoryId === activeCategoryId).length} learning items in this category
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openAddSubcategoryModal(activeCategoryId, activeCategory.name)}
                className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl flex items-center gap-1.5 transition-colors border border-indigo-200/60 dark:border-indigo-800/60"
                title="Add sub-category"
              >
                <FolderPlus size={14} />
                <span>Add Sub-category</span>
              </button>

              {onAddResource && (
                <button
                  onClick={() => onAddResource(activeCategoryId, activeSubcategoryId || undefined)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-600/25 transition-all active:scale-95"
                >
                  <Plus size={14} />
                  <span>Add Resource</span>
                </button>
              )}
            </div>
          </div>

          {/* Sub-category Filter Tabs */}
          {currentSubcategories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                onClick={() => setActiveSubcategory(null)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
                  activeSubcategoryId === null
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                All in {activeCategory.name} ({learningResources.filter(r => r.categoryId === activeCategoryId).length})
              </button>

              {currentSubcategories.map(sub => {
                const count = learningResources.filter(r => r.categoryId === activeCategoryId && r.subcategoryId === sub.id).length;
                const isSelected = activeSubcategoryId === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubcategory(isSelected ? null : sub.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5",
                      isSelected
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    <CategoryIcon 
                      icon={sub.icon} 
                      name={sub.name} 
                      isSubcategory={true} 
                      size="xs" 
                      isActive={isSelected}
                    />
                    <span>{sub.name}</span>
                    <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full", isSelected ? "bg-indigo-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400")}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. LEARNING RESOURCES SECTION (Toolbar & Cards Grid) */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-4">
        
        {/* Resource Toolbar Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {activeView === 'category' 
                ? (activeSubcategoryId 
                    ? `${categories.find(c => c.id === activeSubcategoryId)?.name || 'Subcategory'} Resources` 
                    : `${activeCategory?.name || 'Category'} Resources`)
                : activeView === 'favorites' 
                  ? 'Starred Learning Resources' 
                  : activeView === 'recent' 
                    ? 'Recently Opened Resources' 
                    : 'All Learning Resources'}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {filtered.length}
            </span>
          </div>

          {/* Type Filter Buttons (All | Videos | Posts) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
                typeFilter === 'ALL'
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('Video')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1",
                typeFilter === 'Video'
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              <Play size={12} />
              <span>Videos</span>
            </button>
            <button
              onClick={() => setTypeFilter('Post')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1",
                typeFilter === 'Post'
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              <FileText size={12} />
              <span>Posts</span>
            </button>
          </div>
        </div>

        {/* Resources Grid or Empty State */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-500 mb-3 shadow-sm">
              <Layers className="w-7 h-7 opacity-80" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No learning resources found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
              {searchQuery 
                ? "Try adjusting your search terms." 
                : activeSubcategoryId 
                  ? "No video or post in this sub-category yet." 
                  : activeCategoryId
                    ? `No resources in ${activeCategory?.name} yet.`
                    : "Add your first video, tutorial, or post to get started."}
            </p>
            {onAddResource && !searchQuery && (
              <button 
                onClick={() => onAddResource(activeCategoryId || undefined, activeSubcategoryId || undefined)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-indigo-600/20 transition-all active:scale-95"
              >
                <Plus size={15} />
                <span>Add Learning Resource</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {filtered.map(resource => (
              <ResourceCard key={resource.id} resource={resource} onEdit={onEdit} />
            ))}
          </div>
        )}
      </section>

      {/* Category/Subcategory Modal */}
      <CategoryModal
        isOpen={categoryModalConfig.isOpen}
        onClose={() => setCategoryModalConfig({ isOpen: false, editingCategory: null, parentId: null })}
        editingCategory={categoryModalConfig.editingCategory}
        parentId={categoryModalConfig.parentId}
        parentName={categoryModalConfig.parentName}
        categoryType={categoryModalConfig.categoryType || 'resource'}
      />
    </div>
  );
}
