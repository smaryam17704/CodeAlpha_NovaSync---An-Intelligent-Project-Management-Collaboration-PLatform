import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import NovaSyncLogo from "../components/NovaSyncLogo";
import {
  Home, FolderKanban, Bell, Search, Brain, Settings,
  ChevronDown, Plus, LogOut, User, Menu, X, Command, LayoutList
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

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const currentUser = useQuery(api.users.current);
  const authLoading = currentUser === undefined;
  const workspaces = useQuery(api.workspaces.list);
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const unreadCount = useQuery(api.notifications.getUnreadCount);

  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !activeWorkspace) {
      setActiveWorkspace(workspaces[0]?._id ?? null);
    }
  }, [workspaces, activeWorkspace]);

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
      if (e.key === "?") { e.preventDefault(); /* shortcut help */ }
      if (e.key === "c" && !e.ctrlKey && !e.metaKey) { e.preventDefault(); navigate("/app/projects?create=true"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commandOpen, navigate]);

  const showOnboarding = workspaces !== undefined && workspaces.length === 0;

  if (authLoading || workspaces === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(222,47%,8%)]">
        <div className="w-8 h-8 border-2 border-[hsl(192,100%,50%)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding />;
  }

  const navItems = [
    { path: "/app", icon: Home, label: "Home", exact: true },
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
    <div className="min-h-screen flex bg-[hsl(222,47%,8%)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-60 bg-[hsl(222,40%,10%)] border-r border-white/5 flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/5">
          <Link to="/app" className="flex items-center gap-2">
            <NovaSyncLogo size={24} />
            <span className="text-sm font-bold">NovaSync</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace selector */}
        <div className="px-3 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 cursor-pointer hover:bg-white/8 transition-colors">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[hsl(192,100%,50%)]/20 to-[hsl(262,83%,58%)]/20 flex items-center justify-center text-xs font-bold text-[hsl(192,100%,50%)]">
              {activeWorkspace && (workspaces as any[])?.find((w: any) => w?._id === activeWorkspace)?.name?.charAt(0) || "W"}
            </div>
            <span className="text-xs font-medium truncate flex-1">
              {activeWorkspace && (workspaces as any[])?.find((w: any) => w?._id === activeWorkspace)?.name || "Workspace"}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </div>
          {workspaces && workspaces.length > 1 && (
            <div className="mt-1 space-y-0.5">
              {workspaces.map((ws: any) => (
                <button
                  key={ws._id}
                  onClick={() => setActiveWorkspace(ws._id)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                    ws?._id === activeWorkspace ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5"
                  }`}
                >
                  {ws?.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(item.path, item.exact)
                  ? "bg-white/10 text-white font-medium"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="flex-1">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="min-w-5 h-5 flex items-center justify-center rounded-full bg-[hsl(192,100%,50%)] text-[10px] font-bold text-[hsl(222,47%,8%)]">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-white/5">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[hsl(192,100%,50%)]/30 to-[hsl(262,83%,58%)]/30 flex items-center justify-center text-xs font-bold">
              {currentUser?.name?.charAt(0) || <User className="w-3.5 h-3.5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{currentUser?.name || "User"}</div>
              <div className="text-[10px] text-gray-500 truncate">{currentUser?.email || ""}</div>
            </div>
            <button
              onClick={() => signOut()}
              className="text-gray-500 hover:text-gray-300 transition-colors"
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
        <header className="sticky top-0 z-30 h-14 flex items-center gap-3 px-4 border-b border-white/5 bg-[hsl(222,47%,8%)]/80 backdrop-blur-xl">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => navigate("/app/search")}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400 hover:bg-white/8 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            Search...
            <kbd className="hidden sm:inline text-[10px] bg-white/10 px-1.5 py-0.5 rounded">/</kbd>
          </button>
          <button
            onClick={() => setCommandOpen(true)}
            className="hidden sm:flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
            title="Command palette (Ctrl+K)"
          >
            <Command className="w-4 h-4" />
          </button>
          <Link to="/app/notifications" className="relative text-gray-400 hover:text-white transition-colors">
            <Bell className="w-4.5 h-4.5" />
            {unreadCount && unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-[hsl(0,84%,60%)] text-[9px] font-bold text-white">
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

      {/* Command Palette */}
      {commandOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]" onClick={() => setCommandOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full max-w-md bg-[hsl(222,40%,12%)] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              placeholder="Type a command..."
              className="w-full px-4 py-3 bg-transparent border-b border-white/5 text-sm text-white placeholder-gray-500 focus:outline-none"
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
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 transition-colors text-left"
                >
                  <item.icon className="w-4 h-4 text-gray-500" />
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
