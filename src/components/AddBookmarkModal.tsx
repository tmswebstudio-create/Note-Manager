import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useStore } from '../store/useStore';
import { Resource } from '../types';
import { 
  X, Loader2, Link as LinkIcon, AlertCircle, Sparkles, 
  Globe, FolderTree, Plus, CheckCircle2, RefreshCw 
} from 'lucide-react';
import { getFaviconUrl, getDuckDuckGoFaviconUrl, normalizeUrl, fetchUrlMetadata } from '../utils/url-helpers';
import { isBookmarkCategory } from '../utils/category-helpers';

interface AddBookmarkModalProps {
  onClose: () => void;
  editResource?: Resource;
  defaultCategoryId?: string;
  defaultSubcategoryId?: string;
}

export function AddBookmarkModal({ onClose, editResource, defaultCategoryId, defaultSubcategoryId }: AddBookmarkModalProps) {
  const { resources, addResource, updateResource, categories, activeCategoryId, activeSubcategoryId, addCategory, addSubcategory } = useStore();
  
  const [url, setUrl] = useState(editResource?.url || '');
  const [title, setTitle] = useState(editResource?.title || '');
  
  // Parent categories (strictly bookmark categories)
  const parentCategories = useMemo(() => {
    return categories.filter(c => !c.parentId && isBookmarkCategory(c, categories, resources));
  }, [categories, resources]);

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
  const [fetchedStatus, setFetchedStatus] = useState<string | null>(null);
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

  const handleFetchMetadata = async (targetUrl?: string) => {
    const rawToFetch = targetUrl || url;
    const cleanUrl = normalizeUrl(rawToFetch);
    if (!cleanUrl) {
      setError('Please enter a valid URL first');
      return;
    }

    setIsLoadingMetadata(true);
    setError('');
    setFetchedStatus(null);

    try {
      const autoFav = getFaviconUrl(cleanUrl, 128);
      if (autoFav && !faviconUrl) {
        setFaviconUrl(autoFav);
      }

      const meta = await fetchUrlMetadata(cleanUrl);
      if (meta.title && meta.title !== 'Website') {
        setTitle(meta.title);
        setFetchedStatus('Title fetched!');
      } else {
        try {
          const host = new URL(cleanUrl).hostname.replace(/^www\./, '');
          if (!title) setTitle(host);
        } catch {
          // ignore
        }
      }

      if (!faviconUrl) {
        setFaviconUrl(getFaviconUrl(cleanUrl, 128));
      }
    } catch (err: any) {
      console.warn('Metadata fetch error:', err?.message);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // Auto-fetch favicon and website title when URL changes
  useEffect(() => {
    if (editResource) return;
    const cleanUrl = normalizeUrl(url);
    if (!cleanUrl) {
      setFetchedStatus(null);
      return;
    }

    // Instant local favicon generation
    const autoFav = getFaviconUrl(cleanUrl, 128);
    if (autoFav && !faviconUrl) {
      setFaviconUrl(autoFav);
    }

    const debounceTimeout = setTimeout(() => {
      handleFetchMetadata(cleanUrl);
    }, 700);

    return () => clearTimeout(debounceTimeout);
  }, [url]);

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
      finalCategoryId = addCategory(cleanCatName, null, undefined, 'bookmark');
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
        finalSubcategoryId = addSubcategory(finalCategoryId, cleanSubcatName, undefined, 'bookmark');
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
            
            {/* URL with Instant Fetch Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  Website URL <span className="text-red-500">*</span>
                </label>
                {fetchedStatus ? (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 size={12} /> {fetchedStatus}
                  </span>
                ) : isLoadingMetadata ? (
                  <span className="text-[11px] text-indigo-500 font-medium flex items-center gap-1 animate-in fade-in">
                    <Loader2 size={11} className="animate-spin" /> Fetching title...
                  </span>
                ) : null}
              </div>

              <div className="relative flex items-center">
                <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                <input
                  type="text"
                  placeholder="e.g. figma.com, github.com, or blog link"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full pl-9 pr-24 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white transition-all"
                  required
                  autoFocus={!editResource}
                />
                <button
                  type="button"
                  onClick={() => handleFetchMetadata()}
                  disabled={isLoadingMetadata || !url.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 transition-all flex items-center gap-1.5 disabled:opacity-40"
                  title="Fetch website title & favicon"
                >
                  {isLoadingMetadata ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  <span>Fetch</span>
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Title / Name <span className="text-red-500">*</span>
                </label>
                {title && url && (
                  <button
                    type="button"
                    onClick={() => handleFetchMetadata()}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw size={11} /> Re-fetch title
                  </button>
                )}
              </div>
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
                  placeholder="e.g. Prototyping, UI Kits, Tutorials"
                  value={subcategoryInput}
                  onChange={e => setSubcategoryInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/60 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
                <datalist id="bookmark-subcategories-datalist">
                  {availableSubcategories.map(s => <option key={s.id} value={s.name} />)}
                </datalist>
              </div>
            )}

            {/* Favicon / Icon URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                Custom Favicon / Icon URL <span className="text-[11px] font-normal text-slate-400 lowercase">(optional)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="https://... or leave blank for auto favicon"
                  value={faviconUrl}
                  onChange={e => setFaviconUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
                {previewIcon && (
                  <div className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800">
                    <img 
                      src={previewIcon} 
                      alt="Favicon preview" 
                      className="w-5 h-5 object-contain"
                      referrerPolicy="no-referrer"
                      onError={e => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="bookmark-form"
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span>{editResource ? 'Save Changes' : 'Add Bookmark'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
