import React from 'react';
import { useAuth } from '../lib/auth-context';
import { LogIn, BookOpen, User, AlertCircle, ExternalLink } from 'lucide-react';

export function LoginPage() {
  const { signIn, continueAsGuest, authError, clearAuthError } = useAuth();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 text-center space-y-8">
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <BookOpen size={32} />
          </div>
          <h1 className="text-2xl font-bold">Welcome to Note Manager</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Organize your bookmarks, courses, videos, and articles in one place. Sign in to sync your data across devices.
          </p>
        </div>

        {authError && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm flex flex-col gap-3 text-left border border-red-100 dark:border-red-900/30">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>{authError}</p>
            </div>
            {authError.includes('preview window') && (
              <button 
                onClick={() => window.open(window.location.href, '_blank')}
                className="w-full py-2 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
              >
                Open in New Tab <ExternalLink size={14} />
              </button>
            )}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>

          <button
            onClick={continueAsGuest}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-base font-medium rounded-xl transition-all active:scale-95"
          >
            <User size={20} />
            Continue as Guest
          </button>
        </div>
        
        <div className="pt-2 text-xs text-slate-400 dark:text-slate-500">
          Guest data is only saved locally in this browser.
        </div>
      </div>
    </div>
  );
}
