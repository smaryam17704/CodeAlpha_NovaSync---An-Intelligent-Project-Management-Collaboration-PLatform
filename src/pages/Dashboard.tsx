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
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
          <FolderKanban className="w-8 h-8 text-[hsl(192,100%,50%)]/50" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Welcome to NovaSync</h2>
        <p className="text-sm text-gray-400 max-w-md">
          Your workspace is ready. Create your first project to get started.
        </p>
        <Link
          to="/app/projects?create=true"
          className="mt-4 inline-flex items-center gap-2 bg-[hsl(192,100%,50%)]/10 text-[hsl(192,100%,50%)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[hsl(192,100%,50%)]/20 transition-colors"
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
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Overview of your workspace</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Projects", value: activeProjects, icon: FolderKanban, color: "from-[hsl(192,100%,50%)]/20 to-[hsl(192,100%,50%)]/5" },
          { label: "Total Tasks", value: totalTasks, icon: CheckCircle2, color: "from-[hsl(262,83%,58%)]/20 to-[hsl(262,83%,58%)]/5" },
          { label: "Completed", value: completedTasks, icon: TrendingUp, color: "from-[hsl(142,71%,45%)]/20 to-[hsl(142,71%,45%)]/5" },
          { label: "Incomplete", value: incompleteTasks, icon: AlertCircle, color: "from-[hsl(25,95%,53%)]/20 to-[hsl(25,95%,53%)]/5" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
          >
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-4 h-4 text-white/70" />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Recent Projects</h2>
            <Link to="/app/projects" className="text-xs text-[hsl(192,100%,50%)] hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {projects && projects.length > 0 ? (
              projects.slice(0, 5).map((project: any) => (
                <Link
                  key={project._id}
                  to={`/app/projects/${project._id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: project.color ? `${project.color}20` : "rgba(0,212,255,0.1)", color: project.color || "hsl(192,100%,50%)" }}
                  >
                    {project.icon || project.title.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{project.title}</div>
                    <div className="text-xs text-gray-500">{project.taskCount || 0} tasks · {project.completionPercent || 0}%</div>
                  </div>
                  <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[hsl(192,100%,50%)] to-[hsl(262,83%,58%)]"
                      style={{ width: `${project.completionPercent || 0}%` }}
                    />
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">No projects yet</p>
                <Link to="/app/projects?create=true" className="text-xs text-[hsl(192,100%,50%)] hover:underline mt-1 inline-block">
                  Create your first project
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.slice(0, 8).map((event: any) => (
                <div key={event._id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    {event.user?.name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 leading-relaxed">
                      <span className="font-medium text-white">{event.user?.name || "Someone"}</span>{" "}
                      {event.description}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {formatTimeAgo(event.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">No activity yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/app/projects?create=true"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(192,100%,50%)]/10 text-[hsl(192,100%,50%)] rounded-lg text-sm hover:bg-[hsl(192,100%,50%)]/15 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
        <Link
          to="/app/my-work"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-300 rounded-lg text-sm hover:bg-white/8 transition-colors"
        >
          My Work
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          to="/app/nova-ai"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(262,83%,58%)]/10 text-[hsl(262,83%,58%)] rounded-lg text-sm hover:bg-[hsl(262,83%,58%)]/15 transition-colors"
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
