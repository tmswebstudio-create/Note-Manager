import { useStore } from '../store/useStore';
import { ResourceCard } from './ResourceCard';
import { Resource } from '../types';

export function ResourceGrid({ onEdit }: { onEdit: (r: Resource) => void }) {
  const { resources, activeCategoryId, activeView, searchQuery } = useStore();

  let filtered = resources;

  if (activeView === 'favorites') {
    filtered = filtered.filter(r => r.favorite);
  } else if (activeView === 'recent') {
    filtered = filtered.filter(r => r.lastOpenedAt);
  } else if (activeView === 'category' && activeCategoryId) {
    filtered = filtered.filter(r => r.categoryId === activeCategoryId);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(r => 
      r.title.toLowerCase().includes(q) || 
      r.description?.toLowerCase().includes(q) || 
      r.url.toLowerCase().includes(q)
    );
  }

  // Sort logic
  if (activeView === 'recent') {
    filtered.sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));
  } else {
    filtered.sort((a, b) => b.createdAt - a.createdAt);
  }

  if (filtered.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No resources found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          {searchQuery ? "Try adjusting your search terms." : "Start building your collection by adding your first resource."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {filtered.map(resource => (
        <ResourceCard key={resource.id} resource={resource} onEdit={onEdit} />
      ))}
    </div>
  );
}
