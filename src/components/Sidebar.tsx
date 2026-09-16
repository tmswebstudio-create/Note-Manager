import { useState, type FormEvent } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth-context';
import { Folder, Star, Clock, Home, Plus, Moon, Sun, Trash2, Edit2, GripVertical, PanelLeftClose, PanelLeftOpen, Globe } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function SortableCategoryItem({ 
  category, 
  activeCategoryId, 
  activeView, 
  setActiveCategory, 
  setIsMobileOpen, 
  setEditingId, 
  setEditName, 
  deleteCategory,
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative flex items-center">
      {!isSidebarCollapsed && (
        <div 
          {...attributes} 
          {...listeners}
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 p-1 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing hover:text-slate-500 dark:hover:text-slate-400 transition-opacity"
        >
          <GripVertical size={14} />
        </div>
      )}
      
      <button 
        onClick={() => { setActiveCategory(category.id); setIsMobileOpen(false); setConfirmDeleteId(null); }}
        className={cn(
          "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
          isSidebarCollapsed ? "justify-center" : "gap-3",
          activeCategoryId === category.id && activeView === 'category'
            ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300" 
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        )}
        title={isSidebarCollapsed ? category.name : undefined}
      >
        <Folder size={16} className={cn("opacity-70 flex-shrink-0", activeCategoryId === category.id && activeView === 'category' ? "opacity-100" : "")} />
        
        {!isSidebarCollapsed && (
          <>
            <span className="truncate">{category.name}</span>
            <div className="ml-auto hidden group-hover:flex items-center gap-1">
              {confirmDeleteId === category.id ? (
                <div className="flex items-center gap-1">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCategory(category.id);
                    }}
                    className="p-1 hover:bg-red-200 dark:hover:bg-red-900/50 rounded text-red-500 font-bold text-xs"
                    title="Confirm Delete"
                  >
                    Confirm
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
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(category.id);
                      setEditName(category.name);
                    }}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400"
                  >
                    <Edit2 size={12} />
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(category.id);
                    }}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-red-400"
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
  );
}

