import { useState, useMemo, useRef, type FormEvent, type ChangeEvent, type DragEvent } from 'react';
import { useStore } from '../store/useStore';
import { Category } from '../types';
import { 
  X, Folder, Tag, Link2, Sparkles, AlertCircle, Check, 
  Search, Grid, LayoutGrid, Image as ImageIcon, Upload, FileImage, CheckCircle2 
} from 'lucide-react';
import { cn } from './Sidebar';
import { ALL_ICONS, ICON_CATEGORIES, IconItem } from './iconRegistry';
import { CategoryIcon } from './CategoryIcon';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  // If editing an existing category / subcategory:
  editingCategory?: Category | null;
  // If creating a subcategory under a parent:
  parentId?: string | null;
  parentName?: string;
  categoryType?: 'resource' | 'bookmark';
}

export function CategoryModal({
  isOpen,
  onClose,
  editingCategory,
  parentId,
  parentName,
  categoryType = 'resource'
}: CategoryModalProps) {
  const { addCategory, addSubcategory, updateCategory, categories } = useStore();

  const isEditing = Boolean(editingCategory);
  const isSubcategory = Boolean(editingCategory?.parentId || parentId);
  
  const effectiveParentName = useMemo(() => {
    if (parentName) return parentName;
    if (editingCategory?.parentId) {
      return categories.find(c => c.id === editingCategory.parentId)?.name || 'Parent Category';
    }
    return '';
  }, [parentName, editingCategory, categories]);

  const initialIsCustom = Boolean(
    editingCategory?.icon && 
    (editingCategory.icon.startsWith('http') || 
     editingCategory.icon.startsWith('data:') || 
     editingCategory.icon.startsWith('blob:') ||
     editingCategory.icon.match(/\.(jpg|jpeg|png|svg|webp|ico|gif)($|\?)/i))
  );

  const [name, setName] = useState(editingCategory?.name || '');
  const [selectedIcon, setSelectedIcon] = useState(editingCategory?.icon || '');
  const [activeTab, setActiveTab] = useState<'library' | 'custom'>(initialIsCustom ? 'custom' : 'library');
  const [iconSearch, setIconSearch] = useState('');
  const [selectedIconCategory, setSelectedIconCategory] = useState('All');
  const [error, setError] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessImageFile = (file: File) => {
    if (!file) return;
    const isImage = file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|svg|webp|ico|gif)$/i);
    if (!isImage) {
      setError('Please choose a valid image file (JPG, PNG, SVG, WebP)');
      return;
    }

    setUploadedFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawResult = e.target?.result as string;
      if (!rawResult) return;

      // For SVG, keep original data
      if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        setSelectedIcon(rawResult);
        return;
      }

      // For JPG / PNG / raster formats, optimize dimension to max 128x128 for crisp, fast local persistence
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 128;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = Math.max(width, 16);
        canvas.height = Math.max(height, 16);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const optimizedData = canvas.toDataURL(mime, 0.9);
          setSelectedIcon(optimizedData);
        } else {
          setSelectedIcon(rawResult);
        }
      };
      img.onerror = () => {
        setSelectedIcon(rawResult);
      };
      img.src = rawResult;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
  };

  const handleFileDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
  };

  // Filter icon library
  const filteredIcons = useMemo(() => {
    return ALL_ICONS.filter(item => {
      // Category filter
      if (selectedIconCategory !== 'All' && item.category !== selectedIconCategory) {
        return false;
      }
      // Search filter
      if (iconSearch.trim()) {
        const q = iconSearch.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesKeyword = item.keywords.some(k => k.toLowerCase().includes(q));
        return matchesName || matchesCategory || matchesKeyword;
      }
      return true;
    });
  }, [selectedIconCategory, iconSearch]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please enter a name');
      return;
    }

    const cleanIcon = selectedIcon.trim();

    if (isEditing && editingCategory) {
      updateCategory(editingCategory.id, {
        name: cleanName,
        icon: cleanIcon || undefined,
      });
    } else if (isSubcategory && parentId) {
      addSubcategory(parentId, cleanName, cleanIcon || undefined, categoryType);
    } else {
      addCategory(cleanName, null, cleanIcon || undefined, categoryType);
    }

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              {selectedIcon ? (
                <CategoryIcon icon={selectedIcon} name={name} size="md" />
              ) : (
                isSubcategory ? <Tag size={18} /> : <Folder size={18} />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                {isEditing 
                  ? (isSubcategory ? 'Edit Sub-category' : 'Edit Category')
                  : (isSubcategory ? 'New Sub-category' : 'New Category')
                }
              </h3>
              {isSubcategory && effectiveParentName && (
                <p className="text-xs text-slate-400">
                  Folder: <span className="font-medium text-slate-600 dark:text-slate-300">{effectiveParentName}</span>
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto min-h-0">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Name Field & Live Icon Preview */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {isSubcategory ? 'Sub-category Name' : 'Category Name'} <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-inner">
                  <CategoryIcon 
                    icon={selectedIcon} 
                    name={name || 'Category'} 
                    isSubcategory={isSubcategory} 
                    size="md" 
                  />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder={isSubcategory ? 'e.g. Tutorials, Hooks, Design System' : 'e.g. Frontend, Machine Learning, UI/UX'}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Icon Picker Section */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Select Icon
                </label>
                {selectedIcon && (
                  <button
                    type="button"
                    onClick={() => setSelectedIcon('')}
                    className="text-[11px] text-red-500 hover:text-red-600 font-medium"
                  >
                    Remove Icon (Use Default)
                  </button>
                )}
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('library')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all",
                    activeTab === 'library'
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  <LayoutGrid size={14} />
                  <span>Icon Library ({ALL_ICONS.length}+ icons)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('custom')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all",
                    activeTab === 'custom'
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  <Upload size={14} />
                  <span>Icon Link & JPG Upload</span>
                </button>
              </div>

              {/* Tab 1: Full Icon Library */}
              {activeTab === 'library' && (
                <div className="space-y-2.5 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  {/* Search and Category filters */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="text"
                        placeholder="Search icons by name (e.g. react, code, video, heart, db)..."
                        value={iconSearch}
                        onChange={(e) => setIconSearch(e.target.value)}
                        className="w-full pl-9 pr-8 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {iconSearch && (
                        <button
                          type="button"
                          onClick={() => setIconSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    {/* Category pill filters */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                      {ICON_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedIconCategory(cat)}
                          className={cn(
                            "px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors font-medium shrink-0",
                            selectedIconCategory === cat
                              ? "bg-indigo-600 text-white"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Icon Grid */}
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-56 overflow-y-auto p-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80">
                    {filteredIcons.map((item) => {
                      const isSelected = selectedIcon === item.id;
                      const IconComp = item.iconComponent;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedIcon(item.id);
                            setUploadedFileName(null);
                          }}
                          title={`${item.name} (${item.category})`}
                          className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-xl aspect-square transition-all group relative border",
                            isSelected
                              ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm ring-2 ring-indigo-500/20"
                              : "border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          )}
                        >
                          {item.type === 'url' && item.url ? (
                            <img
                              src={item.url}
                              alt={item.name}
                              className="w-5 h-5 object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : IconComp ? (
                            <IconComp size={20} className={isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-300 group-hover:text-indigo-500"} />
                          ) : (
                            <Tag size={18} />
                          )}
                          <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 truncate w-full text-center mt-1 leading-tight">
                            {item.name}
                          </span>
                        </button>
                      );
                    })}

                    {filteredIcons.length === 0 && (
                      <div className="col-span-full py-8 text-center text-xs text-slate-400">
                        No icons found matching "{iconSearch}". You can also upload a JPG or paste a link in the "Icon Link & JPG Upload" tab!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Custom URL / Image Link & JPG Upload */}
              {activeTab === 'custom' && (
                <div className="space-y-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 animate-in fade-in">
                  {/* File Upload / Drag-and-Drop Area */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Upload Icon File (JPG, JPEG, PNG, SVG)</span>
                      <span className="text-[11px] font-normal text-slate-400">Local or custom image</span>
                    </label>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp,image/x-icon"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                      onDragLeave={() => setIsDraggingFile(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group",
                        isDraggingFile
                          ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40"
                          : "border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/20"
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload size={18} />
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {isDraggingFile ? 'Drop image here' : 'Click to browse or drop JPG / PNG file'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Supports .jpg, .jpeg, .png, .svg, .webp (automatically optimized)
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-slate-200 dark:border-slate-700/80 w-full" />
                    <span className="bg-slate-50 dark:bg-slate-850 px-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider absolute">
                      or paste image link
                    </span>
                  </div>

                  {/* Icon Image Link URL input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Direct Icon Image Link
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Link2 size={15} />
                      </div>
                      <input
                        type="text"
                        value={selectedIcon && !selectedIcon.startsWith('data:') && !selectedIcon.startsWith('lucide:') ? selectedIcon : ''}
                        onChange={(e) => {
                          setSelectedIcon(e.target.value);
                          setUploadedFileName(null);
                        }}
                        placeholder="https://example.com/logo.jpg or https://cdn.simpleicons.org/..."
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Paste any web image URL (.jpg, .jpeg, .png, .svg) or icon CDN link.
                    </p>
                  </div>

                  {/* Active Custom Icon Indicator */}
                  {selectedIcon && (
                    <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                          <CategoryIcon icon={selectedIcon} name={name} size="md" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5 truncate">
                            <CheckCircle2 size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span>{uploadedFileName ? `JPG/Image: ${uploadedFileName}` : 'Custom icon ready'}</span>
                          </p>
                          <p className="text-[10px] text-indigo-700/80 dark:text-indigo-400 truncate font-mono">
                            {selectedIcon.startsWith('data:') ? 'Local base64 image data' : selectedIcon}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIcon('');
                          setUploadedFileName(null);
                        }}
                        className="text-xs text-red-500 hover:text-red-600 hover:underline font-medium shrink-0 px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons Footer */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Check size={14} />
              <span>{isEditing ? 'Save Changes' : (isSubcategory ? 'Create Sub-category' : 'Create Category')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
