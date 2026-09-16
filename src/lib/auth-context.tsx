import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleAuthProvider } from './firebase.ts';
import { useStore } from '../store/useStore.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name?: string) => Promise<void>;
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
  const { setResources, setCategories, setUserName, resources, categories } = useStore();

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
        
        // Extract display name from Google or email
        const fetchedName = currentUser.displayName?.trim() || 
          (currentUser.email ? currentUser.email.split('@')[0] : 'User');
        setUserName(fetchedName);

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
      } else {
        const isGuestStored = localStorage.getItem('isGuestMode') === 'true';
        if (!isGuestStored) {
          setUserName('Guest');
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setResources, setCategories, setUserName]);

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
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result.user) {
        const gName = result.user.displayName?.trim() || (result.user.email ? result.user.email.split('@')[0] : 'User');
        setUserName(gName);
      }
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
      const result = await signInWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        const displayName = result.user.displayName?.trim() || (result.user.email ? result.user.email.split('@')[0] : 'User');
        setUserName(displayName);
      }
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

  const signUp = async (email: string, pass: string, name?: string) => {
    try {
      setAuthError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const resolvedName = name?.trim() || (email ? email.split('@')[0] : 'User');
      
      if (userCredential.user) {
        if (name && name.trim()) {
          await updateProfile(userCredential.user, {
            displayName: name.trim()
          });
        }
        setUserName(resolvedName);
      }
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
      setUserName('Guest');
      setIsGuest(false);
      localStorage.removeItem('isGuestMode');
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setUserName('Guest');
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
