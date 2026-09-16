/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppShell } from './components/AppShell';
import { LoginPage } from './components/LoginPage';
import { useAuth } from './lib/auth-context';

export default function App() {
  const { user, loading, isGuest } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (!user && !isGuest) {
    return <LoginPage />;
  }
  
  return <AppShell />;
}
