import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ResourceGrid } from './ResourceGrid';
import { BookmarkView } from './BookmarkView';
import { AddResourceModal } from './AddResourceModal';
import { Resource } from '../types';
import { cn } from './Sidebar';

export function AppShell() {
  const { theme, activeView } = useStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | undefined>(undefined);

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
    setIsAddModalOpen(true);
  };

  const handleAdd = () => {
    setEditingResource(undefined);
    setIsAddModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
      
      {/* Sidebar */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      {/* Main Content */}
      <main className={cn("flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300", useStore((s) => s.isSidebarCollapsed) ? "lg:pl-20" : "lg:pl-64")}>
        <Topbar 
          onMenuClick={() => setIsMobileOpen(true)} 
          onAddClick={handleAdd}
        />
        
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {activeView === 'bookmarks' ? (
            <BookmarkView onEdit={handleEdit} onAdd={handleAdd} />
          ) : (
            <ResourceGrid onEdit={handleEdit} />
          )}
        </div>
      </main>
      
      {/* Modals */}
      {isAddModalOpen && (
        <AddResourceModal 
          onClose={() => setIsAddModalOpen(false)} 
          editResource={editingResource}
          defaultType={activeView === 'bookmarks' ? 'Bookmark' : 'Website'}
        />
      )}
    </div>
  );
}