export function Sidebar({ isMobileOpen, setIsMobileOpen }: { isMobileOpen: boolean, setIsMobileOpen: (v: boolean) => void }) {
  const { categories, activeCategoryId, activeView, setActiveCategory, setActiveView, addCategory, theme, toggleTheme, deleteCategory, updateCategory, reorderCategories, isSidebarCollapsed, toggleSidebar } = useStore();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
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

  const handleAddCategory = (e: FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      addCategory(newCategoryName.trim());
      setNewCategoryName('');
      setIsAddingCategory(false);
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
      const oldIndex = categories.findIndex((cat) => cat.id === active.id);
      const newIndex = categories.findIndex((cat) => cat.id === over.id);
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
        <div className={cn(
          "p-4 flex items-center font-semibold text-lg text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 h-16",
          isSidebarCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
                <Folder size={18} />
              </div>
              <span className="truncate">Note Manager</span>
            </div>
          )}
          
          <button 
            onClick={toggleSidebar}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
          <div className="px-3 space-y-1 mb-8">
            <button 
              onClick={() => { setActiveView('bookmarks'); setIsMobileOpen(false); }}
              className={cn("w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors", 
                isSidebarCollapsed ? "justify-center" : "gap-3",
                activeView === 'bookmarks' ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800")}
              title={isSidebarCollapsed ? "Web Bookmarks" : undefined}
            >
              <Globe size={18} className="shrink-0" /> 
              {!isSidebarCollapsed && <span className="truncate">Web Bookmarks</span>}
            </button>
            <button 
              onClick={() => { setActiveView('home'); setIsMobileOpen(false); }}
              className={cn("w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors", 
                isSidebarCollapsed ? "justify-center" : "gap-3",
                activeView === 'home' ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800")}
              title={isSidebarCollapsed ? "All Resources" : undefined}
            >
              <Home size={18} className="shrink-0" /> 
              {!isSidebarCollapsed && <span className="truncate">All Resources</span>}
            </button>
            <button 
              onClick={() => { setActiveView('favorites'); setIsMobileOpen(false); }}
              className={cn("w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors", 
                isSidebarCollapsed ? "justify-center" : "gap-3",
                activeView === 'favorites' ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800")}
              title={isSidebarCollapsed ? "Favorites" : undefined}
            >
              <Star size={18} className="shrink-0" /> 
              {!isSidebarCollapsed && <span className="truncate">Favorites</span>}
            </button>
            <button 
              onClick={() => { setActiveView('recent'); setIsMobileOpen(false); }}
              className={cn("w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors", 
                isSidebarCollapsed ? "justify-center" : "gap-3",
                activeView === 'recent' ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800")}
              title={isSidebarCollapsed ? "Recently Opened" : undefined}
            >
              <Clock size={18} className="shrink-0" /> 
              {!isSidebarCollapsed && <span className="truncate">Recently Opened</span>}
            </button>
          </div>

          <div className={cn("px-3 mb-2 flex items-center", isSidebarCollapsed ? "justify-center" : "justify-between")}>
            {!isSidebarCollapsed && (
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Playlists</h3>
            )}
            <button 
              onClick={() => {
                if (isSidebarCollapsed) toggleSidebar();
                setIsAddingCategory(true);
              }}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400"
              title="Add Playlist"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="px-3 space-y-1">
            {isAddingCategory && !isSidebarCollapsed && (
              <form onSubmit={handleAddCategory} className="mb-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onBlur={() => setIsAddingCategory(false)}
                  className="w-full px-3 py-1.5 text-sm rounded-md border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </form>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categories.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {categories.map(category => (
                  <div key={category.id} className="mb-0.5">
                    {editingId === category.id && !isSidebarCollapsed ? (
                      <form onSubmit={handleEditCategory} className="mb-1">
                        <input
                          type="text"
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => setEditingId(null)}
                          className="w-full px-3 py-1.5 text-sm rounded-md border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </form>
                    ) : (
                      <SortableCategoryItem 
                        category={category}
                        activeCategoryId={activeCategoryId}
                        activeView={activeView}
                        setActiveCategory={setActiveCategory}
                        setIsMobileOpen={setIsMobileOpen}
                        setEditingId={setEditingId}
                        setEditName={setEditName}
                        deleteCategory={deleteCategory}
                        isSidebarCollapsed={isSidebarCollapsed}
                      />
                    )}
                  </div>
                ))}
              </SortableContext>
            </DndContext>
            
            {categories.length === 0 && !isAddingCategory && !isSidebarCollapsed && (
              <div className="px-3 py-4 text-xs text-center text-slate-500 dark:text-slate-400">
                No categories yet
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
          <button 
            onClick={toggleTheme}
            className={cn(
              "flex items-center justify-center py-2 px-3 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
              isSidebarCollapsed ? "w-full" : "w-full gap-2"
            )}
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? <Moon size={16} className="shrink-0" /> : <Sun size={16} className="shrink-0" />}
            {!isSidebarCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>
          <AuthButton isSidebarCollapsed={isSidebarCollapsed} />
        </div>
      </aside>
    </>
  );
}

function AuthButton({ isSidebarCollapsed }: { isSidebarCollapsed: boolean }) {
  const { user, isGuest, signIn, signOut } = useAuth();
  
  if (user || isGuest) {
    return (
      <button 
        onClick={signOut}
        className={cn(
          "flex items-center justify-center py-2 px-3 text-sm font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors",
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
  
  return (
    <button 
      onClick={signIn}
      className={cn(
        "flex items-center justify-center py-2 px-3 text-sm font-medium rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors",
        isSidebarCollapsed ? "w-full" : "w-full gap-2"
      )}
      title="Sign In"
    >
      <div className="w-5 h-5 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-xs shrink-0">
        U
      </div>
      {!isSidebarCollapsed && <span>Sign In</span>}
    </button>
  );
}
