import { useStore } from '../store/useStore';
import { Resource } from '../types';
import { Play, FileText, Globe, ExternalLink, MoreHorizontal, Star, Trash2, Edit2, CheckCircle2, Circle, Tag, GripVertical } from 'lucide-react';
import { useState, type Key } from 'react';
import { cn } from './Sidebar';
import { getResourceImage } from '../utils/url-helpers';

export function ResourceCard({ 
  resource, 
  onEdit,
  dragHandleProps,
  isDragging
}: { 
  resource: Resource; 
  onEdit: (r: Resource) => void; 
  key?: Key;
  dragHandleProps?: Record<string, any>;
  isDragging?: boolean;
}) {
  const { toggleFavorite, deleteResource, toggleComplete, categories } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imageError, setImageError] = useState(false);

  const rawImage = !imageError ? getResourceImage(resource.type, resource.url, resource.coverImage) : '';
  const displayImage = rawImage && rawImage.trim().length > 0 ? rawImage.trim() : null;
  const isWebsite = resource.type === 'Website';

  const subcategory = resource.subcategoryId ? categories.find(c => c.id === resource.subcategoryId) : null;
  const category = categories.find(c => c.id === resource.categoryId);

  const getIcon = () => {
    switch (resource.type) {
      case 'Video':
        return <Play size={13} />;
      case 'Post':
        return <FileText size={13} />;
      case 'Website':
      default:
        return <Globe size={13} />;
    }
  };

  const handleOpen = () => {
    useStore.getState().updateResource(resource.id, { lastOpenedAt: Date.now() });
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={cn(
      "group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 relative h-full",
      isDragging ? "ring-2 ring-indigo-500 shadow-2xl scale-[1.02] opacity-75 z-30" : ""
    )}>
      
      {/* Visual / Image Area */}
      <div 
        className="w-full aspect-video bg-slate-100 dark:bg-slate-800 relative cursor-pointer overflow-hidden flex items-center justify-center"
        onClick={handleOpen}
      >
        {displayImage ? (
          <div className={cn("w-full h-full flex items-center justify-center", isWebsite ? "p-6 bg-slate-50 dark:bg-slate-950/60" : "")}>
            <img 
              src={displayImage} 
              alt={resource.title || 'Resource thumbnail'} 
              className={cn(
                "transition-transform duration-500 group-hover:scale-105",
                isWebsite ? "w-16 h-16 object-contain rounded-xl shadow-sm" : "w-full h-full object-cover"
              )}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="text-slate-400 dark:text-slate-600 scale-150 opacity-20">
            {getIcon()}
          </div>
        )}
        
        {/* Overlay Action */}
        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-sm backdrop-blur flex items-center justify-center text-slate-800 dark:text-slate-200 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
            <ExternalLink size={18} />
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
          {resource.completed && (
            <div className="bg-green-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 shadow-sm">
              <CheckCircle2 size={11} />
              Completed
            </div>
          )}
          {subcategory && (
            <div className="bg-slate-900/80 dark:bg-slate-800/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 shadow-sm">
              <Tag size={10} className="text-indigo-400" />
              <span className="truncate max-w-[120px]">{subcategory.name}</span>
            </div>
          )}
        </div>

        {/* Top Right Drag Handle */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-900/90 text-white/90 hover:text-white backdrop-blur-sm cursor-grab active:cursor-grabbing transition-all opacity-0 group-hover:opacity-100 shadow-md"
            title="Drag to reorder"
          >
            <GripVertical size={14} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn("p-4 flex-1 flex flex-col transition-opacity", resource.completed ? "opacity-60 group-hover:opacity-100" : "")}>
        <h3 
          className={cn("font-semibold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug cursor-pointer group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors", resource.completed ? "line-through" : "")}
          onClick={handleOpen}
        >
          {resource.title}
        </h3>
        
        {resource.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5">
            {resource.description}
          </p>
        )}
        
        <div className="mt-auto pt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex items-center gap-1">
              {getIcon()}
              <span>{resource.type}</span>
            </span>
            {category && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[90px]">
                • {category.name}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => toggleComplete(resource.id)}
              className={cn("p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors", resource.completed ? "text-green-500" : "text-slate-400")}
              title={resource.completed ? "Mark as not complete" : "Mark as complete"}
            >
              {resource.completed ? <CheckCircle2 size={14} className="fill-green-500/20" /> : <Circle size={14} />}
            </button>
            <button 
              onClick={() => toggleFavorite(resource.id)}
              className={cn("p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors", resource.favorite ? "text-amber-500" : "")}
              title={resource.favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star size={14} className={resource.favorite ? "fill-amber-500" : ""} />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <MoreHorizontal size={14} />
              </button>
              
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => { setShowMenu(false); setConfirmDelete(false); }} />
                  <div className="absolute right-0 bottom-full mb-2 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-none z-20 py-1 overflow-hidden">
                    <button 
                      onClick={() => { onEdit(resource); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    {confirmDelete ? (
                      <button 
                        onClick={() => { 
                          deleteResource(resource.id);
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
          </div>
        </div>
      </div>
    </div>
  );
}
