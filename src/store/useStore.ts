import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Resource, Category } from '../types';

interface AppState {
  resources: Resource[];
  categories: Category[];
  activeCategoryId: string | null;
  activeView: 'home' | 'favorites' | 'recent' | 'category' | 'bookmarks';
  searchQuery: string;
  theme: 'light' | 'dark';
  isSidebarCollapsed: boolean;
  userName: string;
  
  // Actions
  addResource: (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleComplete: (id: string) => void;
  togglePinned: (id: string) => void;
  reorderResources: (startIndex: number, endIndex: number) => void;
  
  addCategory: (name: string) => string;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (startIndex: number, endIndex: number) => void;
  
  setActiveCategory: (id: string | null) => void;
  setActiveView: (view: 'home' | 'favorites' | 'recent' | 'category' | 'bookmarks') => void;
  setSearchQuery: (query: string) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setUserName: (name: string) => void;
  setResources: (resources: Resource[]) => void;
  setCategories: (categories: Category[]) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      resources: [],
      categories: [],
      activeCategoryId: null,
      activeView: 'bookmarks',
      searchQuery: '',
      theme: 'light',
      isSidebarCollapsed: false,
      userName: 'Guest',

      setResources: (resources) => set({ resources }),
      setCategories: (categories) => set({ categories }),

      addResource: (resourceData) => set((state) => {
        const newResource: Resource = {
          ...resourceData,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          order: state.resources.filter(r => r.categoryId === resourceData.categoryId).length
        };
        return { resources: [...state.resources, newResource] };
      }),

      updateResource: (id, updates) => set((state) => ({
        resources: state.resources.map(r => 
          r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r
        )
      })),

      deleteResource: (id) => set((state) => ({
        resources: state.resources.filter(r => r.id !== id)
      })),

      toggleFavorite: (id) => set((state) => ({
        resources: state.resources.map(r => 
          r.id === id ? { ...r, favorite: !r.favorite } : r
        )
      })),

      toggleComplete: (id) => set((state) => ({
        resources: state.resources.map(r => 
          r.id === id ? { ...r, completed: !r.completed } : r
        )
      })),

      togglePinned: (id) => set((state) => ({
        resources: state.resources.map(r => 
          r.id === id ? { ...r, pinned: !r.pinned } : r
        )
      })),

      reorderResources: (startIndex, endIndex) => set((state) => {
        const result = Array.from(state.resources);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return { resources: result };
      }),

      addCategory: (name) => {
        const id = crypto.randomUUID();
        set((state) => {
          const newCategory: Category = {
            id,
            name,
            order: state.categories.length,
            createdAt: Date.now()
          };
          return { categories: [...state.categories, newCategory] };
        });
        return id;
      },

      updateCategory: (id, name) => set((state) => ({
        categories: state.categories.map(c => 
          c.id === id ? { ...c, name } : c
        )
      })),

      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(c => c.id !== id),
        resources: state.resources.filter(r => r.categoryId !== id),
        activeCategoryId: state.activeCategoryId === id ? null : state.activeCategoryId,
        activeView: state.activeCategoryId === id ? 'home' : state.activeView
      })),

      reorderCategories: (startIndex, endIndex) => set((state) => {
        const result = Array.from(state.categories);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return { categories: result };
      }),

      setActiveCategory: (id) => set({ activeCategoryId: id, activeView: id ? 'category' : 'home' }),
      setActiveView: (view) => set({ activeView: view, activeCategoryId: null }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setUserName: (name) => set({ userName: name }),
    }),
    {
      name: 'note-manager-storage',
      partialize: (state) => ({ 
        resources: state.resources,
        categories: state.categories,
        theme: state.theme,
        isSidebarCollapsed: state.isSidebarCollapsed,
        userName: state.userName
      }),
    }
  )
);
