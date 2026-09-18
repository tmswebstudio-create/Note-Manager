import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { useStore } from '../store/useStore';
import { DashboardMember, MemberRole } from '../types';
import { 
  Users, 
  UserPlus, 
  Link2, 
  Copy, 
  Check, 
  Crown, 
  Eye, 
  Pencil, 
  Trash2, 
  LogOut, 
  Plus, 
  X, 
  FolderGit2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface CollaborateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'members' | 'workspaces' | 'join';
}

export function CollaborateModal({ isOpen, onClose, defaultTab = 'members' }: CollaborateModalProps) {
  const { 
    user, 
    dashboards, 
    activeDashboard, 
    switchDashboard, 
    createDashboard, 
    renameDashboard, 
    deleteDashboard, 
    joinDashboard, 
    inviteCollaborator, 
    getDashboardMembers, 
    removeCollaborator 
  } = useAuth();

  const { activeDashboardRole, isDashboardOwner } = useStore();

  const [activeTab, setActiveTab] = useState<'members' | 'workspaces' | 'join'>(defaultTab);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Members list state
  const [members, setMembers] = useState<DashboardMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Copy state
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Join form state
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  // New workspace form state
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  // Rename workspace state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Sync default tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setInviteError(null);
      setInviteSuccess(null);
      setJoinError(null);
      setJoinSuccess(null);
      if (activeDashboard) {
        setEditedName(activeDashboard.name);
      }
    }
  }, [isOpen, defaultTab, activeDashboard]);

  // Load members when modal opens or active dashboard changes
  useEffect(() => {
    if (isOpen && activeDashboard?.id) {
      loadMembers(activeDashboard.id);
    }
  }, [isOpen, activeDashboard?.id]);

  const loadMembers = async (dashId: string) => {
    setMembersLoading(true);
    try {
      const list = await getDashboardMembers(dashId);
      setMembers(list);
    } catch {
      // silent
    } finally {
      setMembersLoading(false);
    }
  };

  if (!isOpen) return null;

  const inviteCode = activeDashboard?.inviteCode || 'N/A';
  const shareLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/?join=${inviteCode}`
    : `https://app/?join=${inviteCode}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeDashboard) return;

    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(null);

    const result = await inviteCollaborator(activeDashboard.id, inviteEmail.trim(), inviteRole);
    setInviteLoading(false);

    if (result.success) {
      setInviteSuccess(`Invitation granted to ${inviteEmail.trim()}!`);
      setInviteEmail('');
      await loadMembers(activeDashboard.id);
      setTimeout(() => setInviteSuccess(null), 4000);
    } else {
      setInviteError(result.error || 'Failed to send invite.');
    }
  };

  const handleRemoveMember = async (memberId: number, memberEmail?: string) => {
    if (!activeDashboard) return;
    const confirmMsg = memberEmail 
      ? `Remove ${memberEmail} from this workspace?` 
      : 'Remove this collaborator from workspace?';
    if (!window.confirm(confirmMsg)) return;

    const ok = await removeCollaborator(activeDashboard.id, memberId);
    if (ok) {
      await loadMembers(activeDashboard.id);
    }
  };

  const handleLeaveWorkspace = async (memberId: number) => {
    if (!activeDashboard) return;
    if (!window.confirm('Are you sure you want to leave this workspace? You will lose access until re-invited.')) return;

    const ok = await removeCollaborator(activeDashboard.id, memberId);
    if (ok) {
      onClose();
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoinLoading(true);
    setJoinError(null);
    setJoinSuccess(null);

    const result = await joinDashboard(joinCode.trim());
    setJoinLoading(false);

    if (result.success) {
      setJoinSuccess(`Successfully joined "${result.dashboardName || 'Workspace'}"!`);
      setJoinCode('');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setJoinError(result.error || 'Failed to join workspace. Check the code and try again.');
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setCreatingWorkspace(true);
    const created = await createDashboard(newWorkspaceName.trim());
    setCreatingWorkspace(false);

    if (created) {
      setNewWorkspaceName('');
      setActiveTab('members');
    }
  };

  const handleSaveRename = async () => {
    if (!activeDashboard || !editedName.trim()) return;
    await renameDashboard(activeDashboard.id, editedName.trim());
    setIsEditingName(false);
  };

  const handleDeleteActiveDashboard = async () => {
    if (!activeDashboard) return;
    if (!window.confirm(`Are you sure you want to permanently delete workspace "${activeDashboard.name}" and all its contents? This cannot be undone.`)) return;

    await deleteDashboard(activeDashboard.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Users size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isEditingName && isDashboardOwner ? (
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="text" 
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="px-2 py-0.5 text-base font-bold bg-white dark:bg-slate-800 border border-indigo-400 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                      autoFocus
                    />
                    <button 
                      onClick={handleSaveRename}
                      className="px-2 py-0.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => { setIsEditingName(false); setEditedName(activeDashboard?.name || ''); }}
                      className="px-2 py-0.5 text-slate-500 hover:text-slate-700 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {activeDashboard?.name || 'Workspace'}
                    </h2>
                    {isDashboardOwner && (
                      <button 
                        onClick={() => setIsEditingName(true)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Rename workspace"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                  </>
                )}

                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  activeDashboardRole === 'owner'
                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                    : activeDashboardRole === 'editor'
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {activeDashboardRole}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Collaborate and manage access across team members
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/30 dark:bg-slate-900/30">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'members'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <UserPlus size={15} />
            <span>Invite & Collaborators</span>
            {members.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[10px]">
                {members.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('workspaces')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'workspaces'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FolderGit2 size={15} />
            <span>All Dashboards</span>
            <span className="ml-1 px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[10px]">
              {dashboards.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('join')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'join'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Link2 size={15} />
            <span>Join with Code</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'members' && (
            <>
              {/* Invite by Email Section (Available to owners and editors) */}
              {activeDashboardRole !== 'viewer' ? (
                <div className="bg-slate-50 dark:bg-slate-850/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <UserPlus size={14} className="text-indigo-600 dark:text-indigo-400" />
                    Invite Collaborator by Email
                  </h3>

                  <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <input 
                        type="email" 
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@example.com"
                        className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                      className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="editor">Can edit (Editor)</option>
                      <option value="viewer">Can view (Viewer)</option>
                    </select>

                    <button
                      type="submit"
                      disabled={inviteLoading || !inviteEmail.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all shrink-0 flex items-center justify-center gap-1.5"
                    >
                      {inviteLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <UserPlus size={13} />
                          <span>Invite</span>
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    They can log in with Google or Email/Password to access this dashboard instantly.
                  </p>

                  {inviteSuccess && (
                    <div className="mt-2.5 p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                      <Check size={14} className="shrink-0" />
                      <span>{inviteSuccess}</span>
                    </div>
                  )}

                  {inviteError && (
                    <div className="mt-2.5 p-2 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{inviteError}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
                  <Eye size={16} className="shrink-0" />
                  <span>You have read-only (Viewer) access to this workspace. Only owners and editors can invite collaborators.</span>
                </div>
              )}

              {/* Quick Share Code & Link */}
              <div className="bg-slate-50 dark:bg-slate-850/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Workspace Invite Code
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Share this code or direct link with anyone to give them instant editor access.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-indigo-600 dark:text-indigo-400 tracking-wider">
                      {inviteCode}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="p-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors"
                      title="Copy invite code"
                    >
                      {copiedCode ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-750 flex items-center justify-between gap-3">
                  <div className="truncate text-xs font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex-1">
                    {shareLink}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check size={13} className="text-emerald-500" />
                        <span>Copied Link</span>
                      </>
                    ) : (
                      <>
                        <Link2 size={13} />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Collaborators List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Users size={14} />
                    Current Members ({members.length})
                  </h4>
                  <button 
                    onClick={() => activeDashboard && loadMembers(activeDashboard.id)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Refresh
                  </button>
                </div>

                {membersLoading ? (
                  <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading members...</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                    {members.map((member) => {
                      const isCurrentUser = member.userEmail?.toLowerCase() === user?.email?.toLowerCase();
                      return (
                        <div key={member.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                              member.role === 'owner'
                                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400'
                                : member.role === 'editor'
                                ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {member.userName ? member.userName.charAt(0) : (member.userEmail ? member.userEmail.charAt(0) : 'U')}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                  {member.userName || member.userEmail || 'Collaborator'}
                                </span>
                                {isCurrentUser && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                                <span>{member.userEmail}</span>
                                {member.status === 'invited' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-medium">
                                    <Clock size={10} /> Pending login
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              member.role === 'owner'
                                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400'
                                : member.role === 'editor'
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {member.role === 'owner' && <Crown size={11} />}
                              {member.role}
                            </span>

                            {/* Actions: Owner can remove others, non-owner can leave */}
                            {isDashboardOwner && member.role !== 'owner' && (
                              <button
                                onClick={() => handleRemoveMember(member.id, member.userEmail)}
                                className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Remove member"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}

                            {!isDashboardOwner && isCurrentUser && member.role !== 'owner' && (
                              <button
                                onClick={() => handleLeaveWorkspace(member.id)}
                                className="flex items-center gap-1 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors font-medium"
                                title="Leave this workspace"
                              >
                                <LogOut size={12} />
                                <span>Leave</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'workspaces' && (
            <div className="space-y-5">
              {/* Create New Workspace */}
              <div className="bg-slate-50 dark:bg-slate-850/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Plus size={14} className="text-indigo-600" />
                  Create New Workspace
                </h4>
                <form onSubmit={handleCreateWorkspace} className="flex gap-2">
                  <input 
                    type="text" 
                    required
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="e.g. Design Team, Marketing Sprint, Personal Notes"
                    className="flex-1 px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={creatingWorkspace || !newWorkspaceName.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all shrink-0 flex items-center gap-1"
                  >
                    {creatingWorkspace ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Create</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Workspaces List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Your Workspaces ({dashboards.length})
                </h4>

                <div className="space-y-2">
                  {dashboards.map((dash) => {
                    const isActive = dash.id === activeDashboard?.id;
                    return (
                      <div
                        key={dash.id}
                        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            <FolderGit2 size={18} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                {dash.name}
                              </span>
                              {isActive && (
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-full">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span>Code: <code className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{dash.inviteCode}</code></span>
                              <span>•</span>
                              <span className="capitalize">{dash.role}</span>
                              {dash.memberCount && dash.memberCount > 1 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Users size={11} /> {dash.memberCount} members
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!isActive ? (
                            <button
                              onClick={async () => {
                                await switchDashboard(dash.id);
                                onClose();
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                            >
                              <span>Switch</span>
                              <ChevronRight size={13} />
                            </button>
                          ) : (
                            dash.isOwner && dashboards.length > 1 && (
                              <button
                                onClick={handleDeleteActiveDashboard}
                                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                title="Delete workspace"
                              >
                                <Trash2 size={15} />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'join' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-850/60 p-5 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
                  <Link2 size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Join an Existing Dashboard
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                    Enter the 6-character invite code provided by the workspace owner to access all shared bookmarks, resources, and playlists.
                  </p>
                </div>

                <form onSubmit={handleJoinSubmit} className="max-w-xs mx-auto space-y-3 pt-2">
                  <div>
                    <input 
                      type="text" 
                      required
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="e.g. DASH-9K2B4M"
                      className="w-full text-center tracking-widest uppercase font-mono text-sm font-bold px-4 py-2.5 bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800/80 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={joinLoading || !joinCode.trim()}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5"
                  >
                    {joinLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Join Workspace</span>
                      </>
                    )}
                  </button>
                </form>

                {joinSuccess && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-2">
                    <Check size={14} />
                    <span>{joinSuccess}</span>
                  </div>
                )}

                {joinError && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs rounded-xl border border-red-200 dark:border-red-800 flex items-center justify-center gap-2">
                    <AlertCircle size={14} />
                    <span>{joinError}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
