import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Resource } from '../types';
import { Globe, Pin, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { cn } from './Sidebar';

function BookmarkItem({ item, onEdit }: { item: Resource, onEdit: (r: Resource) => void }) {
  const { togglePinned, deleteResource } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const domain = useMemo(() => {
    try {
      return new URL(item.url).hostname;
    } catch (e) {
      return null;
    }
  }, [item.url]);

  const handleOpen = () => {
    useStore.getState().updateResource(item.id, { lastOpenedAt: Date.now() });
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col items-center gap-2 group relative">
      <div 
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center cursor-pointer hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-all overflow-hidden relative shadow-sm"
        onClick={handleOpen}
      >
        {domain ? (
          <img 
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`} 
            alt={domain}
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
              (e.target as HTMLElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <Globe size={32} className={cn("text-slate-400 dark:text-slate-500", domain ? "hidden" : "")} />
        
        {/* Overlay actions on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col sm:flex-row items-center justify-center gap-2 backdrop-blur-[2px]">
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
      
      <div className="w-full text-center px-1 mt-1" onClick={handleOpen}>
        <h4 className="font-medium text-sm text-slate-900 dark:text-white truncate cursor-pointer group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={item.title}>
          {item.title}
        </h4>
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

export function BookmarkView({ onEdit, onAdd }: { onEdit: (r: Resource) => void, onAdd?: () => void }) {
  const { resources, categories, searchQuery } = useStore();
  
  // Filter for web-like resources
  const bookmarkTypes = ['Website', 'Article', 'Bookmark', 'Documentation'];
  let bookmarks = resources.filter(r => bookmarkTypes.includes(r.type));

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    bookmarks = bookmarks.filter(r => 
      r.title.toLowerCase().includes(q) || 
      (r.description && r.description.toLowerCase().includes(q)) ||
      r.url.toLowerCase().includes(q)
    );
  }

  const pinned = bookmarks.filter(b => b.pinned);
  const unpinned = bookmarks.filter(b => !b.pinned);

  // Group unpinned by category
  const grouped = unpinned.reduce((acc, curr) => {
    const cat = categories.find(c => c.id === curr.categoryId)?.name || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {} as Record<string, Resource[]>);

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        <Globe size={48} className="mb-4 opacity-20" />
        <p>No web bookmarks found.</p>
        <p className="text-sm mt-1 opacity-70 mb-4">Add a website or article to see it here.</p>
        {onAdd && (
          <button 
            onClick={onAdd} 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-full shadow-sm shadow-indigo-600/20 transition-all active:scale-95"
          >
            Add Web Bookmark
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 pb-32">
      {pinned.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Pin size={18} className="text-indigo-500 fill-indigo-500" /> Pinned
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-y-8 gap-x-4">
            {pinned.map(b => <BookmarkItem key={b.id} item={b} onEdit={onEdit} />)}
          </div>
        </div>
      )}

      {Object.entries(grouped)
        .sort(([catA], [catB]) => catA.localeCompare(catB))
        .map(([category, items]) => (
        <div key={category}>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{category}</h2>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-y-8 gap-x-4">
            {items.map(b => <BookmarkItem key={b.id} item={b} onEdit={onEdit} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
