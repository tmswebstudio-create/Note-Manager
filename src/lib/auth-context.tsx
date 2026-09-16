import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleAuthProvider } from './firebase.ts';
import { useStore } from '../store/useStore.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isGuest: false,
  authError: null,
  signInWithGoogle: async () => {},
  signIn: async () => {},
  signUp: async () => {},
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

    return () => unsubscribe();
  }, [setResources, setCategories]);

  // Sync effect: When user is logged in and data changes, push to backend.
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

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error: any) {
      console.error('Error signing in with Google', error);
      if (error.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        setAuthError(`Domain not authorized in Firebase. Please add '${currentDomain}' under Authentication > Settings > Authorized domains in Firebase Console.`);
      } else if (error.code === 'auth/popup-closed-by-user') {
        // User just closed popup, no error needed
      } else {
        setAuthError(error.message || "Failed to sign in with Google.");
      }
    }
  };

  const signIn = async (email: string, pass: string) => {
    try {
      setAuthError(null);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error('Error signing in', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setAuthError("Incorrect email or password. Please verify your credentials or create an account.");
      } else if (error.code === 'auth/too-many-requests') {
        setAuthError("Too many failed login attempts. Please wait a moment and try again.");
      } else if (error.code === 'auth/operation-not-allowed') {
        setAuthError("Email/Password sign-in is not enabled in Firebase. Please enable 'Email/Password' in Firebase Console > Authentication > Sign-in method.");
      } else {
        setAuthError(error.message || "Failed to sign in.");
      }
    }
  };

  const signUp = async (email: string, pass: string) => {
    try {
      setAuthError(null);
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error('Error signing up', error);
      if (error.code === 'auth/email-already-in-use') {
        setAuthError("This email is already registered. Please switch to Sign In.");
      } else if (error.code === 'auth/weak-password') {
        setAuthError("Password is too weak. Please use at least 6 characters.");
      } else if (error.code === 'auth/operation-not-allowed') {
        setAuthError("Email/Password sign-up is not enabled in Firebase. Please enable 'Email/Password' in Firebase Console > Authentication > Sign-in method.");
      } else {
        setAuthError(error.message || "Failed to sign up.");
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
    <AuthContext.Provider value={{ user, loading, isGuest, authError, signInWithGoogle, signIn, signUp, signOut, continueAsGuest, clearAuthError }}>
      {children}
    </AuthContext.Provider>
  );
};
