import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleAuthProvider } from './firebase.ts';
import { useStore } from '../store/useStore.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isGuest: false,
  signIn: async () => {},
  signOut: async () => {},
  continueAsGuest: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const { setResources, setCategories, resources, categories } = useStore();

  useEffect(() => {
    // Check if guest mode was previously selected
    const guestState = localStorage.getItem('isGuestMode');
    if (guestState === 'true') {
      setIsGuest(true);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        setIsGuest(false);
        localStorage.removeItem('isGuestMode');
        
        // Load data from backend
        try {
          const token = await currentUser.getIdToken();
          const res = await fetch('/api/data', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.categories && data.resources && (data.categories.length > 0 || data.resources.length > 0)) {
              setCategories(data.categories);
              setResources(data.resources);
            }
          }
        } catch (e) {
          console.error("Failed to load user data:", e);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setResources, setCategories]);

  // Sync effect: When user is logged in and data changes, push to backend.
  // We use a simple debounce mechanism or just save on every change for simplicity.
  useEffect(() => {
    if (!user || loading) return;
    
    const syncData = async () => {
      try {
        const token = await user.getIdToken();
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ categories, resources })
        });
      } catch (e) {
        console.error("Failed to sync data:", e);
      }
    };
    
    // Quick debounce
    const timeout = setTimeout(syncData, 1500);
    return () => clearTimeout(timeout);
  }, [resources, categories, user, loading]);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Sign in cancelled by user.');
      } else {
        console.error('Error signing in with Google', error);
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setResources([]);
      setCategories([]);
      setIsGuest(false);
      localStorage.removeItem('isGuestMode');
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('isGuestMode', 'true');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, signIn, signOut, continueAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};
