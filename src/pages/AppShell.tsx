import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import NovaSyncLogo from "../components/NovaSyncLogo";
import {
  Home, FolderKanban, Bell, Search, Brain, Settings,
  ChevronDown, Plus, LogOut, User, Menu, X, Command, LayoutList, ExternalLink, Pencil, Check
} from "lucide-react";

import Dashboard from "./Dashboard";
import ProjectsPage from "./ProjectsPage";
import ProjectWorkspace from "./ProjectWorkspace";
import MyWork from "./MyWork";
import NotificationsPage from "./NotificationsPage";
import SearchPage from "./SearchPage";
import NovaAI from "./NovaAI";
import SettingsPage from "./SettingsPage";
import Onboarding from "./Onboarding";

const WORKSPACE_STORAGE_KEY = "novasync_active_workspace";

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [wsExpanded, setWsExpanded] = useState(false);

  const currentUser = useQuery(api.users.current);
  const authLoading = currentUser === undefined;
  const workspaces = useQuery(api.workspaces.list);
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(() => {
    // Restore from localStorage on mount
    try { return localStorage.getItem(WORKSPACE_STORAGE_KEY); } catch { return null; }
  });
  const unreadCount = useQuery(api.notifications.getUnreadCount);

  const updateWorkspace = useMutation(api.workspaces.update);

  // Workspace editing state
  const [editingWorkspace, setEditingWorkspace] = useState(false);
  const [editWsName, setEditWsName] = useState("");
  const [editWsDesc, setEditWsDesc] = useState("");
  const [savingWs, setSavingWs] = useState(false);

  // Sync activeWorkspace with loaded workspaces
  useEffect(() => {
    if (workspaces && workspaces.length > 0) {
      // If no active workspace or active workspace no longer exists, set to first
      const validWs = workspaces.find((w: any) => w?._id === activeWorkspace);
      if (!validWs) {
        const firstId = workspaces[0]?._id ?? null;
        setActiveWorkspace(firstId);
        if (firstId) {
          try { localStorage.setItem(WORKSPACE_STORAGE_KEY, firstId); } catch {}
        }
      }
    }
  }, [workspaces, activeWorkspace]);

  // Persist workspace selection to localStorage
  const handleWorkspaceChange = useCallback((wsId: string) => {
    setActiveWorkspace(wsId);
    try { localStorage.setItem(WORKSPACE_STORAGE_KEY, wsId); } catch {}
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(!commandOpen);
        return;
      }
      if (isInput) return;

      if (e.key === "/") { e.preventDefault(); navigate("/app/search"); }
      if (e.key === "?") { e.preventDefault(); }
      if (e.key === "c" && !e.ctrlKey && !e.metaKey) { e.preventDefault(); navigate("/app/projects?create=true"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commandOpen, navigate]);

  const showOnboarding = workspaces !== undefined && workspaces.length === 0;

  if (authLoading || workspaces === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f9' }}>
        <div className="w-8 h-8 border-2 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding />;
  }

  const activeWsData = workspaces?.find((w: any) => w?._id === activeWorkspace) as any;
  const wsName = activeWsData?.name || "Workspace";
  const wsInitial = wsName.charAt(0).toUpperCase();

  const openWorkspaceEditor = () => {
    setEditWsName(activeWsData?.name || "");
    setEditWsDesc(activeWsData?.description || "");
    setEditingWorkspace(true);
  };

  const handleSaveWorkspace = async () => {
    if (!activeWorkspace || !editWsName.trim()) return;
    setSavingWs(true);
    try {
      await updateWorkspace({
        workspaceId: activeWorkspace as any,
        name: editWsName.trim(),
        description: editWsDesc.trim() || undefined,
      });
      setEditingWorkspace(false);
    } catch (err) {
      console.error("Failed to update workspace:", err);
    } finally {
      setSavingWs(false);
    }
  };

  const navItems = [
    { path: "/app", icon: Home, label: "Dashboard", exact: true },
    { path: "/app/my-work", icon: LayoutList, label: "My Work" },
    { path: "/app/projects", icon: FolderKanban, label: "Projects" },
    { path: "/app/notifications", icon: Bell, label: "Notifications", badge: unreadCount || 0 },
    { path: "/app/search", icon: Search, label: "Search" },
    { path: "/app/nova-ai", icon: Brain, label: "Nova AI" },
    { path: "/app/settings", icon: Settings, label: "Settings" },
  ];

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--nova-surface-cool)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-60 flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ background: 'var(--nova-surface)', borderRight: '1px solid var(--nova-border)' }}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4" style={{ borderBottom: '1px solid var(--nova-border-light)' }}>
          <Link to="/app" className="flex items-center gap-2.5">
            <NovaSyncLogo size={24} />
            <span className="text-sm font-bold" style={{ color: 'var(--nova-text)' }}>NovaSync</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden" style={{ color: 'var(--nova-text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace selector */}
        <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--nova-border-light)' }}>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group" style={{ background: 'var(--nova-surface-cool)' }}>
            <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold" style={{ background: 'var(--nova-teal-bg)', color: 'var(--nova-teal)' }}>
              {wsInitial}
            </div>
            <span className="text-xs font-medium truncate flex-1" style={{ color: 'var(--nova-text)' }}>
              {wsName}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); openWorkspaceEditor(); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--nova-text-muted)' }}
              title="Edit workspace"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setWsExpanded(!wsExpanded); }}
              className="transition-transform"
              style={{ color: 'var(--nova-text-muted)', transform: wsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              title={wsExpanded ? 'Collapse description' : 'Expand description'}
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          {wsExpanded && activeWsData?.description && (
            <div className="mt-2 px-2 text-[11px] leading-relaxed animate-fade-in" style={{ color: 'var(--nova-text-secondary)' }}>
              {activeWsData.description}
            </div>
          )}
          {workspaces && workspaces.length > 1 && (
            <div className="mt-1 space-y-0.5">
              {workspaces.map((ws: any) => (
                <button
                  key={ws._id}
                  onClick={() => handleWorkspaceChange(ws._id)}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors"
                  style={{
                    background: ws?._id === activeWorkspace ? 'rgba(13,148,136,0.06)' : 'transparent',
                    color: ws?._id === activeWorkspace ? '#0d9488' : 'var(--nova-text-secondary)',
                    fontWeight: ws?._id === activeWorkspace ? 600 : 400,
                  }}
                >
                  {ws?.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
                style={{
                  background: active ? 'var(--nova-teal-bg)' : 'transparent',
                  color: active ? 'var(--nova-teal)' : 'var(--nova-text-secondary)',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <item.icon className="w-4 h-4" />
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span
                    className="min-w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ background: '#dc2626', color: '#ffffff' }}
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Back to Home */}
        <div className="px-3 py-2" style={{ borderTop: '1px solid var(--nova-border-light)' }}>
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ color: 'var(--nova-text-muted)' }}
          >
            <ExternalLink className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* User */}
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--nova-teal-bg)', color: 'var(--nova-teal)' }}>
              {currentUser?.name?.charAt(0) || <User className="w-3.5 h-3.5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: 'var(--nova-text)' }}>{currentUser?.name || "User"}</div>
              <div className="text-[10px] truncate" style={{ color: 'var(--nova-text-muted)' }}>{currentUser?.email || ""}</div>
            </div>
            <button
              onClick={() => signOut()}
              className="transition-colors hover:opacity-70"
              style={{ color: 'var(--nova-text-muted)' }}
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 h-14 flex items-center gap-3 px-4 sm:px-6"
          style={{ background: 'color-mix(in srgb, var(--nova-surface-cool) 85%, transparent)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--nova-border)' }}
        >
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden" style={{ color: 'var(--nova-text-secondary)' }}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => navigate("/app/search")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)', color: 'var(--nova-text-muted)' }}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--nova-surface-cool)', color: 'var(--nova-text-muted)' }}>/</kbd>
          </button>
          <button
            onClick={() => setCommandOpen(true)}
            className="hidden sm:flex items-center gap-1 transition-colors hover:opacity-70"
            style={{ color: 'var(--nova-text-muted)' }}
            title="Command palette (Ctrl+K)"
          >
            <Command className="w-4 h-4" />
          </button>
          <Link to="/app/notifications" className="relative transition-colors hover:opacity-70" style={{ color: 'var(--nova-text-secondary)' }}>
            <Bell className="w-4.5 h-4.5" />
            {unreadCount && unreadCount > 0 ? (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold"
                style={{ background: '#dc2626', color: '#ffffff' }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Link>
        </header>

        {/* Routes */}
        <div className="p-4 sm:p-6">
          <Routes>
            <Route index element={<Dashboard activeWorkspace={activeWorkspace} />} />
            <Route path="my-work" element={<MyWork />} />
            <Route path="projects" element={<ProjectsPage activeWorkspace={activeWorkspace} />} />
            <Route path="projects/:projectId/*" element={<ProjectWorkspace activeWorkspace={activeWorkspace} />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="search" element={<SearchPage activeWorkspace={activeWorkspace} />} />
            <Route path="nova-ai" element={<NovaAI activeWorkspace={activeWorkspace} />} />
            <Route path="settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>

      {/* Workspace Edit Modal */}
      {editingWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditingWorkspace(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)' }} />
          <div className="relative w-full max-w-sm rounded-xl shadow-2xl animate-scale-in" style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--nova-border-light)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--nova-text)' }}>Edit Workspace</h2>
              <button onClick={() => setEditingWorkspace(false)} style={{ color: 'var(--nova-text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nova-text-secondary)' }}>Workspace name</label>
                <input
                  autoFocus
                  value={editWsName}
                  onChange={(e) => setEditWsName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ background: 'var(--nova-surface-cool)', border: '1px solid var(--nova-border)', color: 'var(--nova-text)' }}
                  placeholder="Workspace name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nova-text-secondary)' }}>Description</label>
                <textarea
                  value={editWsDesc}
                  onChange={(e) => setEditWsDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm transition-colors resize-none"
                  style={{ background: 'var(--nova-surface-cool)', border: '1px solid var(--nova-border)', color: 'var(--nova-text)' }}
                  placeholder="Workspace description (optional)"
                  rows={2}
                />
              </div>
              <button
                onClick={handleSaveWorkspace}
                disabled={savingWs || !editWsName.trim()}
                className="w-full py-2.5 text-white font-semibold rounded-lg transition-all hover:shadow-md disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                style={{ background: '#0d9488' }}
              >
                {savingWs ? "Saving..." : <><Check className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Command Palette */}
      {commandOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]" onClick={() => setCommandOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)' }} />            <div
            className="relative w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-scale-in"
            style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              placeholder="Type a command..."
              className="w-full px-4 py-3 text-sm focus:outline-none"
              style={{ background: 'transparent', borderBottom: '1px solid var(--nova-border-light)', color: 'var(--nova-text)' }}
            />
            <div className="p-2 space-y-0.5">
              {[
                { label: "Create Project", icon: Plus, action: () => { navigate("/app/projects?create=true"); setCommandOpen(false); } },
                { label: "My Work", icon: LayoutList, action: () => { navigate("/app/my-work"); setCommandOpen(false); } },
                { label: "Notifications", icon: Bell, action: () => { navigate("/app/notifications"); setCommandOpen(false); } },
                { label: "Nova AI", icon: Brain, action: () => { navigate("/app/nova-ai"); setCommandOpen(false); } },
                { label: "Settings", icon: Settings, action: () => { navigate("/app/settings"); setCommandOpen(false); } },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left"
                  style={{ color: 'var(--nova-text-secondary)' }}
                >
                  <item.icon className="w-4 h-4" style={{ color: 'var(--nova-text-muted)' }} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
