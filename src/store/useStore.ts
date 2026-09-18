import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Resource, Category, Dashboard, MemberRole } from '../types';

interface AppState {
  resources: Resource[];
  categories: Category[];
  activeCategoryId: string | null;
  activeSubcategoryId: string | null;
  activeView: 'home' | 'favorites' | 'recent' | 'category' | 'bookmarks';
  searchQuery: string;
  theme: 'light' | 'dark';
  isSidebarCollapsed: boolean;
  userName: string;
  
  // Dashboard & Collaboration
  dashboards: Dashboard[];
  activeDashboardId: string | null;
  activeDashboardRole: MemberRole;
  isDashboardOwner: boolean;
  isSyncing: boolean;
  lastServerVersion: number;
  
  // Actions
  addResource: (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleComplete: (id: string) => void;
  togglePinned: (id: string) => void;
  reorderResources: (activeIdOrStartIndex: string | number, overIdOrEndIndex: string | number, scopeIds?: string[]) => void;
  
  addCategory: (name: string, parentId?: string | null, icon?: string, type?: 'resource' | 'bookmark') => string;
  addSubcategory: (parentId: string, name: string, icon?: string, type?: 'resource' | 'bookmark') => string;
  updateCategory: (id: string, updates: string | { name?: string; icon?: string; type?: 'resource' | 'bookmark' }, icon?: string) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (activeIdOrStartIndex: string | number, overIdOrEndIndex: string | number, scopeIds?: string[]) => void;
  
  setActiveCategory: (id: string | null, subcategoryId?: string | null) => void;
  setActiveSubcategory: (subcategoryId: string | null) => void;
  setActiveView: (view: 'home' | 'favorites' | 'recent' | 'category' | 'bookmarks') => void;
  setSearchQuery: (query: string) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setUserName: (name: string) => void;
  setResources: (resources: Resource[]) => void;
  setCategories: (categories: Category[]) => void;
  
  setDashboards: (dashboards: Dashboard[]) => void;
  setActiveDashboardId: (id: string | null) => void;
  setActiveDashboardRole: (role: MemberRole, isOwner: boolean) => void;
  setIsSyncing: (isSyncing: boolean) => void;
  setLastServerVersion: (version: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      resources: [],
      categories: [],
      activeCategoryId: null,
      activeSubcategoryId: null,
      activeView: 'bookmarks',
      searchQuery: '',
      theme: 'light',
      isSidebarCollapsed: false,
      userName: 'Guest',

      dashboards: [],
      activeDashboardId: null,
      activeDashboardRole: 'owner',
      isDashboardOwner: true,
      isSyncing: false,
      lastServerVersion: 0,

      setDashboards: (dashboards) => set({ dashboards }),
      setActiveDashboardId: (id) => set({ activeDashboardId: id }),
      setActiveDashboardRole: (role, isOwner) => set({ activeDashboardRole: role, isDashboardOwner: isOwner }),
      setIsSyncing: (isSyncing) => set({ isSyncing }),
      setLastServerVersion: (lastServerVersion) => set({ lastServerVersion }),

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

      reorderResources: (activeIdOrStartIndex, overIdOrEndIndex, scopeIds) => set((state) => {
        if (typeof activeIdOrStartIndex === 'number' && typeof overIdOrEndIndex === 'number') {
          const result = Array.from(state.resources);
          const [removed] = result.splice(activeIdOrStartIndex, 1);
          result.splice(overIdOrEndIndex, 0, removed);
          result.forEach((r, idx) => {
            r.order = idx;
          });
          return { resources: result };
        }

        const activeId = String(activeIdOrStartIndex);
        const overId = String(overIdOrEndIndex);
        if (activeId === overId) return state;

        if (scopeIds && scopeIds.length > 0) {
          const oldIndex = scopeIds.indexOf(activeId);
          const newIndex = scopeIds.indexOf(overId);
          if (oldIndex === -1 || newIndex === -1) return state;

          const newScopeIds = Array.from(scopeIds);
          const [removed] = newScopeIds.splice(oldIndex, 1);
          newScopeIds.splice(newIndex, 0, removed);

          const orderMap = new Map<string, number>();
          newScopeIds.forEach((id, idx) => {
            orderMap.set(id, idx);
          });

          const scopeResources = newScopeIds
            .map(id => state.resources.find(r => r.id === id))
            .filter((r): r is Resource => Boolean(r))
            .map(r => ({ ...r, order: orderMap.get(r.id) ?? r.order }));

          let scopeIndex = 0;
          const updatedResources = state.resources.map(r => {
            if (orderMap.has(r.id)) {
              return scopeResources[scopeIndex++];
            }
            return r;
          });

          return { resources: updatedResources };
        } else {
          const oldIndex = state.resources.findIndex(r => r.id === activeId);
          const newIndex = state.resources.findIndex(r => r.id === overId);
          if (oldIndex === -1 || newIndex === -1) return state;

          const result = Array.from(state.resources);
          const [removed] = result.splice(oldIndex, 1);
          result.splice(newIndex, 0, removed);
          result.forEach((r, idx) => {
            r.order = idx;
          });
          return { resources: result };
        }
      }),

      addCategory: (name, parentId = null, icon, type = 'resource') => {
        const id = crypto.randomUUID();
        set((state) => {
          const parent = parentId ? state.categories.find(c => c.id === parentId) : null;
          const effectiveType = type || parent?.type || 'resource';
          const newCategory: Category = {
            id,
            name: name.trim(),
            parentId: parentId || undefined,
            icon: icon?.trim() || undefined,
            type: effectiveType,
            order: state.categories.filter(c => c.parentId === (parentId || undefined)).length,
            createdAt: Date.now()
          };
          return { categories: [...state.categories, newCategory] };
        });
        return id;
      },

      addSubcategory: (parentId, name, icon, type) => {
        const id = crypto.randomUUID();
        set((state) => {
          const parent = state.categories.find(c => c.id === parentId);
          const effectiveType = type || parent?.type || 'resource';
          const newCategory: Category = {
            id,
            name: name.trim(),
            parentId,
            icon: icon?.trim() || undefined,
            type: effectiveType,
            order: state.categories.filter(c => c.parentId === parentId).length,
            createdAt: Date.now()
          };
          return { categories: [...state.categories, newCategory] };
        });
        return id;
      },

      updateCategory: (id, updates, iconParam) => set((state) => ({
        categories: state.categories.map(c => {
          if (c.id !== id) return c;
          if (typeof updates === 'string') {
            return { 
              ...c, 
              name: updates.trim(),
              ...(iconParam !== undefined ? { icon: iconParam.trim() || undefined } : {})
            };
          }
          return {
            ...c,
            ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
            ...(updates.icon !== undefined ? { icon: updates.icon.trim() || undefined } : {}),
            ...(updates.type !== undefined ? { type: updates.type } : {})
          };
        })
      })),

      deleteCategory: (id) => set((state) => {
        // Find if this is parent or subcategory
        const catToDelete = state.categories.find(c => c.id === id);
        const isParent = !catToDelete?.parentId;

        if (isParent) {
          // Delete parent category and all its subcategories
          const subCatIds = state.categories.filter(c => c.parentId === id).map(c => c.id);
          const allAffectedIds = [id, ...subCatIds];

          return {
            categories: state.categories.filter(c => c.id !== id && c.parentId !== id),
            resources: state.resources.filter(r => !allAffectedIds.includes(r.categoryId) && !allAffectedIds.includes(r.subcategoryId || '')),
            activeCategoryId: state.activeCategoryId === id ? null : state.activeCategoryId,
            activeSubcategoryId: subCatIds.includes(state.activeSubcategoryId || '') ? null : state.activeSubcategoryId,
            activeView: state.activeCategoryId === id ? 'home' : state.activeView
          };
        } else {
          // Subcategory delete
          return {
            categories: state.categories.filter(c => c.id !== id),
            resources: state.resources.map(r => r.subcategoryId === id ? { ...r, subcategoryId: undefined } : r),
            activeSubcategoryId: state.activeSubcategoryId === id ? null : state.activeSubcategoryId,
          };
        }
      }),

      reorderCategories: (activeIdOrStartIndex, overIdOrEndIndex, scopeIds) => set((state) => {
        if (typeof activeIdOrStartIndex === 'number' && typeof overIdOrEndIndex === 'number') {
          const result = Array.from(state.categories);
          const [removed] = result.splice(activeIdOrStartIndex, 1);
          result.splice(overIdOrEndIndex, 0, removed);
          result.forEach((c, idx) => {
            c.order = idx;
          });
          return { categories: result };
        }

        const activeId = String(activeIdOrStartIndex);
        const overId = String(overIdOrEndIndex);
        if (activeId === overId) return state;

        if (scopeIds && scopeIds.length > 0) {
          const oldIndex = scopeIds.indexOf(activeId);
          const newIndex = scopeIds.indexOf(overId);
          if (oldIndex === -1 || newIndex === -1) return state;

          const newScopeIds = Array.from(scopeIds);
          const [removed] = newScopeIds.splice(oldIndex, 1);
          newScopeIds.splice(newIndex, 0, removed);

          const orderMap = new Map<string, number>();
          newScopeIds.forEach((id, idx) => {
            orderMap.set(id, idx);
          });

          const scopeCategories = newScopeIds
            .map(id => state.categories.find(c => c.id === id))
            .filter((c): c is Category => Boolean(c))
            .map(c => ({ ...c, order: orderMap.get(c.id) ?? c.order }));

          let scopeIndex = 0;
          const updatedCategories = state.categories.map(c => {
            if (orderMap.has(c.id)) {
              return scopeCategories[scopeIndex++];
            }
            return c;
          });

          return { categories: updatedCategories };
        } else {
          const oldIndex = state.categories.findIndex(c => c.id === activeId);
          const newIndex = state.categories.findIndex(c => c.id === overId);
          if (oldIndex === -1 || newIndex === -1) return state;

          const result = Array.from(state.categories);
          const [removed] = result.splice(oldIndex, 1);
          result.splice(newIndex, 0, removed);
          result.forEach((c, idx) => {
            c.order = idx;
          });
          return { categories: result };
        }
      }),

      setActiveCategory: (id, subcategoryId = null) => set({ 
        activeCategoryId: id, 
        activeSubcategoryId: subcategoryId, 
        activeView: id ? 'category' : 'home' 
      }),
      setActiveSubcategory: (subcategoryId) => set({ activeSubcategoryId: subcategoryId }),
      setActiveView: (view) => set({ activeView: view, activeCategoryId: null, activeSubcategoryId: null }),
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
        userName: state.userName,
        activeDashboardId: state.activeDashboardId
      }),
    }
  )
);
