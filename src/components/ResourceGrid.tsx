import { useState, type FormEvent } from 'react';
import { useStore } from '../store/useStore';
import { ResourceCard } from './ResourceCard';
import { Resource } from '../types';
import { Layers, Plus, FolderPlus, Tag } from 'lucide-react';
import { cn } from './Sidebar';

export function ResourceGrid({ onEdit, onAddResource }: { onEdit: (r: Resource) => void, onAddResource?: (defaultCategoryId?: string, defaultSubcategoryId?: string) => void }) {
  const { 
    resources, 
    categories, 
    activeCategoryId, 
    activeSubcategoryId, 
    setActiveSubcategory, 
    activeView, 
    searchQuery,
    addSubcategory 
  } = useStore();

  const [isAddingSubcat, setIsAddingSubcat] = useState(false);
  const [newSubcatName, setNewSubcatName] = useState('');

  const activeCategory = activeCategoryId ? categories.find(c => c.id === activeCategoryId) : null;
  const subcategories = activeCategoryId ? categories.filter(c => c.parentId === activeCategoryId) : [];

  let filtered = resources;

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
    filtered.sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));
  } else {
    filtered.sort((a, b) => b.createdAt - a.createdAt);
  }

  const handleCreateSubcategory = (e: FormEvent) => {
    e.preventDefault();
    if (newSubcatName.trim() && activeCategoryId) {
      const newSubId = addSubcategory(activeCategoryId, newSubcatName.trim());
      setNewSubcatName('');
      setIsAddingSubcat(false);
      setActiveSubcategory(newSubId);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      
      {/* Sub-category Header & Filtering Toolbar for Category View */}
      {activeView === 'category' && activeCategoryId && (
        <div className="space-y-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Sub-categories
              </span>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {subcategories.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsAddingSubcat(!isAddingSubcat);
                  setNewSubcatName('');
                }}
                className="px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg flex items-center gap-1 transition-colors"
              >
                <FolderPlus size={13} />
                <span>Add Sub-category</span>
              </button>

              {onAddResource && (
                <button
                  onClick={() => onAddResource(activeCategoryId, activeSubcategoryId || undefined)}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1 shadow-sm transition-all"
                >
                  <Plus size={13} />
                  <span>Add Resource</span>
                </button>
              )}
            </div>
          </div>

          {/* Inline Sub-category Creation Form */}
          {isAddingSubcat && (
            <form 
              onSubmit={handleCreateSubcategory}
              className="flex items-center gap-2 p-2 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl animate-in fade-in"
            >
              <input
                type="text"
                autoFocus
                placeholder={`New sub-category for ${activeCategory?.name}...`}
                value={newSubcatName}
                onChange={(e) => setNewSubcatName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsAddingSubcat(false)}
                className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Cancel
              </button>
            </form>
          )}

          {/* Sub-category Filter Tabs */}
          {subcategories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                onClick={() => setActiveSubcategory(null)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  activeSubcategoryId === null
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                All in {activeCategory?.name} ({resources.filter(r => r.categoryId === activeCategoryId).length})
              </button>

              {subcategories.map(sub => {
                const count = resources.filter(r => r.categoryId === activeCategoryId && r.subcategoryId === sub.id).length;
                const isSelected = activeSubcategoryId === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubcategory(isSelected ? null : sub.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5",
                      isSelected
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    <Tag size={11} className={isSelected ? "text-white" : "text-indigo-500"} />
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

      {/* Grid or Empty State */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-500 mb-4 shadow-sm">
            <Layers className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No resources found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
            {searchQuery 
              ? "Try adjusting your search terms." 
              : activeSubcategoryId 
                ? "No resources in this sub-category yet." 
                : "Start building your library by adding your first video or post."}
          </p>
          {onAddResource && !searchQuery && (
            <button 
              onClick={() => onAddResource(activeCategoryId || undefined, activeSubcategoryId || undefined)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow-sm shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Plus size={15} />
              <span>Add Resource</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filtered.map(resource => (
            <ResourceCard key={resource.id} resource={resource} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}
