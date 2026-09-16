import { useState, type FormEvent, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth-context';
import { 
  Folder, 
  Star, 
  Clock, 
  Plus, 
  Moon, 
  Sun, 
  Trash2, 
  Edit2, 
  GripVertical, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Globe, 
  Layers, 
  ChevronRight, 
  ChevronDown,
  CornerDownRight,
  FolderPlus
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Category } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function SortableCategoryItem({ 
  category, 
  subcategories,
  activeCategoryId, 
  activeSubcategoryId,
  activeView, 
  setActiveCategory, 
  setIsMobileOpen, 
  setEditingId, 
  setEditName, 
  deleteCategory,
  onAddSubcategory,
  isSidebarCollapsed
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const isCategoryActive = activeCategoryId === category.id && activeView === 'category' && !activeSubcategoryId;
  const hasSubcategories = subcategories && subcategories.length > 0;

  return (
    <div ref={setNodeRef} style={style} className="group relative flex flex-col mb-1">
      <div className="flex items-center">
        {!isSidebarCollapsed && (
          <div 
            {...attributes} 
            {...listeners}
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 p-1 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing hover:text-slate-500 dark:hover:text-slate-400 transition-opacity z-10"
          >
            <GripVertical size={14} />
          </div>
        )}
        
        <button 
          onClick={() => { 
            setActiveCategory(category.id, null); 
            setIsMobileOpen(false); 
            setConfirmDeleteId(null); 
          }}
          className={cn(
            "w-full flex items-center px-2.5 py-2 text-sm font-medium rounded-xl transition-colors text-left",
            isSidebarCollapsed ? "justify-center" : "gap-2.5",
            isCategoryActive
              ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold" 
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80"
          )}
          title={isSidebarCollapsed ? category.name : undefined}
        >
          {/* Expand / Collapse trigger */}
          {!isSidebarCollapsed && hasSubcategories ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          ) : !isSidebarCollapsed ? (
            <div className="w-3.5" />
          ) : null}

          <Folder size={16} className={cn("shrink-0", isCategoryActive ? "text-indigo-600 dark:text-indigo-400 opacity-100" : "opacity-70")} />
          
          {!isSidebarCollapsed && (
            <>
              <span className="truncate flex-1">{category.name}</span>
              
              <div className="ml-auto hidden group-hover:flex items-center gap-0.5">
                {confirmDeleteId === category.id ? (
                  <div className="flex items-center gap-1">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCategory(category.id);
                      }}
                      className="px-1.5 py-0.5 hover:bg-red-200 dark:hover:bg-red-900/50 rounded text-red-500 font-bold text-[10px]"
                      title="Confirm Delete"
                    >
                      Delete
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(null);
                      }}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400"
                      title="Cancel"
                    >
                      <Trash2 size={12} className="opacity-50" />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Add Subcategory inline button */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddSubcategory(category.id);
                        setIsExpanded(true);
                      }}
                      className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-950/70 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      title="Add Sub-category"
                    >
                      <FolderPlus size={13} />
                    </div>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(category.id);
                        setEditName(category.name);
                      }}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600"
                      title="Rename"
                    >
                      <Edit2 size={12} />
                    </div>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(category.id);
                      }}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-red-400 hover:text-red-600"
                      title="Delete category"
                    >
                      <Trash2 size={12} />
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </button>
      </div>

      {/* Render Subcategories list */}
      {!isSidebarCollapsed && isExpanded && hasSubcategories && (
        <div className="pl-6 pr-1 py-0.5 space-y-0.5 border-l-2 border-slate-200 dark:border-slate-800 ml-5 my-0.5">
          {subcategories.map((sub: Category) => {
            const isSubActive = activeCategoryId === category.id && activeSubcategoryId === sub.id && activeView === 'category';
            return (
              <div key={sub.id} className="group/sub flex items-center">
                <button
                  onClick={() => {
                    setActiveCategory(category.id, sub.id);
                    setIsMobileOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left",
                    isSubActive 
                      ? "bg-indigo-100/70 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                  title={sub.name}
                >
                  <CornerDownRight size={12} className={cn(isSubActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
                  <span className="truncate flex-1">{sub.name}</span>
                  
                  <div className="ml-auto hidden group-hover/sub:flex items-center gap-1">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(sub.id);
                        setEditName(sub.name);
                      }}
                      className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600"
                      title="Rename sub-category"
                    >
                      <Edit2 size={11} />
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCategory(sub.id);
                      }}
                      className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-slate-400 hover:text-red-500"
                      title="Delete sub-category"
                    >
                      <Trash2 size={11} />
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
  onAddBookmark?: () => void;
  onAddResource?: () => void;
}

export function Sidebar({ isMobileOpen, setIsMobileOpen, onAddBookmark, onAddResource }: SidebarProps) {
  const { 
    categories, 
    activeCategoryId, 
    activeSubcategoryId,
    activeView, 
    setActiveCategory, 
    setActiveView, 
    addCategory, 
    addSubcategory,
    theme, 
    toggleTheme, 
    deleteCategory, 
    updateCategory, 
    reorderCategories, 
    isSidebarCollapsed, 
    toggleSidebar 
  } = useStore();

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // State for adding subcategory inline
  const [addingSubcategoryParentId, setAddingSubcategoryParentId] = useState<string | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Separate parent categories from subcategories
  const parentCategories = useMemo(() => categories.filter(c => !c.parentId), [categories]);
  
  const subcategoriesMap = useMemo(() => {
    const map: Record<string, Category[]> = {};
    categories.forEach(c => {
      if (c.parentId) {
        if (!map[c.parentId]) map[c.parentId] = [];
        map[c.parentId].push(c);
      }
    });
    return map;
  }, [categories]);

  const handleAddCategory = (e: FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      addCategory(newCategoryName.trim());
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const handleAddSubcategory = (e: FormEvent) => {
    e.preventDefault();
    if (newSubcategoryName.trim() && addingSubcategoryParentId) {
      addSubcategory(addingSubcategoryParentId, newSubcategoryName.trim());
      setNewSubcategoryName('');
      setAddingSubcategoryParentId(null);
    }
  };

  const handleEditCategory = (e: FormEvent) => {
    e.preventDefault();
    if (editName.trim() && editingId) {
      updateCategory(editingId, editName.trim());
      setEditingId(null);
      setEditName('');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = parentCategories.findIndex((cat) => cat.id === active.id);
      const newIndex = parentCategories.findIndex((cat) => cat.id === over.id);
      reorderCategories(oldIndex, newIndex);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col",
        isMobileOpen ? "translate-x-0 w-64" : cn(
          "-translate-x-full lg:translate-x-0",
          isSidebarCollapsed ? "lg:w-20 w-64" : "w-64"
        )
      )}>
        {/* Header */}
        <div className={cn(
          "p-4 flex items-center font-semibold text-lg text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 h-16",
          isSidebarCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-600/30">
                <Folder size={18} />
              </div>
              <span className="truncate text-base font-bold">Note Manager</span>
            </div>
          )}
          
          <button 
            onClick={toggleSidebar}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-4 overflow-x-hidden space-y-6">
          
          {/* SECTION 1: Web Bookmarks */}
          <div className="px-3">
            <div className={cn("px-1 mb-1.5 flex items-center", isSidebarCollapsed ? "justify-center" : "justify-between")}>
              {!isSidebarCollapsed && (
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Web Bookmarks
                </span>
              )}
              {onAddBookmark && (
                <button 
                  onClick={onAddBookmark}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  title="Add Web Bookmark (fetches favicon)"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>

            <button 
              onClick={() => { setActiveView('bookmarks'); setIsMobileOpen(false); }}
              className={cn("w-full flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors", 
                isSidebarCollapsed ? "justify-center" : "gap-3",
                activeView === 'bookmarks' 
                  ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800")}
              title={isSidebarCollapsed ? "Web Bookmarks" : undefined}
            >
              <Globe size={18} className="shrink-0 text-indigo-500" /> 
              {!isSidebarCollapsed && <span className="truncate">All Bookmarks</span>}
            </button>
          </div>

          {/* SECTION 2: Learning Resources */}
          <div className="px-3">
            <div className={cn("px-1 mb-1.5 flex items-center", isSidebarCollapsed ? "justify-center" : "justify-between")}>
              {!isSidebarCollapsed && (
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Resources
                </span>
              )}
              {onAddResource && (
                <button 
                  onClick={onAddResource}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  title="Add Learning Resource (fetches thumbnail)"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>

            <div className="space-y-0.5">
              <button 
                onClick={() => { setActiveView('home'); setIsMobileOpen(false); }}
                className={cn("w-full flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors", 
                  isSidebarCollapsed ? "justify-center" : "gap-3",
                  activeView === 'home' 
                    ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800")}
                title={isSidebarCollapsed ? "All Resources" : undefined}
              >
                <Layers size={18} className="shrink-0" /> 
                {!isSidebarCollapsed && <span className="truncate">All Resources</span>}
              </button>
              <button 
                onClick={() => { setActiveView('favorites'); setIsMobileOpen(false); }}
                className={cn("w-full flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors", 
                  isSidebarCollapsed ? "justify-center" : "gap-3",
                  activeView === 'favorites' 
                    ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800")}
                title={isSidebarCollapsed ? "Favorites" : undefined}
              >
                <Star size={18} className="shrink-0 text-amber-500" /> 
                {!isSidebarCollapsed && <span className="truncate">Favorites</span>}
              </button>
              <button 
                onClick={() => { setActiveView('recent'); setIsMobileOpen(false); }}
                className={cn("w-full flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors", 
                  isSidebarCollapsed ? "justify-center" : "gap-3",
                  activeView === 'recent' 
                    ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800")}
                title={isSidebarCollapsed ? "Recently Opened" : undefined}
              >
                <Clock size={18} className="shrink-0" /> 
                {!isSidebarCollapsed && <span className="truncate">Recently Opened</span>}
              </button>
            </div>
          </div>

          {/* SECTION 3: Playlists & Categories (with Sub-categories) */}
          <div className="px-3">
            <div className={cn("px-1 mb-1.5 flex items-center", isSidebarCollapsed ? "justify-center" : "justify-between")}>
              {!isSidebarCollapsed && (
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Playlists & Categories
                </span>
              )}
              <button 
                onClick={() => {
                  if (isSidebarCollapsed) toggleSidebar();
                  setIsAddingCategory(true);
                }}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                title="Create New Category / Folder"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-0.5">
              {isAddingCategory && !isSidebarCollapsed && (
                <form onSubmit={handleAddCategory} className="mb-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="New category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onBlur={() => setIsAddingCategory(false)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </form>
              )}

              {/* Inline Subcategory Input */}
              {addingSubcategoryParentId && !isSidebarCollapsed && (
                <form onSubmit={handleAddSubcategory} className="mb-2 p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                  <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                    Add Sub-category to {parentCategories.find(c => c.id === addingSubcategoryParentId)?.name}
                  </div>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Sub-category name..."
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                    onBlur={() => {
                      if (!newSubcategoryName.trim()) setAddingSubcategoryParentId(null);
                    }}
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </form>
              )}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={parentCategories.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {parentCategories.map(category => (
                    <div key={category.id} className="mb-0.5">
                      {editingId === category.id && !isSidebarCollapsed ? (
                        <form onSubmit={handleEditCategory} className="mb-1">
                          <input
                            type="text"
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={() => setEditingId(null)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </form>
                      ) : (
                        <SortableCategoryItem 
                          category={category}
                          subcategories={subcategoriesMap[category.id] || []}
                          activeCategoryId={activeCategoryId}
                          activeSubcategoryId={activeSubcategoryId}
                          activeView={activeView}
                          setActiveCategory={setActiveCategory}
                          setIsMobileOpen={setIsMobileOpen}
                          setEditingId={setEditingId}
                          setEditName={setEditName}
                          deleteCategory={deleteCategory}
                          onAddSubcategory={(parentId: string) => {
                            setAddingSubcategoryParentId(parentId);
                            setNewSubcategoryName('');
                          }}
                          isSidebarCollapsed={isSidebarCollapsed}
                        />
                      )}
                    </div>
                  ))}
                </SortableContext>
              </DndContext>
              
              {parentCategories.length === 0 && !isAddingCategory && !isSidebarCollapsed && (
                <div className="px-3 py-3 text-xs text-center text-slate-400">
                  No categories yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
          <button 
            onClick={toggleTheme}
            className={cn(
              "flex items-center justify-center py-2 px-3 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
              isSidebarCollapsed ? "w-full" : "w-full gap-2"
            )}
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? <Moon size={15} className="shrink-0" /> : <Sun size={15} className="shrink-0" />}
            {!isSidebarCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>
          <AuthButton isSidebarCollapsed={isSidebarCollapsed} />
        </div>
      </aside>
    </>
  );
}

function AuthButton({ isSidebarCollapsed }: { isSidebarCollapsed: boolean }) {
  const { user, isGuest, signOut } = useAuth();
  
  if (user || isGuest) {
    return (
      <button 
        onClick={signOut}
        className={cn(
          "flex items-center justify-center py-2 px-3 text-xs font-medium rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors",
          isSidebarCollapsed ? "w-full" : "w-full gap-2"
        )}
        title={isGuest ? "Exit Guest Mode" : "Sign Out"}
      >
        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-slate-200 dark:bg-slate-700">
          {user && user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">G</span>
          )}
        </div>
        {!isSidebarCollapsed && <span className="truncate">{isGuest ? "Exit Guest Mode" : "Sign Out"}</span>}
      </button>
    );
  }
  
  return null;
}
