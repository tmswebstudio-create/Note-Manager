import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ResourceGrid } from './ResourceGrid';
import { BookmarkView } from './BookmarkView';
import { AddBookmarkModal } from './AddBookmarkModal';
import { AddResourceModal } from './AddResourceModal';
import { Resource } from '../types';
import { cn } from './Sidebar';

export function AppShell() {
  const { theme, activeView } = useStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Modals state
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | undefined>(undefined);
  const [modalCategoryDefaults, setModalCategoryDefaults] = useState<{ categoryId?: string; subcategoryId?: string }>({});

  // Apply theme class to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setModalCategoryDefaults({});
    if (resource.type === 'Website') {
      setIsBookmarkModalOpen(true);
    } else {
      setIsResourceModalOpen(true);
    }
  };

  const handleAddBookmark = (defaultCategoryId?: string, defaultSubcategoryId?: string) => {
    setEditingResource(undefined);
    setModalCategoryDefaults({ categoryId: defaultCategoryId, subcategoryId: defaultSubcategoryId });
    setIsBookmarkModalOpen(true);
  };

  const handleAddResource = (defaultCategoryId?: string, defaultSubcategoryId?: string) => {
    setEditingResource(undefined);
    setModalCategoryDefaults({ categoryId: defaultCategoryId, subcategoryId: defaultSubcategoryId });
    setIsResourceModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
      
      {/* Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen}
        onAddBookmark={() => handleAddBookmark()}
        onAddResource={() => handleAddResource()}
      />
      
      {/* Main Content */}
      <main className={cn("flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300", useStore((s) => s.isSidebarCollapsed) ? "lg:pl-20" : "lg:pl-64")}>
        <Topbar 
          onMenuClick={() => setIsMobileOpen(true)} 
          onAddBookmark={() => handleAddBookmark()}
          onAddResource={() => handleAddResource()}
        />
        
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {activeView === 'bookmarks' ? (
            <BookmarkView 
              onEdit={handleEdit} 
              onAdd={handleAddBookmark} 
            />
          ) : (
            <ResourceGrid 
              onEdit={handleEdit} 
              onAddResource={handleAddResource}
            />
          )}
        </div>
      </main>
      
      {/* Dedicated Add / Edit Bookmark Modal (Fetches Favicon) */}
      {isBookmarkModalOpen && (
        <AddBookmarkModal 
          onClose={() => {
            setIsBookmarkModalOpen(false);
            setEditingResource(undefined);
            setModalCategoryDefaults({});
          }} 
          editResource={editingResource}
          defaultCategoryId={modalCategoryDefaults.categoryId}
          defaultSubcategoryId={modalCategoryDefaults.subcategoryId}
        />
      )}

      {/* Dedicated Add / Edit Resource Modal (Fetches Thumbnail) */}
      {isResourceModalOpen && (
        <AddResourceModal 
          onClose={() => {
            setIsResourceModalOpen(false);
            setEditingResource(undefined);
            setModalCategoryDefaults({});
          }} 
          editResource={editingResource}
          defaultCategoryId={modalCategoryDefaults.categoryId}
          defaultSubcategoryId={modalCategoryDefaults.subcategoryId}
        />
      )}
    </div>
  );
}
