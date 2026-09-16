import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useStore } from '../store/useStore';
import { Resource } from '../types';
import { X, Loader2, Link as LinkIcon, AlertCircle, Sparkles, Globe, FolderTree, Plus } from 'lucide-react';
import { getFaviconUrl, getDuckDuckGoFaviconUrl, normalizeUrl } from '../utils/url-helpers';

interface AddBookmarkModalProps {
  onClose: () => void;
  editResource?: Resource;
  defaultCategoryId?: string;
  defaultSubcategoryId?: string;
}

export function AddBookmarkModal({ onClose, editResource, defaultCategoryId, defaultSubcategoryId }: AddBookmarkModalProps) {
  const { addResource, updateResource, categories, activeCategoryId, activeSubcategoryId, addCategory, addSubcategory } = useStore();
  
  const [url, setUrl] = useState(editResource?.url || '');
  const [title, setTitle] = useState(editResource?.title || '');
  
  // Parent categories (categories with no parentId)
  const parentCategories = useMemo(() => categories.filter(c => !c.parentId), [categories]);

  // Initial Category Setup
  const initialCategoryName = useMemo(() => {
    if (editResource?.categoryId) {
      return categories.find(c => c.id === editResource.categoryId)?.name || '';
    }
    if (defaultCategoryId) {
      return categories.find(c => c.id === defaultCategoryId)?.name || '';
    }
    if (activeCategoryId) {
      return categories.find(c => c.id === activeCategoryId)?.name || '';
    }
    return parentCategories.length > 0 ? parentCategories[0].name : 'Websites';
  }, [editResource, defaultCategoryId, activeCategoryId, categories, parentCategories]);

  // Initial Subcategory Setup
  const initialSubcategoryName = useMemo(() => {
    if (editResource?.subcategoryId) {
      return categories.find(c => c.id === editResource.subcategoryId)?.name || '';
    }
    if (defaultSubcategoryId) {
      return categories.find(c => c.id === defaultSubcategoryId)?.name || '';
    }
    if (activeSubcategoryId) {
      return categories.find(c => c.id === activeSubcategoryId)?.name || '';
    }
    return '';
  }, [editResource, defaultSubcategoryId, activeSubcategoryId, categories]);
      
  const [categoryInput, setCategoryInput] = useState(initialCategoryName);
  const [subcategoryInput, setSubcategoryInput] = useState(initialSubcategoryName);
  const [showSubcategoryField, setShowSubcategoryField] = useState(Boolean(initialSubcategoryName || editResource?.subcategoryId));
  
  const [faviconUrl, setFaviconUrl] = useState(editResource?.coverImage || '');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [error, setError] = useState('');

  // Selected parent category object
  const currentSelectedCategory = useMemo(() => {
    return parentCategories.find(c => c.name.toLowerCase() === categoryInput.trim().toLowerCase());
  }, [parentCategories, categoryInput]);

  // Subcategories belonging to the currently typed/selected category
  const availableSubcategories = useMemo(() => {
    if (!currentSelectedCategory) return [];
    return categories.filter(c => c.parentId === currentSelectedCategory.id);
  }, [categories, currentSelectedCategory]);

  // Auto-fetch favicon and website title when URL changes
  useEffect(() => {
    if (editResource) return;
    const cleanUrl = normalizeUrl(url);
    if (!cleanUrl) return;

    // Instant local favicon generation
    const autoFav = getFaviconUrl(cleanUrl, 128);
    if (autoFav && !faviconUrl) {
      setFaviconUrl(autoFav);
    }

    const debounceTimeout = setTimeout(async () => {
      try {
        setIsLoadingMetadata(true);
        setError('');
        const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;
        
        const res = await fetch(`${APP_URL}/api/metadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: cleanUrl })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.title && data.title !== 'Website') {
            setTitle(data.title);
          }
          if (!faviconUrl) {
            setFaviconUrl(getFaviconUrl(cleanUrl, 128));
          }
        }
      } catch (err) {
        console.error("Failed to fetch metadata", err);
        if (!faviconUrl) {
          setFaviconUrl(getFaviconUrl(cleanUrl, 128));
        }
      } finally {
        setIsLoadingMetadata(false);
      }
    }, 600);

    return () => clearTimeout(debounceTimeout);
  }, [url, editResource]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanUrl = normalizeUrl(url);
    if (!cleanUrl || !title || !categoryInput.trim()) {
      setError('Please fill in all required fields with a valid URL');
      return;
    }

    // 1. Resolve or Create Parent Category
    let finalCategoryId = '';
    const cleanCatName = categoryInput.trim();
    const existingCat = parentCategories.find(c => c.name.toLowerCase() === cleanCatName.toLowerCase());
    
    if (existingCat) {
      finalCategoryId = existingCat.id;
    } else {
      finalCategoryId = addCategory(cleanCatName);
    }

    // 2. Resolve or Create Subcategory (if provided)
    let finalSubcategoryId: string | undefined = undefined;
    const cleanSubcatName = subcategoryInput.trim();
    
    if (cleanSubcatName) {
      const existingSub = categories.find(
        c => c.parentId === finalCategoryId && c.name.toLowerCase() === cleanSubcatName.toLowerCase()
      );
      if (existingSub) {
        finalSubcategoryId = existingSub.id;
      } else {
        finalSubcategoryId = addSubcategory(finalCategoryId, cleanSubcatName);
      }
    }

    // Assign high-resolution favicon
    const finalFavicon = faviconUrl.trim() || getFaviconUrl(cleanUrl, 128);

    if (editResource) {
      updateResource(editResource.id, { 
        url: cleanUrl, 
        title: title.trim(), 
        type: 'Website', 
        categoryId: finalCategoryId,
        subcategoryId: finalSubcategoryId || null,
        coverImage: finalFavicon 
      });
    } else {
      addResource({ 
        url: cleanUrl, 
        title: title.trim(), 
        type: 'Website', 
        categoryId: finalCategoryId,
        subcategoryId: finalSubcategoryId || null,
        coverImage: finalFavicon, 
        favorite: false 
      });
    }
    onClose();
  };

  const previewIcon = faviconUrl || (url ? getFaviconUrl(url, 128) : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full border border-slate-200/80 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Globe size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {editResource ? 'Edit Bookmark' : 'Add Web Bookmark'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-xl flex items-center gap-2">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <form id="bookmark-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                Website URL <span className="text-red-500">*</span>
                {isLoadingMetadata && (
                  <span className="text-[11px] text-indigo-500 font-normal flex items-center gap-1">
                    <Loader2 size={11} className="animate-spin" /> Fetching favicon & title...
                  </span>
                )}
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="e.g. milanote.com or https://milanote.com"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  required
                  autoFocus={!editResource}
                />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Title / Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Milanote, Figma, GitHub"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                required
              />
            </div>

            {/* Main Category */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Category <span className="text-red-500">*</span>
                </label>
                {!showSubcategoryField && (
                  <button
                    type="button"
                    onClick={() => setShowSubcategoryField(true)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus size={12} /> Add Sub-category
                  </button>
                )}
              </div>
              <input
                type="text"
                list="bookmark-parent-categories-datalist"
                placeholder="e.g. Design, Development, Daily, Tools"
                value={categoryInput}
                onChange={e => setCategoryInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                required
              />
              <datalist id="bookmark-parent-categories-datalist">
                {parentCategories.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>

            {/* Sub-Category Option */}
            {showSubcategoryField && (
              <div className="space-y-1.5 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderTree size={13} className="text-indigo-500" />
                    Sub-Category <span className="text-[10px] font-normal text-slate-400 lowercase">(optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSubcategoryInput('');
                      setShowSubcategoryField(false);
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  list="bookmark-subcategories-datalist"
                  placeholder={categoryInput ? `e.g. Under ${categoryInput}: Icons, Inspiration, UI Kits` : "e.g. Icons, UI Kits, Docs"}
                  value={subcategoryInput}
                  onChange={e => setSubcategoryInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-800/80 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
                />
                <datalist id="bookmark-subcategories-datalist">
                  {availableSubcategories.map(s => <option key={s.id} value={s.name} />)}
                </datalist>
                <p className="text-[11px] text-indigo-600/70 dark:text-indigo-400/70">
                  Select an existing sub-category or type a new one to create it automatically.
                </p>
              </div>
            )}

            {/* Auto Favicon Preview */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Favicon Preview
                </label>
                {url && (
                  <button 
                    type="button" 
                    onClick={() => {
                      const cleanUrl = normalizeUrl(url);
                      if (cleanUrl) setFaviconUrl(getFaviconUrl(cleanUrl, 128));
                    }} 
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles size={11} /> Re-fetch icon
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-1.5 shrink-0 shadow-sm">
                  {previewIcon ? (
                    <img 
                      src={previewIcon} 
                      alt="Favicon preview" 
                      className="w-7 h-7 object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const ddg = getDuckDuckGoFaviconUrl(url);
                        if (ddg && (e.target as HTMLImageElement).src !== ddg) {
                          (e.target as HTMLImageElement).src = ddg;
                        }
                      }}
                    />
                  ) : (
                    <Globe size={22} className="text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                    {title || 'Favicon Preview'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    Auto-fetched 128px high-res favicon
                  </p>
                </div>
              </div>
            </div>

          </form>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="bookmark-form"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Globe size={14} />
            <span>{editResource ? 'Save Bookmark' : 'Add Bookmark'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
