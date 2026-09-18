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
  FolderPlus,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { CategoryModal } from './CategoryModal';
import { isResourceCategory } from '../utils/category-helpers';
import { WorkspaceSelector } from './WorkspaceSelector';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function SortableSubcategoryItem({
  sub,
  categoryId,
  isSubActive,
  setActiveCategory,
  setIsMobileOpen,
  onEditCategory,
  deleteCategory,
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sub.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group/sub flex items-center relative my-0.5">
      <div 
        {...attributes} 
        {...listeners}
        className="absolute -left-3.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover/sub:opacity-100 cursor-grab active:cursor-grabbing hover:text-slate-500 dark:hover:text-slate-400 transition-opacity z-10"
        title="Drag to reorder subcategory"
      >
        <GripVertical size={11} />
      </div>

      <button
        onClick={() => {
          setActiveCategory(categoryId, sub.id);
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
        <CategoryIcon 
          icon={sub.icon} 
          name={sub.name} 
          isSubcategory={true} 
          isActive={isSubActive}
          size="xs"
        />
        <span className="truncate flex-1">{sub.name}</span>
        
        <div className="ml-auto hidden group-hover/sub:flex items-center gap-1">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onEditCategory(sub);
            }}
            className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600"
            title="Edit Sub-category & Icon"
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
}

function SubcategoryList({
  subcategories,
  category,
  activeCategoryId,
  activeSubcategoryId,
  activeView,
  setActiveCategory,
  setIsMobileOpen,
  onEditCategory,
  deleteCategory,
  onReorderSubcategories
}: any) {
  const subSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSubDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderSubcategories(String(active.id), String(over.id), subcategories.map((s: Category) => s.id));
    }
  };

  return (
    <DndContext
      sensors={subSensors}
      collisionDetection={closestCenter}
      onDragEnd={handleSubDragEnd}
    >
      <SortableContext
        items={subcategories.map((s: Category) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="pl-6 pr-1 py-0.5 space-y-0.5 border-l-2 border-slate-200 dark:border-slate-800 ml-5 my-0.5">
          {subcategories.map((sub: Category) => {
            const isSubActive = activeCategoryId === category.id && activeSubcategoryId === sub.id && activeView === 'category';
            return (
              <SortableSubcategoryItem
                key={sub.id}
                sub={sub}
                categoryId={category.id}
                isSubActive={isSubActive}
                setActiveCategory={setActiveCategory}
                setIsMobileOpen={setIsMobileOpen}
                onEditCategory={onEditCategory}
                deleteCategory={deleteCategory}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableCategoryItem({ 
  category, 
  subcategories,
  activeCategoryId, 
  activeSubcategoryId,
  activeView, 
  setActiveCategory, 
  setIsMobileOpen, 
  onEditCategory,
  deleteCategory,
  onAddSubcategory,
  onReorderSubcategories,
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
              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shrink-0"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          ) : !isSidebarCollapsed ? (
            <div className="w-3.5 shrink-0" />
          ) : null}

          <CategoryIcon 
            icon={category.icon} 
            name={category.name} 
            isSubcategory={false} 
            isActive={isCategoryActive}
            size={isSidebarCollapsed ? "md" : "sm"}
          />
          
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
                        onAddSubcategory(category.id, category.name);
                        setIsExpanded(true);
                      }}
                      className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-950/70 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      title="Add Sub-category (with icon)"
                    >
                      <FolderPlus size={13} />
                    </div>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCategory(category);
                      }}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600"
                      title="Edit Category & Icon"
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
        <SubcategoryList
          subcategories={subcategories}
          category={category}
          activeCategoryId={activeCategoryId}
          activeSubcategoryId={activeSubcategoryId}
          activeView={activeView}
          setActiveCategory={setActiveCategory}
          setIsMobileOpen={setIsMobileOpen}
          onEditCategory={onEditCategory}
          deleteCategory={deleteCategory}
          onReorderSubcategories={onReorderSubcategories}
        />
      )}
    </div>
  );
}

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
  onAddBookmark?: () => void;
  onAddResource?: () => void;
  onOpenSecurityModal?: () => void;
  onOpenCollaborateModal?: (defaultTab?: 'members' | 'workspaces' | 'join') => void;
}

