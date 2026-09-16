import { useStore } from '../store/useStore';
import { Search, Plus, Menu, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export function Topbar({ onMenuClick, onAddClick }: { onMenuClick: () => void, onAddClick: () => void }) {
  const { activeView, activeCategoryId, categories, searchQuery, setSearchQuery, resources, userName } = useStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  let title = 'All Resources';
  let description = 'Manage your complete collection';

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
    description = 'Your saved websites and links';
  }

  const categoryResources = activeCategoryId 
    ? resources.filter(r => r.categoryId === activeCategoryId)
    : activeView === 'favorites' ? resources.filter(r => r.favorite) 
    : activeView === 'bookmarks' ? resources.filter(r => ['Website', 'Article', 'Bookmark', 'Documentation'].includes(r.type))
    : resources;

  const total = categoryResources.length;
  const videos = categoryResources.filter(r => r.type.includes('Video') || r.type.includes('Playlist')).length;
  const websites = categoryResources.filter(r => r.type === 'Website' || r.type === 'Article').length;

  return (
    <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-4 sm:py-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu size={20} />
          </button>
          
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1 hidden sm:block">
              {activeView === 'category' ? `Playlists / ${title}` : `Library / ${title}`}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
              {title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-48 lg:w-64 bg-slate-100 dark:bg-slate-900 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <button 
            onClick={onAddClick}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-full shadow-sm shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{activeView === 'bookmarks' ? 'Add Bookmark' : 'Add New'}</span>
          </button>

          <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800 ml-2">
            <div className="text-right hidden xl:block">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{getGreeting()}</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Hello, {userName}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold uppercase cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 hover:ring-offset-slate-50 dark:hover:ring-offset-slate-950 transition-all">
              {userName.charAt(0)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile search */}
      <div className="relative md:hidden w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input 
          type="text" 
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-4 py-2 w-full bg-slate-100 dark:bg-slate-900 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
        />
      </div>

      <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/50 pt-3">
        <span>{total} Total</span>
        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
        <span>{videos} Videos</span>
        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
        <span>{websites} Websites/Docs</span>
      </div>
    </div>
  );
}
