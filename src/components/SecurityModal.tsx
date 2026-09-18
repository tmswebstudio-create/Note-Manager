import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Mail, 
  Check, 
  RefreshCw,
  Info
} from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SecurityModal({ isOpen, onClose }: SecurityModalProps) {
  const { 
    user, 
    hasPasswordProvider, 
    hasGoogleProvider, 
    addPassword, 
    changePassword, 
    sendPasswordReset 
  } = useAuth();

  // Mode: if user already has password, default to 'change', otherwise 'add'
  const [activeTab, setActiveTab] = useState<'manage' | 'reset'>('manage');

  // Add password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Status & loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset form when modal opens or user/hasPasswordProvider updates
  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setError(null);
      setSuccessMessage(null);
      setLoading(false);
      setActiveTab('manage');
    }
  }, [isOpen, hasPasswordProvider]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const isMinLength = newPassword.length >= 6;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Handle Adding Password (for Google users switching / adding email-password login)
  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!isMinLength) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!isMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await addPassword(newPassword);
      if (res.success) {
        setSuccessMessage('Password successfully created! You can now sign in using your email (' + (user.email || '') + ') and this password.');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(res.error || 'Failed to set password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Changing Password (for users who already have password)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (!isMinLength) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (!isMatch) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(newPassword, currentPassword);
      if (res.success) {
        setSuccessMessage('Your password has been updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(res.error || 'Failed to update password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Sending Password Reset Email
  const handleSendResetEmail = async () => {
    if (!user.email) return;
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const res = await sendPasswordReset(user.email);
      if (res.success) {
        setSuccessMessage(res.message || `Password reset link sent to ${user.email}.`);
      } else {
        setError(res.error || 'Failed to send reset link.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-sm">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Password & Security
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your credentials and login methods
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Account Overview Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/20 shrink-0" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {user.displayName || 'Signed In User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                    <Mail size={12} className="shrink-0" />
                    <span>{user.email || 'No email attached'}</span>
                  </p>
                </div>
              </div>

              {/* Status pill */}
              <div className="shrink-0">
                {hasPasswordProvider ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                    <CheckCircle2 size={12} />
                    Password Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60">
                    <AlertCircle size={12} />
                    Google Only
                  </span>
                )}
              </div>
            </div>

            {/* Provider Badges */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-slate-400">Available Sign-In Methods:</span>
              {hasGoogleProvider && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-xs">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Google
                </span>
              )}
              {hasPasswordProvider ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Lock size={11} />
                  Email & Password
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-600">
                  Email & Password (Not Set)
                </span>
              )}
            </div>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* If User DOES NOT have password set yet (Signed up with Google) */}
          {!hasPasswordProvider ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
                  <KeyRound size={17} />
                  <span>Add Password for Email Login</span>
                </div>
                <p className="text-xs text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed">
                  You originally signed in with Google. Adding a password allows you to switch between Google Sign-In and direct Email &amp; Password sign-in anytime using <strong>{user.email}</strong>.
                </p>
              </div>

              <form onSubmit={handleAddPassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Create Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 6 chars)"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Requirements Checklist */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className={`flex items-center gap-2 ${isMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                    <Check size={14} className={isMinLength ? 'opacity-100' : 'opacity-30'} />
                    <span>At least 6 characters</span>
                  </div>
                  <div className={`flex items-center gap-2 ${isMatch ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                    <Check size={14} className={isMatch ? 'opacity-100' : 'opacity-30'} />
                    <span>Passwords match</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isMinLength || !isMatch}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Setting Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      <span>Add Password &amp; Enable Email Login</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* If User ALREADY has a password -> Option to Change Password or Send Reset Email */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Change Login Password
                </span>
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={loading}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Mail size={12} />
                  <span>Send Reset Email</span>
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 6 chars)"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Requirements Checklist */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className={`flex items-center gap-2 ${isMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                    <Check size={14} className={isMinLength ? 'opacity-100' : 'opacity-30'} />
                    <span>At least 6 characters</span>
                  </div>
                  <div className={`flex items-center gap-2 ${isMatch ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                    <Check size={14} className={isMatch ? 'opacity-100' : 'opacity-30'} />
                    <span>Passwords match</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isMinLength || !isMatch || !currentPassword}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </form>

              {/* Reset Email Helper Box */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Forgot your password?
                  </span>
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={loading}
                    className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Send reset email to inbox
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Info size={14} className="text-indigo-500 shrink-0" />
            <span>Passkeys &amp; password logins sync with your secure database profile.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