export function Sidebar({ 
  isMobileOpen, 
  setIsMobileOpen, 
  onAddBookmark, 
  onAddResource, 
  onOpenSecurityModal,
  onOpenCollaborateModal 
}: SidebarProps) {
  const { 
    resources,
    categories, 
    activeCategoryId, 
    activeSubcategoryId, 
    activeView, 
    setActiveCategory, 
    setActiveView, 
    theme, 
    toggleTheme, 
    deleteCategory, 
    reorderCategories, 
    isSidebarCollapsed, 
    toggleSidebar 
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
    parentName: undefined,
    categoryType: 'resource',
  });

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

  // Calculate learning resources and bookmark counts
  const bookmarkCount = useMemo(() => resources.filter(r => r.type === 'Website').length, [resources]);
  const learningResourceCount = useMemo(() => resources.filter(r => r.type !== 'Website').length, [resources]);
  const favoriteResourceCount = useMemo(() => resources.filter(r => r.type !== 'Website' && r.favorite).length, [resources]);

  // Separate parent categories from subcategories (strictly for learning resources, excluding bookmarks)
  const parentCategories = useMemo(() => {
    return categories
      .filter(c => !c.parentId && isResourceCategory(c, categories, resources))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [categories, resources]);
  
  const subcategoriesMap = useMemo(() => {
    const map: Record<string, Category[]> = {};
    categories.forEach(c => {
      if (c.parentId && isResourceCategory(c, categories, resources)) {
        if (!map[c.parentId]) map[c.parentId] = [];
        map[c.parentId].push(c);
      }
    });
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
    return map;
  }, [categories, resources]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      reorderCategories(String(active.id), String(over.id), parentCategories.map(c => c.id));
    }
  };

  const openAddCategoryModal = () => {
    if (isSidebarCollapsed) toggleSidebar();
    setCategoryModalConfig({
      isOpen: true,
      editingCategory: null,
      parentId: null,
      categoryType: 'resource',
    });
  };

  const openAddSubcategoryModal = (parentId: string, parentName: string) => {
    if (isSidebarCollapsed) toggleSidebar();
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

        {/* Workspace selector & Collaboration */}
        {onOpenCollaborateModal && (
          <div className={cn("border-b border-slate-200 dark:border-slate-800/80", isSidebarCollapsed ? "p-2" : "px-3 py-2.5")}>
            <WorkspaceSelector 
              collapsed={isSidebarCollapsed} 
              onOpenCollaborateModal={onOpenCollaborateModal} 
            />
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-4 overflow-x-hidden space-y-6">
          
          {/* SECTION 1: Web Bookmarks (Independent Section) */}
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
                isSidebarCollapsed ? "justify-center" : "justify-between",
                activeView === 'bookmarks' 
                  ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800")}
              title={isSidebarCollapsed ? "Web Bookmarks" : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Globe size={18} className="shrink-0 text-indigo-500" /> 
                {!isSidebarCollapsed && <span className="truncate">All Bookmarks</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  activeView === 'bookmarks' 
                    ? "bg-indigo-200/80 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200" 
                    : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}>
                  {bookmarkCount}
                </span>
              )}
            </button>
          </div>

          {/* SECTION 2: Learning Resources (Includes All Resources, Favorites, Recents, and Nested Playlists & Categories) */}
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
                  isSidebarCollapsed ? "justify-center" : "justify-between",
                  activeView === 'home' 
                    ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800")}
                title={isSidebarCollapsed ? "All Resources" : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Layers size={18} className="shrink-0" /> 
                  {!isSidebarCollapsed && <span className="truncate">All Resources</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    activeView === 'home' 
                      ? "bg-indigo-200/80 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200" 
                      : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  )}>
                    {learningResourceCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => { setActiveView('favorites'); setIsMobileOpen(false); }}
                className={cn("w-full flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors", 
                  isSidebarCollapsed ? "justify-center" : "justify-between",
                  activeView === 'favorites' 
                    ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800")}
                title={isSidebarCollapsed ? "Favorites" : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Star size={18} className="shrink-0 text-amber-500" /> 
                  {!isSidebarCollapsed && <span className="truncate">Favorites</span>}
                </div>
                {!isSidebarCollapsed && favoriteResourceCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                    {favoriteResourceCount}
                  </span>
                )}
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

            {/* NESTED SUB-SECTION: Playlists & Categories under Resources */}
            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className={cn("px-1 mb-1.5 flex items-center", isSidebarCollapsed ? "justify-center" : "justify-between")}>
                {!isSidebarCollapsed && (
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Playlists & Categories
                  </span>
                )}
                <button 
                  onClick={openAddCategoryModal}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  title="Create New Category / Folder (with custom icon)"
                >
                  <Plus size={13} />
                </button>
              </div>

              <div className="space-y-0.5">
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
                      <SortableCategoryItem 
                        key={category.id}
                        category={category}
                        subcategories={subcategoriesMap[category.id] || []}
                        activeCategoryId={activeCategoryId}
                        activeSubcategoryId={activeSubcategoryId}
                        activeView={activeView}
                        setActiveCategory={setActiveCategory}
                        setIsMobileOpen={setIsMobileOpen}
                        onEditCategory={openEditCategoryModal}
                        deleteCategory={deleteCategory}
                        onAddSubcategory={openAddSubcategoryModal}
                        onReorderSubcategories={(activeId: string, overId: string, scopeIds: string[]) => {
                          reorderCategories(activeId, overId, scopeIds);
                        }}
                        isSidebarCollapsed={isSidebarCollapsed}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                
                {parentCategories.length === 0 && !isSidebarCollapsed && (
                  <div 
                    onClick={openAddCategoryModal}
                    className="px-3 py-2.5 text-xs text-center text-slate-400 hover:text-indigo-500 cursor-pointer border border-dashed border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-400 transition-all"
                  >
                    + Add first category
                  </div>
                )}
              </div>
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
          <AuthButton isSidebarCollapsed={isSidebarCollapsed} onOpenSecurityModal={onOpenSecurityModal} />
        </div>
      </aside>

      {/* Category & Sub-category Create/Edit Modal with Icon Link Upload/Entry */}
      <CategoryModal
        isOpen={categoryModalConfig.isOpen}
        onClose={() => setCategoryModalConfig({ isOpen: false, editingCategory: null, parentId: null })}
        editingCategory={categoryModalConfig.editingCategory}
        parentId={categoryModalConfig.parentId}
        parentName={categoryModalConfig.parentName}
        categoryType={categoryModalConfig.categoryType || 'resource'}
      />
    </>
  );
}

function AuthButton({ 
  isSidebarCollapsed, 
  onOpenSecurityModal 
}: { 
  isSidebarCollapsed: boolean; 
  onOpenSecurityModal?: () => void;
}) {
  const { user, isGuest, signOut, hasPasswordProvider } = useAuth();
  const { userName } = useStore();
  const effectiveName = user?.displayName?.trim() || (userName !== 'Guest' ? userName : null) || (user?.email ? user.email.split('@')[0] : (isGuest ? 'Guest' : 'User'));
  
  if (user || isGuest) {
    return (
      <div className="flex flex-col gap-1.5">
        {!isSidebarCollapsed && user && (
          <div className="px-2 py-1 flex items-center gap-2.5 rounded-lg bg-slate-100/60 dark:bg-slate-800/40">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={effectiveName} 
                className="w-6 h-6 rounded-full object-cover shrink-0" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                {effectiveName ? effectiveName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{effectiveName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email || 'Signed in'}</p>
            </div>
          </div>
        )}

        {/* Password & Security Button */}
        {user && onOpenSecurityModal && (
          <button 
            type="button"
            onClick={onOpenSecurityModal}
            className={cn(
              "flex items-center justify-between py-1.5 px-2.5 text-xs font-medium rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors",
              isSidebarCollapsed ? "w-full justify-center p-2" : "w-full"
            )}
            title={hasPasswordProvider ? "Password & Security" : "Add Password (Enable Email Login)"}
          >
            <div className="flex items-center gap-2 min-w-0">
              <KeyRound size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              {!isSidebarCollapsed && (
                <span className="truncate">{hasPasswordProvider ? "Password & Security" : "Add Password"}</span>
              )}
            </div>
            {!isSidebarCollapsed && !hasPasswordProvider && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 shrink-0">
                Email Login
              </span>
            )}
          </button>
        )}

        <button 
          onClick={signOut}
          className={cn(
            "flex items-center justify-center py-2 px-3 text-xs font-medium rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors",
            isSidebarCollapsed ? "w-full" : "w-full gap-2"
          )}
          title={isGuest ? "Exit Guest Mode" : "Sign Out"}
        >
          {isSidebarCollapsed ? (
            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-slate-200 dark:bg-slate-700">
              {user && user.photoURL ? (
                <img src={user.photoURL} alt={effectiveName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  {effectiveName ? effectiveName.charAt(0).toUpperCase() : 'G'}
                </span>
              )}
            </div>
          ) : null}
          {!isSidebarCollapsed && <span className="truncate">{isGuest ? "Exit Guest Mode" : "Sign Out"}</span>}
        </button>
      </div>
    );
  }
  
  return null;
}
