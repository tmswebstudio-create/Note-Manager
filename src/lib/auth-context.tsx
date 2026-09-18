import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
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
import { Dashboard, DashboardMember, MemberRole } from '../types.ts';

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

  // Dashboards & Collaboration
  dashboards: Dashboard[];
  activeDashboard: Dashboard | null;
  loadDashboards: () => Promise<void>;
  switchDashboard: (dashboardId: string) => Promise<void>;
  createDashboard: (name: string) => Promise<Dashboard | null>;
  renameDashboard: (dashboardId: string, name: string) => Promise<boolean>;
  deleteDashboard: (dashboardId: string) => Promise<boolean>;
  joinDashboard: (inviteCode: string) => Promise<{ success: boolean; error?: string; dashboardName?: string }>;
  inviteCollaborator: (dashboardId: string, email: string, role?: 'editor' | 'viewer') => Promise<{ success: boolean; error?: string; message?: string; member?: any }>;
  getDashboardMembers: (dashboardId: string) => Promise<DashboardMember[]>;
  removeCollaborator: (dashboardId: string, memberId: number) => Promise<boolean>;
  refreshActiveDashboard: () => Promise<void>;
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

  dashboards: [],
  activeDashboard: null,
  loadDashboards: async () => {},
  switchDashboard: async () => {},
  createDashboard: async () => null,
  renameDashboard: async () => false,
  deleteDashboard: async () => false,
  joinDashboard: async () => ({ success: false, error: 'Not implemented' }),
  inviteCollaborator: async () => ({ success: false, error: 'Not implemented' }),
  getDashboardMembers: async () => [],
  removeCollaborator: async () => false,
  refreshActiveDashboard: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { 
    setResources, 
    setCategories, 
    setUserName, 
    resources, 
    categories,
    dashboards,
    setDashboards,
    activeDashboardId,
    setActiveDashboardId,
    activeDashboardRole,
    setActiveDashboardRole,
    setIsSyncing,
    lastServerVersion,
    setLastServerVersion
  } = useStore();

  const isSwitchingDashboard = useRef(false);
  const isInitialLoadDone = useRef(false);
  const isSyncInProgress = useRef(false);

  // Active dashboard computed from ID
  const activeDashboard = dashboards.find(d => d.id === activeDashboardId) || null;

  // Helper to fetch user's ID token safely
  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch {
      return null;
    }
  }, [user]);

  // Load data for a specific dashboard
  const loadDashboardData = useCallback(async (dashId: string, token: string) => {
    try {
      const res = await fetch(`/api/data?dashboardId=${encodeURIComponent(dashId)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        isSwitchingDashboard.current = true;
        setCategories(data.categories || []);
        setResources(data.resources || []);
        if (data.role) {
          setActiveDashboardRole(data.role, Boolean(data.isOwner));
        }
        if (data.version) {
          setLastServerVersion(data.version);
        }
        setTimeout(() => {
          isSwitchingDashboard.current = false;
        }, 800);
      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
      isSwitchingDashboard.current = false;
    }
  }, [setCategories, setResources, setActiveDashboardRole, setLastServerVersion]);

  // Load list of accessible dashboards
  const loadDashboards = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;

    try {
      const res = await fetch('/api/dashboards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list: Dashboard[] = data.dashboards || [];
        setDashboards(list);

        // Check if current active dashboard is valid
        const currentActive = list.find(d => d.id === activeDashboardId);
        if (currentActive) {
          setActiveDashboardRole(currentActive.role, currentActive.isOwner);
        } else if (list.length > 0) {
          const firstDash = list[0];
          setActiveDashboardId(firstDash.id);
          setActiveDashboardRole(firstDash.role, firstDash.isOwner);
          await loadDashboardData(firstDash.id, token);
        }
      }
    } catch (e) {
      console.error('Failed to load dashboards:', e);
    }
  }, [getIdToken, setDashboards, activeDashboardId, setActiveDashboardId, setActiveDashboardRole, loadDashboardData]);

  // Switch to a different dashboard
  const switchDashboard = useCallback(async (dashId: string) => {
    if (dashId === activeDashboardId && !isSwitchingDashboard.current) return;
    const token = await getIdToken();
    if (!token) return;

    const target = dashboards.find(d => d.id === dashId);
    if (!target) return;

    isSwitchingDashboard.current = true;
    setActiveDashboardId(dashId);
    setActiveDashboardRole(target.role, target.isOwner);
    await loadDashboardData(dashId, token);
  }, [activeDashboardId, dashboards, getIdToken, setActiveDashboardId, setActiveDashboardRole, loadDashboardData]);

  // Create new workspace
  const createDashboardAction = useCallback(async (name: string): Promise<Dashboard | null> => {
    const token = await getIdToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/dashboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() || 'New Workspace' }),
      });
      if (res.ok) {
        const data = await res.json();
        const newDash: Dashboard = data.dashboard;
        setDashboards([newDash, ...dashboards]);
        await switchDashboard(newDash.id);
        return newDash;
      }
      return null;
    } catch (e) {
      console.error('Failed to create dashboard:', e);
      return null;
    }
  }, [getIdToken, dashboards, setDashboards, switchDashboard]);

  // Rename workspace
  const renameDashboardAction = useCallback(async (dashId: string, name: string): Promise<boolean> => {
    const token = await getIdToken();
    if (!token) return false;

    try {
      const res = await fetch(`/api/dashboards/${dashId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setDashboards(dashboards.map(d => d.id === dashId ? { ...d, name } : d));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to rename dashboard:', e);
      return false;
    }
  }, [getIdToken, dashboards, setDashboards]);

  // Delete workspace
  const deleteDashboardAction = useCallback(async (dashId: string): Promise<boolean> => {
    const token = await getIdToken();
    if (!token) return false;

    try {
      const res = await fetch(`/api/dashboards/${dashId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const remaining = dashboards.filter(d => d.id !== dashId);
        setDashboards(remaining);
        if (remaining.length > 0) {
          await switchDashboard(remaining[0].id);
        } else {
          setActiveDashboardId(null);
          setCategories([]);
          setResources([]);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to delete dashboard:', e);
      return false;
    }
  }, [getIdToken, dashboards, setDashboards, switchDashboard, setActiveDashboardId, setCategories, setResources]);

  // Join workspace using code
  const joinDashboardAction = useCallback(async (rawCode: string): Promise<{ success: boolean; error?: string; dashboardName?: string }> => {
    const token = await getIdToken();
    if (!token) return { success: false, error: 'Authentication required' };

    try {
      const res = await fetch('/api/dashboards/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: rawCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to join workspace' };
      }

      await loadDashboards();
      if (data.dashboard?.id) {
        await switchDashboard(data.dashboard.id);
      }
      return { 
        success: true, 
        dashboardName: data.dashboard?.name,
      };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error joining workspace' };
    }
  }, [getIdToken, loadDashboards, switchDashboard]);

  // Invite collaborator
  const inviteCollaboratorAction = useCallback(async (
    dashId: string, 
    email: string, 
    role: 'editor' | 'viewer' = 'editor'
  ): Promise<{ success: boolean; error?: string; message?: string; member?: any }> => {
    const token = await getIdToken();
    if (!token) return { success: false, error: 'Authentication required' };

    try {
      const res = await fetch(`/api/dashboards/${dashId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to invite collaborator' };
      }
      // Increment member count in local list
      setDashboards(dashboards.map(d => d.id === dashId ? { ...d, memberCount: (d.memberCount || 1) + 1 } : d));
      return { success: true, message: data.message, member: data.member };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error inviting collaborator' };
    }
  }, [getIdToken, dashboards, setDashboards]);

  // Get members
  const getDashboardMembersAction = useCallback(async (dashId: string): Promise<DashboardMember[]> => {
    const token = await getIdToken();
    if (!token) return [];

    try {
      const res = await fetch(`/api/dashboards/${dashId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data.members || [];
      }
      return [];
    } catch (e) {
      console.error('Failed to get dashboard members:', e);
      return [];
    }
  }, [getIdToken]);

  // Remove collaborator or leave
  const removeCollaboratorAction = useCallback(async (dashId: string, memberId: number): Promise<boolean> => {
    const token = await getIdToken();
    if (!token) return false;

    try {
      const res = await fetch(`/api/dashboards/${dashId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await loadDashboards();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to remove collaborator:', e);
      return false;
    }
  }, [getIdToken, loadDashboards]);

  // Manually refresh active dashboard
  const refreshActiveDashboard = useCallback(async () => {
    if (!activeDashboardId) return;
    const token = await getIdToken();
    if (!token) return;
    await loadDashboardData(activeDashboardId, token);
    await loadDashboards();
  }, [activeDashboardId, getIdToken, loadDashboardData, loadDashboards]);

  // Check URL join parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join') || params.get('invite');
    if (joinCode) {
      localStorage.setItem('pending_join_code', joinCode.trim().toUpperCase());
      // Clean query parameter without page reload
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Auth State Listener
  useEffect(() => {
    const guestState = localStorage.getItem('isGuestMode');
    if (guestState === 'true') {
      setIsGuest(true);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        setIsGuest(false);
        localStorage.removeItem('isGuestMode');
        
        const fetchedName = currentUser.displayName?.trim() || 
          (currentUser.email ? currentUser.email.split('@')[0] : 'User');
        setUserName(fetchedName);

        try {
          const token = await currentUser.getIdToken();

          // Check if there was a pending join code from shared link
          const pendingJoin = localStorage.getItem('pending_join_code');
          if (pendingJoin) {
            localStorage.removeItem('pending_join_code');
            try {
              await fetch('/api/dashboards/join', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ inviteCode: pendingJoin }),
              });
            } catch (e) {
              console.warn('Pending join code error:', e);
            }
          }

          // Fetch all accessible workspaces
          const dashRes = await fetch('/api/dashboards', {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (dashRes.ok) {
            const dashData = await dashRes.json();
            const dashList: Dashboard[] = dashData.dashboards || [];
            setDashboards(dashList);

            // Determine which workspace to activate
            let selectedDash = dashList.find(d => d.id === activeDashboardId);
            if (!selectedDash && dashList.length > 0) {
              selectedDash = dashList[0];
            }

            if (selectedDash) {
              setActiveDashboardId(selectedDash.id);
              setActiveDashboardRole(selectedDash.role, selectedDash.isOwner);
              await loadDashboardData(selectedDash.id, token);
            }
          }
        } catch (e) {
          console.error("Failed to load user workspace data:", e);
        } finally {
          isInitialLoadDone.current = true;
        }
      } else {
        const isGuestStored = localStorage.getItem('isGuestMode') === 'true';
        if (!isGuestStored) {
          setUserName('Guest');
        }
        isInitialLoadDone.current = true;
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUserName, setDashboards, setActiveDashboardId, setActiveDashboardRole, loadDashboardData]);

  // Sync effect: When categories or resources change, debounced push to active dashboard
  useEffect(() => {
    if (!user || loading || !isInitialLoadDone.current || isSwitchingDashboard.current || !activeDashboardId) {
      return;
    }

    // Viewers cannot modify shared dashboards
    if (activeDashboardRole === 'viewer') {
      return;
    }
    
    const syncData = async () => {
      if (isSwitchingDashboard.current || isSyncInProgress.current) return;
      isSyncInProgress.current = true;
      setIsSyncing(true);

      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ 
            dashboardId: activeDashboardId, 
            categories, 
            resources 
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.version) {
            setLastServerVersion(data.version);
          }
        }
      } catch (e) {
        console.error("Failed to sync data:", e);
      } finally {
        setIsSyncing(false);
        isSyncInProgress.current = false;
      }
    };
    
    const timeout = setTimeout(syncData, 1200);
    return () => clearTimeout(timeout);
  }, [resources, categories, user, loading, activeDashboardId, activeDashboardRole, setIsSyncing, setLastServerVersion]);

  // Live Collaboration Sync: Lightweight version polling
  useEffect(() => {
    if (!user || !activeDashboardId || loading) return;

    let isPolling = false;

    const checkVersion = async () => {
      // Only poll when tab is active and not currently syncing
      if (document.hidden || isSyncInProgress.current || isSwitchingDashboard.current || isPolling) {
        return;
      }

      try {
        isPolling = true;
        const token = await user.getIdToken();
        const res = await fetch(`/api/dashboards/${activeDashboardId}/version`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // If server version is strictly newer than our last known version, reload categories/resources!
          if (data.version && data.version > lastServerVersion) {
            const dataRes = await fetch(`/api/data?dashboardId=${encodeURIComponent(activeDashboardId)}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (dataRes.ok) {
              const freshData = await dataRes.json();
              isSwitchingDashboard.current = true;
              setCategories(freshData.categories || []);
              setResources(freshData.resources || []);
              setLastServerVersion(data.version);
              setTimeout(() => {
                isSwitchingDashboard.current = false;
              }, 400);
            }
          }
        }
      } catch {
        // silent fail on poll
      } finally {
        isPolling = false;
      }
    };

    const interval = setInterval(checkVersion, 4000);
    return () => clearInterval(interval);
  }, [user, activeDashboardId, loading, lastServerVersion, setCategories, setResources, setLastServerVersion]);

  // Auth Action Methods
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
        // Closed popup intentionally
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
      setDashboards([]);
      setActiveDashboardId(null);
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
      clearAuthError,

      dashboards,
      activeDashboard,
      loadDashboards,
      switchDashboard,
      createDashboard: createDashboardAction,
      renameDashboard: renameDashboardAction,
      deleteDashboard: deleteDashboardAction,
      joinDashboard: joinDashboardAction,
      inviteCollaborator: inviteCollaboratorAction,
      getDashboardMembers: getDashboardMembersAction,
      removeCollaborator: removeCollaboratorAction,
      refreshActiveDashboard,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
