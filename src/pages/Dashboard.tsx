import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { FolderKanban, CheckCircle2, AlertCircle, Clock, Plus, ArrowRight, TrendingUp, Users } from "lucide-react";

interface Props {
  activeWorkspace: string | null;
}

export default function Dashboard({ activeWorkspace }: Props) {
  const projects = useQuery(
    api.projects.list,
    activeWorkspace ? { workspaceId: activeWorkspace as any } : "skip"
  );
  const recentActivity = useQuery(
    api.activity.listByWorkspace,
    activeWorkspace ? { workspaceId: activeWorkspace as any, limit: 10 } : "skip"
  );

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(13,148,136,0.06)' }}>
          <FolderKanban className="w-8 h-8" style={{ color: 'rgba(13,148,136,0.4)' }} />
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--nova-text)' }}>Welcome to NovaSync</h2>
        <p className="text-sm max-w-md" style={{ color: 'var(--nova-text-secondary)' }}>
          Your workspace is ready. Create your first project to get started.
        </p>
        <Link
          to="/app/projects?create=true"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: 'rgba(13,148,136,0.06)', color: '#0d9488' }}
        >
          <Plus className="w-4 h-4" />
          Create Project
        </Link>
      </div>
    );
  }

  const totalTasks = projects?.reduce((acc: number, p: any) => acc + (p?.taskCount || 0), 0) || 0;
  const completedTasks = projects?.reduce((acc: number, p: any) => acc + (p?.doneTasks || 0), 0) || 0;
  const incompleteTasks = totalTasks - completedTasks;
  const activeProjects = projects?.filter((p: any) => p?.status === "active").length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--nova-text)' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--nova-text-secondary)' }}>Overview of your workspace</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Projects", value: activeProjects, icon: FolderKanban, accent: '#0d9488', bg: 'rgba(13,148,136,0.06)' },
          { label: "Total Tasks", value: totalTasks, icon: CheckCircle2, accent: '#6366f1', bg: 'rgba(99,102,241,0.06)' },
          { label: "Completed", value: completedTasks, icon: TrendingUp, accent: '#16a34a', bg: 'rgba(22,163,74,0.06)' },
          { label: "Incomplete", value: incompleteTasks, icon: AlertCircle, accent: '#d97706', bg: 'rgba(217,119,6,0.06)' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl"
            style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)' }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: stat.bg }}>
              <stat.icon className="w-4 h-4" style={{ color: stat.accent }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--nova-text)' }}>{stat.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--nova-text-muted)' }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="rounded-xl p-5" style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--nova-text)' }}>Recent Projects</h2>
            <Link to="/app/projects" className="text-xs font-medium" style={{ color: '#0d9488' }}>View all</Link>
          </div>
          <div className="space-y-2">
            {projects && projects.length > 0 ? (
              projects.slice(0, 5).map((project: any) => (
                <Link
                  key={project._id}
                  to={`/app/projects/${project._id}`}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all hover:shadow-sm"
                  style={{ background: 'var(--nova-ivory)' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: project.color ? `${project.color}12` : 'rgba(13,148,136,0.08)', color: project.color || '#0d9488' }}
                  >
                    {project.icon || project.title.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--nova-text)' }}>{project.title}</div>
                    <div className="text-xs" style={{ color: 'var(--nova-text-muted)' }}>{project.taskCount || 0} tasks · {project.completionPercent || 0}%</div>
                  </div>
                  <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--nova-border)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #0d9488, #6366f1)', width: `${project.completionPercent || 0}%` }}
                    />
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>No projects yet</p>
                <Link to="/app/projects?create=true" className="text-xs mt-1 inline-block" style={{ color: '#0d9488' }}>
                  Create your first project
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl p-5" style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--nova-text)' }}>Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.slice(0, 8).map((event: any) => (
                <div key={event._id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5" style={{ background: 'rgba(13,148,136,0.08)', color: '#0d9488' }}>
                    {event.user?.name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--nova-text-secondary)' }}>
                      <span className="font-medium" style={{ color: 'var(--nova-text)' }}>{event.user?.name || "Someone"}</span>{" "}
                      {event.description}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--nova-text-muted)' }}>
                      {formatTimeAgo(event.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>No activity yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/app/projects?create=true"
          className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-all hover:shadow-md"
          style={{ background: '#0d9488' }}
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
        <Link
          to="/app/my-work"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)', color: 'var(--nova-text-secondary)' }}
        >
          My Work
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          to="/app/nova-ai"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: 'rgba(99,102,241,0.06)', color: '#6366f1' }}
        >
          Ask Nova AI
        </Link>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
