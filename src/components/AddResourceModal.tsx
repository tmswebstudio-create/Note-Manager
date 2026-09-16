import { useState, useEffect, type FormEvent } from 'react';
import { useStore } from '../store/useStore';
import { Resource, ResourceType } from '../types';
import { X, Loader2, Image as ImageIcon, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { cn } from './Sidebar';

interface AddResourceModalProps {
  onClose: () => void;
  editResource?: Resource;
  defaultType?: string;
}

const RESOURCE_TYPES: ResourceType[] = [
  'YouTube Video', 'YouTube Playlist', 'Course', 'Website', 
  'Article', 'Documentation', 'PDF', 'Image', 'Bookmark', 'Other'
];

export function AddResourceModal({ onClose, editResource, defaultType }: AddResourceModalProps) {
  const { addResource, updateResource, categories, activeCategoryId, addCategory } = useStore();
  
  const [url, setUrl] = useState(editResource?.url || '');
  const [title, setTitle] = useState(editResource?.title || '');
  const [type, setType] = useState<string>(editResource?.type || defaultType || 'Website');
  
  // Initialize categoryInput with the name of the category if editing or if activeCategoryId is set
  const initialCategoryName = editResource?.categoryId 
    ? categories.find(c => c.id === editResource.categoryId)?.name || ''
    : activeCategoryId 
      ? categories.find(c => c.id === activeCategoryId)?.name || ''
      : (categories.length > 0 ? categories[0].name : '');
      
  const [categoryInput, setCategoryInput] = useState(initialCategoryName);
  const [coverImage, setCoverImage] = useState(editResource?.coverImage || '');
  const [description, setDescription] = useState(editResource?.description || '');
  
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [error, setError] = useState('');

  // Auto-detect when URL changes if not editing
  useEffect(() => {
    if (editResource || !url) return;
    
    const fetchMetadata = async () => {
      // Basic local detection first
      if (url.includes('youtube.com/watch') || url.includes('youtu.be')) setType('YouTube Video');
      else if (url.includes('youtube.com/playlist')) setType('YouTube Playlist');
      
      const debounceTimeout = setTimeout(async () => {
        try {
          setIsLoadingMetadata(true);
          setError('');
          const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;
          
          const res = await fetch(`${APP_URL}/api/metadata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.title && data.title !== 'Website') setTitle(data.title);
            if (data.description) setDescription(data.description);
            if (data.coverImage) setCoverImage(data.coverImage);
            if (data.type) setType(data.type);
          }
        } catch (err) {
          console.error("Failed to fetch metadata", err);
        } finally {
          setIsLoadingMetadata(false);
        }
      }, 1000); // 1s debounce

      return () => clearTimeout(debounceTimeout);
    };

    fetchMetadata();
  }, [url, editResource]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!url || !title || !categoryInput) {
      setError('Please fill in all required fields');
      return;
    }
    
    // basic url validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    let finalCategoryId = '';
    const existingCat = categories.find(c => c.name.toLowerCase() === categoryInput.toLowerCase());
    
    if (existingCat) {
      finalCategoryId = existingCat.id;
    } else {
      finalCategoryId = addCategory(categoryInput.trim());
    }

    if (editResource) {
      updateResource(editResource.id, { url, title, type: type as ResourceType, categoryId: finalCategoryId, coverImage, description });
    } else {
      addResource({ url, title, type: type as ResourceType, categoryId: finalCategoryId, coverImage, description, favorite: false });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {editResource ? 'Edit Resource' : defaultType === 'Bookmark' ? 'Add Web Bookmark' : 'Add New Resource'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form id="resource-form" onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                Resource URL <span className="text-red-500">*</span>
                {isLoadingMetadata && <span className="text-xs text-indigo-500 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Fetching details...</span>}
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Course or video title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                <input
                  type="text"
                  list="resource-types-list"
                  placeholder="e.g. Article, Video"
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
                <datalist id="resource-types-list">
                  {RESOURCE_TYPES.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Playlist / Category <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  list="categories-datalist"
                  placeholder="e.g. Programming"
                  value={categoryInput}
                  onChange={e => setCategoryInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  required
                />
                <datalist id="categories-datalist">
                  {categories.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex justify-between">
                Cover Image URL
                {coverImage && (
                  <button type="button" onClick={() => setCoverImage('')} className="text-xs text-red-500 hover:underline">Clear</button>
                )}
              </label>
              
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="url"
                    placeholder="https://.../image.jpg"
                    value={coverImage}
                    onChange={e => setCoverImage(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              
              {coverImage && (
                <div className="mt-2 w-full aspect-video rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description (Optional)</label>
              <textarea
                rows={3}
                placeholder="Add some notes or description..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none"
              />
            </div>
          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="resource-form"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-full shadow-sm shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2"
          >
            {editResource ? 'Save Changes' : 'Add Resource'}
          </button>
        </div>
      </div>
    </div>
  );
}
