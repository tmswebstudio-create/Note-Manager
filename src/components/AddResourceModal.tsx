import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useStore } from '../store/useStore';
import { Resource } from '../types';
import { 
  X, Loader2, Image as ImageIcon, Link as LinkIcon, AlertCircle, 
  Sparkles, Play, FileText, Layers, FolderTree, Plus, CheckCircle2, RefreshCw
} from 'lucide-react';
import { cn } from './Sidebar';
import { getAutoThumbnail, normalizeUrl, fetchUrlMetadata, MetadataResult } from '../utils/url-helpers';

interface AddResourceModalProps {
  onClose: () => void;
  editResource?: Resource;
  defaultCategoryId?: string;
  defaultSubcategoryId?: string;
}

const RESOURCE_TYPES: { type: 'Video' | 'Post'; label: string; icon: any; hint: string }[] = [
  { type: 'Video', label: 'Video', icon: Play, hint: 'YouTube, Vimeo, Courses' },
  { type: 'Post', label: 'Post / Article', icon: FileText, hint: 'Medium, Dev.to, Blogs, Docs, Tweets' },
];

export function AddResourceModal({ onClose, editResource, defaultCategoryId, defaultSubcategoryId }: AddResourceModalProps) {
  const { addResource, updateResource, categories, activeCategoryId, activeSubcategoryId, addCategory, addSubcategory } = useStore();
  
  const [url, setUrl] = useState(editResource?.url || '');
  const [title, setTitle] = useState(editResource?.title || '');
  const [type, setType] = useState<'Video' | 'Post'>((editResource?.type === 'Post' ? 'Post' : 'Video'));
  
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
    return parentCategories.length > 0 ? parentCategories[0].name : 'Resources';
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

  const [coverImage, setCoverImage] = useState(editResource?.coverImage || '');
  const [description, setDescription] = useState(editResource?.description || '');
  
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

  // Manual & automated fetch metadata function
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
      const isVideoUrl = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be') || cleanUrl.includes('vimeo.com');
      if (isVideoUrl) {
        setType('Video');
      }

      // Quick local thumbnail fallback
      const localThumb = getAutoThumbnail(cleanUrl);
      if (localThumb && !coverImage) {
        setCoverImage(localThumb);
      }

      const meta: MetadataResult = await fetchUrlMetadata(cleanUrl);

      if (meta.title && meta.title !== 'Video' && meta.title !== 'Website') {
        setTitle(meta.title);
      }
      if (meta.description && !description) {
        setDescription(meta.description);
      }
      if (meta.coverImage) {
        setCoverImage(meta.coverImage);
      } else if (localThumb) {
        setCoverImage(localThumb);
      }
      if (meta.type && (meta.type === 'Video' || meta.type === 'Post')) {
        setType(meta.type);
      }

      const sourceLabel = isVideoUrl 
        ? 'YouTube video title fetched!' 
        : (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com') 
          ? 'Post fetched from X!' 
          : 'Title fetched successfully!');
      
      setFetchedStatus(sourceLabel);
    } catch (err: any) {
      console.warn('Metadata fetch issue:', err?.message);
      const fallback = getAutoThumbnail(cleanUrl);
      if (fallback && !coverImage) setCoverImage(fallback);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // Auto-fetch on URL change (with debounce)
  useEffect(() => {
    if (editResource) return;
    const cleanUrl = normalizeUrl(url);
    if (!cleanUrl) {
      setFetchedStatus(null);
      return;
    }

    // Auto-detect video type immediately
    const isVideo = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be') || cleanUrl.includes('vimeo.com');
    if (isVideo) {
      setType('Video');
    }

    const instantThumb = getAutoThumbnail(cleanUrl);
    if (instantThumb && !coverImage) {
      setCoverImage(instantThumb);
    }

    const timeout = setTimeout(() => {
      handleFetchMetadata(cleanUrl);
    }, 700);

    return () => clearTimeout(timeout);
  }, [url]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanUrl = normalizeUrl(url);
    if (!cleanUrl || !title.trim() || !categoryInput.trim()) {
      setError('Please fill in all required fields with a valid URL and title');
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

    // Automatically fetch thumbnail if blank
    const finalCoverImage = coverImage.trim() || getAutoThumbnail(cleanUrl);

    if (editResource) {
      updateResource(editResource.id, { 
        url: cleanUrl, 
        title: title.trim(), 
        type, 
        categoryId: finalCategoryId,
        subcategoryId: finalSubcategoryId || null,
        coverImage: finalCoverImage, 
        description: description.trim() 
      });
    } else {
      addResource({ 
        url: cleanUrl, 
        title: title.trim(), 
        type, 
        categoryId: finalCategoryId,
        subcategoryId: finalSubcategoryId || null,
        coverImage: finalCoverImage, 
        description: description.trim(), 
        favorite: false 
      });
    }
    onClose();
  };

  const previewCover = coverImage || (url ? getAutoThumbnail(url) : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200/80 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {editResource ? 'Edit Resource' : 'Add Learning Resource'}
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
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-xl flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" /> {error}
            </div>
          )}

          <form id="resource-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* URL with Instant Fetch Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  Resource URL <span className="text-red-500">*</span>
                </label>
                {fetchedStatus ? (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 size={12} /> {fetchedStatus}
                  </span>
                ) : isLoadingMetadata ? (
                  <span className="text-[11px] text-indigo-500 font-medium flex items-center gap-1 animate-in fade-in">
                    <Loader2 size={11} className="animate-spin" /> Fetching title & cover...
                  </span>
                ) : null}
              </div>

              <div className="relative flex items-center">
                <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                <input
                  type="text"
                  placeholder="Paste YouTube, Medium, Blog, or Tweet link..."
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
                  title="Fetch title, thumbnail, and details"
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

            {/* Type Selector (Video | Post) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {RESOURCE_TYPES.map(({ type: t, label, icon: Icon, hint }) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer",
                      type === t
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg", type === t ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300")}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">{label}</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{hint}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title with auto-fill & re-sync */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Title <span className="text-red-500">*</span>
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
                placeholder={type === 'Video' ? 'e.g. Complete React & TypeScript Masterclass' : 'e.g. Advanced State Management Guide'}
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                required
              />
            </div>

            {/* Playlist / Category */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Playlist / Category <span className="text-red-500">*</span>
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
                list="resource-parent-categories-datalist"
                placeholder="e.g. Frontend Masterclass, Backend, AI Research"
                value={categoryInput}
                onChange={e => setCategoryInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                required
              />
              <datalist id="resource-parent-categories-datalist">
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
                  list="resource-subcategories-datalist"
                  placeholder="e.g. Hooks, Components, Animations"
                  value={subcategoryInput}
                  onChange={e => setSubcategoryInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/60 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
                <datalist id="resource-subcategories-datalist">
                  {availableSubcategories.map(s => <option key={s.id} value={s.name} />)}
                </datalist>
              </div>
            )}

            {/* Thumbnail / Cover Image */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                Cover Image URL <span className="text-[11px] font-normal text-slate-400 lowercase">(auto-detected from video/article)</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="text"
                    placeholder="https://... (auto-detected)"
                    value={coverImage}
                    onChange={e => setCoverImage(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
                {previewCover && (
                  <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 shadow-sm">
                    <img 
                      src={previewCover} 
                      alt="Thumbnail preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={e => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Description / Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Description / Notes <span className="text-[11px] font-normal text-slate-400 lowercase">(optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Key takeaways, concepts covered, or summary..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none"
              />
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
            form="resource-form"
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span>{editResource ? 'Save Changes' : 'Add Resource'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
