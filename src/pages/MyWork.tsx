import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../hooks/use-auth";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { LayoutList, Calendar, AlertCircle, CheckCircle2, Clock, Filter } from "lucide-react";

type FilterType = "all" | "active" | "completed" | "overdue" | "upcoming";

export default function MyWork() {
  const [filter, setFilter] = useState<FilterType>("active");
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const assignedTasks = useQuery(
    api.tasks.getByAssignee,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );
  const createdTasks = useQuery(
    api.tasks.getByCreator,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  const allTasksRaw = assignedTasks || [];
  const createdTasksRaw = createdTasks || [];
  const taskIds = new Set(allTasksRaw.map((t) => t._id));
  const allTasks = [...allTasksRaw, ...createdTasksRaw.filter((t) => !taskIds.has(t._id))];

  const now = Date.now();

  const filteredTasks = allTasks.filter((t) => {
    switch (filter) {
      case "active": return t.status !== "done";
      case "completed": return t.status === "done";
      case "overdue": return t.status !== "done" && t.dueDate && t.dueDate < now;
      case "upcoming": return t.status !== "done" && t.dueDate && t.dueDate > now && t.dueDate < now + 7 * 24 * 60 * 60 * 1000;
      default: return true;
    }
  });

  const statusColors: Record<string, { bg: string; color: string }> = {
    todo: { bg: '#f4f6f9', color: '#5e6278' },
    in_progress: { bg: 'rgba(13,148,136,0.06)', color: '#0d9488' },
    review: { bg: 'rgba(99,102,241,0.06)', color: '#6366f1' },
    done: { bg: 'rgba(22,163,74,0.06)', color: '#16a34a' },
  };

  const priorityColors: Record<string, { bg: string; color: string }> = {
    urgent: { bg: 'rgba(220,38,38,0.06)', color: '#dc2626' },
    high: { bg: 'rgba(217,119,6,0.06)', color: '#d97706' },
    medium: { bg: '#f4f6f9', color: '#5e6278' },
    low: { bg: '#f4f6f9', color: '#9da2b3' },
  };

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "All", count: allTasks.length },
    { key: "active", label: "Active", count: allTasks.filter((t) => t.status !== "done").length },
    { key: "completed", label: "Completed", count: allTasks.filter((t) => t.status === "done").length },
    { key: "overdue", label: "Overdue", count: allTasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate < now).length },
    { key: "upcoming", label: "Upcoming", count: allTasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate > now && t.dueDate < now + 7 * 86400000).length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#1a1d2e' }}>My Work</h1>
        <p className="text-sm mt-1" style={{ color: '#5e6278' }}>Tasks assigned to you</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              background: filter === f.key ? 'rgba(13,148,136,0.06)' : '#ffffff',
              color: filter === f.key ? '#0d9488' : '#5e6278',
              border: `1px solid ${filter === f.key ? 'rgba(13,148,136,0.15)' : '#e8eaef'}`,
            }}
          >
            {f.label}
            <span className="text-[10px] opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Tasks */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-2">
          {filteredTasks.map((task, i) => {
            const sc = statusColors[task.status] || statusColors.todo;
            const pc = priorityColors[task.priority] || priorityColors.medium;
            return (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => navigate(`/app/projects/${task.projectId}/task/${task._id}`)}
                className="flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer"
                style={{ background: '#ffffff', border: '1px solid #e8eaef' }}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{
                  background: task.status === "done" ? '#16a34a' : task.status === "in_progress" ? '#0d9488' : task.status === "review" ? '#6366f1' : '#9da2b3'
                }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: task.status === "done" ? '#9da2b3' : '#1a1d2e', textDecoration: task.status === "done" ? 'line-through' : 'none' }}>
                    {task.title}
                  </div>
                  {task.project && (
                    <div className="text-[10px] mt-0.5" style={{ color: '#9da2b3' }}>{task.project.title}</div>
                  )}
                </div>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded capitalize" style={{ background: sc.bg, color: sc.color }}>
                  {task.status.replace("_", " ")}
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded capitalize hidden sm:block" style={{ background: pc.bg, color: pc.color }}>
                  {task.priority}
                </span>
                {task.dueDate && (
                  <span className="text-[10px] flex items-center gap-1 hidden sm:flex" style={{ color: '#9da2b3' }}>
                    <Calendar className="w-3 h-3" />
                    {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(13,148,136,0.06)' }}>
            <LayoutList className="w-8 h-8" style={{ color: '#9da2b3' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a1d2e' }}>No tasks found</h3>
          <p className="text-sm max-w-md" style={{ color: '#5e6278' }}>
            {filter === "active" ? "You're all caught up! No active tasks assigned to you." :
             filter === "overdue" ? "No overdue tasks. Great job staying on track!" :
             "No tasks match this filter."}
          </p>
        </div>
      )}
    </div>
  );
}
