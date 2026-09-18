import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  linkWithCredential,
  EmailAuthProvider,
  updatePassword,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleAuthProvider } from './firebase.ts';
import { useStore } from '../store/useStore.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  authError: string | null;
  hasPasswordProvider: boolean;
  hasGoogleProvider: boolean;
  signInWithGoogle: () => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  addPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string, currentPassword?: string) => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  continueAsGuest: () => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isGuest: false,
  authError: null,
  hasPasswordProvider: false,
  hasGoogleProvider: false,
  signInWithGoogle: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  addPassword: async () => ({ success: false, error: 'Not implemented' }),
  changePassword: async () => ({ success: false, error: 'Not implemented' }),
  sendPasswordReset: async () => ({ success: false, error: 'Not implemented' }),
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

  const hasPasswordProvider = Boolean(
    user?.providerData?.some((p) => p.providerId === 'password')
  );

  const hasGoogleProvider = Boolean(
    user?.providerData?.some((p) => p.providerId === 'google.com')
  );

  const addPassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !user.email) {
      return { success: false, error: 'No signed in user or email address found.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await linkWithCredential(user, credential);
      await user.reload();
      if (auth.currentUser) {
        setUser({ ...auth.currentUser });
      }
      return { success: true };
    } catch (error: any) {
      console.error('Error linking password:', error);
      if (error.code === 'auth/provider-already-linked') {
        try {
          await updatePassword(user, password);
          await user.reload();
          if (auth.currentUser) {
            setUser({ ...auth.currentUser });
          }
          return { success: true };
        } catch (updateErr: any) {
          return { success: false, error: updateErr.message || 'Failed to update password.' };
        }
      }
      if (error.code === 'auth/credential-already-in-use') {
        return { 
          success: false, 
          error: 'An account with this email already has a password set. You can sign in using your email and password.' 
        };
      }
      if (error.code === 'auth/requires-recent-login') {
        try {
          await reauthenticateWithPopup(user, googleAuthProvider);
          const credential = EmailAuthProvider.credential(user.email, password);
          await linkWithCredential(user, credential);
          await user.reload();
          if (auth.currentUser) {
            setUser({ ...auth.currentUser });
          }
          return { success: true };
        } catch {
          return { 
            success: false, 
            error: 'Adding a password requires recent authentication. Please sign out and sign back in with Google, then try again.' 
          };
        }
      }
      if (error.code === 'auth/weak-password') {
        return { success: false, error: 'Password is too weak. Please use at least 6 characters.' };
      }
      return { success: false, error: error.message || 'Failed to add password.' };
    }
  };

  const changePassword = async (newPassword: string, currentPassword?: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No signed in user found.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    try {
      if (currentPassword && user.email) {
        const cred = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, cred);
      }
      await updatePassword(user, newPassword);
      await user.reload();
      if (auth.currentUser) {
        setUser({ ...auth.currentUser });
      }
      return { success: true };
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        return { success: false, error: 'Current password is incorrect.' };
      }
      if (error.code === 'auth/requires-recent-login') {
        if (hasGoogleProvider) {
          try {
            await reauthenticateWithPopup(user, googleAuthProvider);
            await updatePassword(user, newPassword);
            await user.reload();
            if (auth.currentUser) {
              setUser({ ...auth.currentUser });
            }
            return { success: true };
          } catch {
            // fall through
          }
        }
        return { 
          success: false, 
          error: 'Security checkpoint: Please enter your current password or re-login to update your password.' 
        };
      }
      if (error.code === 'auth/weak-password') {
        return { success: false, error: 'New password is too weak. Please use at least 6 characters.' };
      }
      return { success: false, error: error.message || 'Failed to update password.' };
    }
  };

  const sendPasswordReset = async (emailToReset?: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    const targetEmail = emailToReset?.trim() || user?.email?.trim();
    if (!targetEmail) {
      return { success: false, error: 'Please specify an email address.' };
    }

    try {
      await sendPasswordResetEmail(auth, targetEmail);
      return { 
        success: true, 
        message: `Password reset link sent to ${targetEmail}. Please check your inbox or spam folder.` 
      };
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      if (error.code === 'auth/user-not-found') {
        return { success: false, error: 'No account found with this email address.' };
      }
      if (error.code === 'auth/invalid-email') {
        return { success: false, error: 'Invalid email address format.' };
      }
      return { success: false, error: error.message || 'Failed to send reset email.' };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isGuest, 
      authError, 
      hasPasswordProvider,
      hasGoogleProvider,
      signInWithGoogle, 
      signIn, 
      signUp, 
      signOut, 
      addPassword,
      changePassword,
      sendPasswordReset,
      continueAsGuest, 
      clearAuthError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
