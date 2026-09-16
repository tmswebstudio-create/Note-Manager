import { useState, useMemo, type Key, type FormEvent } from 'react';
import { useStore } from '../store/useStore';
import { Resource, Category } from '../types';
import { Globe, Pin, MoreHorizontal, Edit2, Trash2, FolderPlus, Plus, Tag } from 'lucide-react';
import { cn } from './Sidebar';
import { getFaviconUrl, getDuckDuckGoFaviconUrl } from '../utils/url-helpers';
import { CategoryIcon } from './CategoryIcon';
import { CategoryModal } from './CategoryModal';

function BookmarkItem({ item, onEdit, subcategoryName }: { item: Resource, onEdit: (r: Resource) => void, subcategoryName?: string, key?: Key }) {
  const { togglePinned, deleteResource } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [favIndex, setFavIndex] = useState(0);

  const domain = useMemo(() => {
    try {
      return new URL(item.url).hostname;
    } catch (e) {
      return null;
    }
  }, [item.url]);

  // Try Google 128px favicon first, then DuckDuckGo icon, then cover image if it's an icon, then fallback
  const faviconSources = useMemo(() => {
    if (!item.url) return [];
    return [
      getFaviconUrl(item.url, 128),
      getDuckDuckGoFaviconUrl(item.url),
      item.coverImage && (item.coverImage.includes('favicon') || item.coverImage.includes('icon') || item.coverImage.includes('logo')) ? item.coverImage : '',
    ].filter(Boolean);
  }, [item.url, item.coverImage]);

  const currentIconUrl = faviconSources[favIndex] || null;

  const handleOpen = () => {
    useStore.getState().updateResource(item.id, { lastOpenedAt: Date.now() });
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  const handleImageError = () => {
    if (favIndex < faviconSources.length - 1) {
      setFavIndex(prev => prev + 1);
    } else {
      setFavIndex(faviconSources.length); // triggers fallback globe icon
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5 group relative">
      <div 
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center cursor-pointer hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-all overflow-hidden relative shadow-sm hover:-translate-y-0.5"
        onClick={handleOpen}
      >
        {currentIconUrl ? (
          <img 
            src={currentIconUrl} 
            alt={item.title || domain || 'Website'}
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-lg p-0.5"
            referrerPolicy="no-referrer"
            onError={handleImageError}
          />
        ) : (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
            {item.title ? item.title.charAt(0).toUpperCase() : <Globe size={24} />}
          </div>
        )}
        
        {/* Overlay actions on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col sm:flex-row items-center justify-center gap-2 backdrop-blur-[2px] rounded-2xl">
          <button 
            onClick={(e) => { e.stopPropagation(); togglePinned(item.id); }}
            className={cn("p-1.5 rounded-full text-white hover:bg-white/20 transition-colors", item.pinned ? "text-indigo-400" : "")}
            title={item.pinned ? "Unpin" : "Pin"}
          >
            <Pin size={18} className={item.pinned ? "fill-current" : ""} />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1.5 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
      
      <div className="w-full text-center px-1" onClick={handleOpen}>
        <h4 className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white truncate cursor-pointer group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={item.title}>
          {item.title}
        </h4>
        
        {subcategoryName ? (
          <div className="inline-flex items-center gap-0.5 mt-0.5 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-medium max-w-full truncate" title={`Sub-category: ${subcategoryName}`}>
            <Tag size={9} className="shrink-0" />
            <span className="truncate">{subcategoryName}</span>
          </div>
        ) : domain ? (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate" title={domain}>
            {domain.replace(/^www\./, '')}
          </p>
        ) : null}
      </div>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setShowMenu(false); setConfirmDelete(false); }} />
          <div className="absolute top-20 sm:top-24 z-20 mt-2 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-none py-1 overflow-hidden">
            <button 
              onClick={() => { onEdit(item); setShowMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <Edit2 size={14} /> Edit
            </button>
            {confirmDelete ? (
              <button 
                onClick={() => { 
                  deleteResource(item.id);
                  setShowMenu(false);
                  setConfirmDelete(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-white bg-red-500 hover:bg-red-600 font-medium"
              >
                Confirm Delete
              </button>
            ) : (
              <button 
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function BookmarkView({ onEdit, onAdd }: { onEdit: (r: Resource) => void, onAdd?: (defaultCategoryId?: string, defaultSubcategoryId?: string) => void }) {
  const { resources, categories, searchQuery, addSubcategory } = useStore();
  
  // Local active subcategory filter per category group
  const [selectedSubcategories, setSelectedSubcategories] = useState<Record<string, string | null>>({});
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
    categoryType: 'bookmark',
  });

  // Filter strictly for website bookmarks
  const isWebsite = (type: string) => type === 'Website';
  let bookmarks = resources.filter(r => isWebsite(r.type));

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    bookmarks = bookmarks.filter(r => 
      r.title.toLowerCase().includes(q) || 
      (r.description && r.description.toLowerCase().includes(q)) ||
      r.url.toLowerCase().includes(q)
    );
  }

  const pinned = bookmarks.filter(b => b.pinned);

  // Group all bookmarks by parent category
  const parentCategories = useMemo(() => categories.filter(c => !c.parentId), [categories]);
  
  const grouped = useMemo(() => {
    const map: Record<string, Resource[]> = {};
    bookmarks.forEach(curr => {
      const cat = categories.find(c => c.id === curr.categoryId)?.name || 'Uncategorized';
      if (!map[cat]) map[cat] = [];
      map[cat].push(curr);
    });
    return map;
  }, [bookmarks, categories]);

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        <Globe size={48} className="mb-4 opacity-20" />
        <p className="font-medium text-slate-700 dark:text-slate-300">No web bookmarks found.</p>
        <p className="text-xs mt-1 opacity-70 mb-4">Add your first website or tool with sub-categories.</p>
        {onAdd && (
          <button 
            onClick={() => onAdd()} 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow-sm shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Add Web Bookmark</span>
          </button>
        )}
      </div>
    );
  }

  const groupedEntries: [string, Resource[]][] = Object.entries(grouped);

  return (
    <div className="p-4 sm:p-8 space-y-10 pb-32">
      
      {/* 1. Pinned Section */}
      {pinned.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Pin size={18} className="text-indigo-500 fill-indigo-500" /> Pinned Quick Access
            </h2>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {pinned.length}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-y-6 gap-x-4">
            {pinned.map(b => {
              const subName = b.subcategoryId ? categories.find(c => c.id === b.subcategoryId)?.name : undefined;
              return <BookmarkItem key={b.id} item={b} onEdit={onEdit} subcategoryName={subName} />;
            })}
          </div>
        </div>
      )}

      {/* 2. Main Category Groups with Subcategory Filters & Badges */}
      {groupedEntries
        .sort(([catA], [catB]) => catA.localeCompare(catB))
        .map(([categoryName, items]) => {
          const categoryObj = parentCategories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
          const categoryId = categoryObj?.id;
          const subcategories = categoryId ? categories.filter(c => c.parentId === categoryId) : [];
          
          const activeSubId = categoryId ? selectedSubcategories[categoryId] || null : null;
          
          // Filter items by subcategory if a subcategory is selected
          const displayItems = activeSubId 
            ? items.filter(i => i.subcategoryId === activeSubId)
            : items;

          return (
            <div key={categoryName} className="space-y-4">
              
              {/* Category Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <CategoryIcon 
                    icon={categoryObj?.icon} 
                    name={categoryName} 
                    isSubcategory={false} 
                    size="md" 
                  />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {categoryName}
                  </h2>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {categoryId && (
                    <button
                      onClick={() => {
                        setCategoryModalConfig({
                          isOpen: true,
                          editingCategory: null,
                          parentId: categoryId,
                          parentName: categoryName,
                          categoryType: 'bookmark',
                        });
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg flex items-center gap-1 transition-colors"
                      title="Add sub-category (with icon) to this folder"
                    >
                      <FolderPlus size={13} />
                      <span className="hidden sm:inline">Add Sub-category</span>
                    </button>
                  )}
                  {categoryObj && (
                    <button
                      onClick={() => {
                        setCategoryModalConfig({
                          isOpen: true,
                          editingCategory: categoryObj,
                          parentId: null,
                          categoryType: 'bookmark',
                        });
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title={`Edit ${categoryName} icon & name`}
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  {onAdd && (
                    <button
                      onClick={() => onAdd(categoryId, activeSubId || undefined)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title={`Add bookmark to ${categoryName}`}
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-category Filter Tabs */}
              {subcategories.length > 0 && categoryId && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <button
                    onClick={() => setSelectedSubcategories(prev => ({ ...prev, [categoryId]: null }))}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      activeSubId === null
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    All ({items.length})
                  </button>

                  {subcategories.map(sub => {
                    const count = items.filter(i => i.subcategoryId === sub.id).length;
                    const isSelected = activeSubId === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSubcategories(prev => ({ 
                          ...prev, 
                          [categoryId]: isSelected ? null : sub.id 
                        }))}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5",
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
                        <span className={cn("text-[10px] px-1 rounded-full", isSelected ? "bg-indigo-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400")}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Bookmark Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-y-6 gap-x-4">
                {displayItems.map(b => {
                  const subName = b.subcategoryId ? categories.find(c => c.id === b.subcategoryId)?.name : undefined;
                  return <BookmarkItem key={b.id} item={b} onEdit={onEdit} subcategoryName={subName} />;
                })}
              </div>
            </div>
          );
        })}

      {/* Category/Subcategory Modal */}
      <CategoryModal
        isOpen={categoryModalConfig.isOpen}
        onClose={() => setCategoryModalConfig({ isOpen: false, editingCategory: null, parentId: null })}
        editingCategory={categoryModalConfig.editingCategory}
        parentId={categoryModalConfig.parentId}
        parentName={categoryModalConfig.parentName}
        categoryType={categoryModalConfig.categoryType || 'bookmark'}
      />
    </div>
  );
}
