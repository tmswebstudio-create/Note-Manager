import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { BookOpen, User, AlertCircle, ExternalLink } from 'lucide-react';

export function LoginPage() {
  const { signInWithGoogle, continueAsGuest, authError, clearAuthError } = useAuth();
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 text-center space-y-6">
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
            <BookOpen size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to Note Manager</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            Organize bookmarks, courses, videos, and articles in one place. Sign in to sync your data or continue as guest.
          </p>
        </div>

        {authError && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm flex flex-col gap-3 text-left border border-red-100 dark:border-red-900/30">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="leading-snug">{authError}</p>
            </div>
          </div>
        )}

        <div className="space-y-3 pt-2">
          {isInIframe ? (
            <button
              type="button"
              onClick={() => window.open(window.location.href, '_blank')}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <ExternalLink size={18} />
              Open in New Tab to Sign In
            </button>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign in with Google
            </button>
          )}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-white dark:bg-slate-900 text-slate-400">Or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={continueAsGuest}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <User size={18} />
            Continue as Guest
          </button>
        </div>
        
        <p className="text-xs text-slate-400 dark:text-slate-500 pt-2">
          {isInIframe 
            ? "Tip: Google login requires opening the app in a new tab."
            : "Guest data is stored locally in your browser."}
        </p>
      </div>
    </div>
  );
}
