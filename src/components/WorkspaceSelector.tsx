import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { useStore } from '../store/useStore';
import { 
  Users, 
  ChevronDown, 
  Check, 
  Plus, 
  Share2, 
  FolderGit2, 
  Link2,
  Crown,
  Lock
} from 'lucide-react';

interface WorkspaceSelectorProps {
  onOpenCollaborateModal: (defaultTab?: 'members' | 'workspaces' | 'join') => void;
  collapsed?: boolean;
}

export function WorkspaceSelector({ onOpenCollaborateModal, collapsed = false }: WorkspaceSelectorProps) {
  const { user, isGuest, dashboards, activeDashboard, switchDashboard } = useAuth();
  const { activeDashboardRole } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!user || isGuest) {
    return null;
  }

  const currentName = activeDashboard?.name || 'My Workspace';
  const memberCount = activeDashboard?.memberCount || 1;

  if (collapsed) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors mx-auto"
          title={`${currentName} (${activeDashboardRole})`}
        >
          <FolderGit2 size={18} />
        </button>

        {isOpen && (
          <div className="absolute left-14 top-0 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in duration-150">
            <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Switch Workspace
            </div>
            {dashboards.map((dash) => (
              <button
                key={dash.id}
                onClick={async () => {
                  await switchDashboard(dash.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-xl transition-colors text-left ${
                  dash.id === activeDashboard?.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{dash.name}</span>
                {dash.id === activeDashboard?.id && <Check size={14} className="text-indigo-600 shrink-0 ml-1" />}
              </button>
            ))}
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenCollaborateModal('members');
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl font-semibold"
              >
                <Share2 size={13} />
                <span>Collaborate & Invite</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-slate-850/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl transition-all shadow-xs group text-left"
        title="Switch or manage workspaces"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs shadow-indigo-600/30">
            <FolderGit2 size={15} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {currentName}
              </span>
              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                activeDashboardRole === 'owner'
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400'
                  : activeDashboardRole === 'editor'
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {activeDashboardRole}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <Users size={10} />
              <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
              <span>•</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">Collaborate</span>
            </div>
          </div>
        </div>

        <ChevronDown size={14} className={`text-slate-400 transition-transform shrink-0 ml-1.5 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in duration-150">
          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Workspaces</span>
            <span>{dashboards.length} total</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {dashboards.map((dash) => {
              const isSelected = dash.id === activeDashboard?.id;
              return (
                <button
                  key={dash.id}
                  onClick={async () => {
                    await switchDashboard(dash.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-xl transition-colors text-left ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{dash.name}</span>
                    {dash.isOwner && (
                      <span title="Owner">
                        <Crown size={11} className="text-amber-500 shrink-0" />
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={14} className="text-indigo-600 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>

          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenCollaborateModal('members');
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl font-semibold transition-colors"
            >
              <Share2 size={13} />
              <span>Invite & Share Workspace</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenCollaborateModal('workspaces');
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
            >
              <Plus size={13} />
              <span>Create New Workspace</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenCollaborateModal('join');
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
            >
              <Link2 size={13} />
              <span>Join with Code</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
