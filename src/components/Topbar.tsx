import { useStore } from '../store/useStore';
import { Search, Plus, Menu, Globe, Layers } from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
  onAddBookmark: () => void;
  onAddResource: () => void;
}

export function Topbar({ onMenuClick, onAddBookmark, onAddResource }: TopbarProps) {
  const { activeView, activeCategoryId, categories, searchQuery, setSearchQuery, resources, userName } = useStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  let title = 'All Resources';
  let description = 'Manage your complete learning and resource library';

  if (activeView === 'favorites') {
    title = 'Favorites';
    description = 'Your starred resources';
  } else if (activeView === 'recent') {
    title = 'Recently Opened';
    description = 'Pick up where you left off';
  } else if (activeView === 'category' && activeCategoryId) {
    const cat = categories.find(c => c.id === activeCategoryId);
    if (cat) {
      title = cat.name;
      description = `Your ${cat.name.toLowerCase()} resources`;
    }
  } else if (activeView === 'bookmarks') {
    title = 'Web Bookmarks';
    description = 'Your saved websites and online tools with automatic favicons';
  }

  const categoryResources = activeCategoryId 
    ? resources.filter(r => r.categoryId === activeCategoryId)
    : activeView === 'favorites' ? resources.filter(r => r.favorite) 
    : activeView === 'bookmarks' ? resources.filter(r => r.type === 'Website' || ['Article', 'Bookmark', 'Documentation'].includes(r.type))
    : resources;

  const total = categoryResources.length;
  const websites = categoryResources.filter(r => r.type === 'Website' || ['Article', 'Bookmark', 'Documentation'].includes(r.type)).length;
  const posts = categoryResources.filter(r => r.type === 'Post').length;
  const videos = categoryResources.filter(r => r.type === 'Video' || r.type.includes('Video') || r.type.includes('Playlist')).length;

  return (
    <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-4 sm:py-5 flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu size={20} />
          </button>
          
          <div>
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:block">
              {activeView === 'category' ? `Playlists / ${title}` : activeView === 'bookmarks' ? 'Bookmarks' : `Library / ${title}`}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              {title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Search bar */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input 
              type="text" 
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-44 lg:w-56 bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-full text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
            />
          </div>

          {/* Dedicated 2 Add Buttons */}
          <button 
            onClick={onAddBookmark}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-sm"
            title="Add Web Bookmark (fetches favicon)"
          >
            <Globe size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span>Add Bookmark</span>
          </button>

          <button 
            onClick={onAddResource}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow-sm shadow-indigo-600/25 transition-all active:scale-95"
            title="Add Resource (fetches thumbnail)"
          >
            <Layers size={14} />
            <span>Add Resource</span>
          </button>

          {/* User profile badge */}
          <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800 ml-1">
            <div className="text-right hidden xl:block">
              <div className="text-[10px] font-medium text-slate-400">{getGreeting()}</div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{userName}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all">
              {userName.charAt(0)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile search */}
      <div className="relative md:hidden w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input 
          type="text" 
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-4 py-2 w-full bg-slate-100 dark:bg-slate-900 border-none rounded-full text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
        />
      </div>

      <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/50 pt-2.5">
        <span>{total} Total Items</span>
        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
        <span className="flex items-center gap-1"><Globe size={11} className="text-indigo-500" /> {websites} Bookmarks</span>
        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
        <span>{posts} Posts</span>
        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
        <span>{videos} Videos</span>
      </div>
    </div>
  );
}
