import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleAuthProvider } from './firebase.ts';
import { useStore } from '../store/useStore.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  authError: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isGuest: false,
  authError: null,
  signIn: async () => {},
  signOut: async () => {},
  continueAsGuest: () => {},
  clearAuthError: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
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

    // Check for redirect result on mount
    getRedirectResult(auth).catch((error) => {
      console.error("Error with redirect sign in:", error);
      if (error.code === 'auth/internal-error') {
        setAuthError("Google Sign-In is blocked in this preview window. Please open the app in a new tab using the icon in the top right to sign in.");
      }
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
      setAuthError(null);
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Sign in cancelled by user.');
      } else if (error.code === 'auth/cross-origin-opener-policy-failed' || error.code === 'auth/internal-error') {
        console.log('Popup failed due to COOP/security restrictions, falling back to redirect...');
        try {
          await signInWithRedirect(auth, googleAuthProvider);
        } catch (redirectError: any) {
          if (redirectError.code === 'auth/internal-error') {
            setAuthError("Google Sign-In is blocked in this preview window. Please open the app in a new tab using the icon in the top right to sign in.");
          } else {
            setAuthError(redirectError.message);
          }
        }
      } else {
        console.error('Error signing in with Google', error);
        try {
          await signInWithRedirect(auth, googleAuthProvider);
        } catch (redirectError: any) {
          if (redirectError.code === 'auth/internal-error') {
            setAuthError("Google Sign-In is blocked in this preview window. Please open the app in a new tab using the icon in the top right to sign in.");
          } else {
            setAuthError(redirectError.message);
          }
        }
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

  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, authError, signIn, signOut, continueAsGuest, clearAuthError }}>
      {children}
    </AuthContext.Provider>
  );
};
