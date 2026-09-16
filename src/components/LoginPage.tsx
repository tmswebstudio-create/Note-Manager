import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { LogIn, BookOpen, User, AlertCircle, ExternalLink, Mail, Lock } from 'lucide-react';

export function LoginPage() {
  const { signIn, signUp, continueAsGuest, authError, clearAuthError } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      await signUp(email, password);
    } else {
      await signIn(email, password);
    }
  };

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

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 mt-6"
          >
            <LogIn size={20} />
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="flex flex-col space-y-4">
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); clearAuthError(); }}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">Or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={continueAsGuest}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-all active:scale-95"
          >
            <User size={18} />
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
