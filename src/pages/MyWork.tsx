import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { LayoutList, Calendar, AlertCircle, CheckCircle2, Clock, Filter } from "lucide-react";

type FilterType = "all" | "active" | "completed" | "overdue" | "upcoming";

export default function MyWork() {
  const [filter, setFilter] = useState<FilterType>("active");
  const navigate = useNavigate();

  const assignedTasks = useQuery(api.tasks.getByAssignee, { userId: "" as any });
  const createdTasks = useQuery(api.tasks.getByCreator, { userId: "" as any });

  // Use the current user's tasks
  const allTasks = assignedTasks || [];
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

  const statusColors: Record<string, string> = {
    todo: "bg-white/5 text-gray-400",
    in_progress: "bg-[hsl(192,100%,50%)]/10 text-[hsl(192,100%,50%)]",
    review: "bg-[hsl(262,83%,58%)]/10 text-[hsl(262,83%,58%)]",
    done: "bg-[hsl(142,71%,45%)]/10 text-[hsl(142,71%,45%)]",
  };

  const priorityColors: Record<string, string> = {
    urgent: "bg-[hsl(0,84%,60%)]/10 text-[hsl(0,84%,60%)]",
    high: "bg-[hsl(25,95%,53%)]/10 text-[hsl(25,95%,53%)]",
    medium: "bg-white/5 text-gray-400",
    low: "bg-white/5 text-gray-500",
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
        <h1 className="text-2xl font-bold">My Work</h1>
        <p className="text-sm text-gray-400 mt-1">Tasks assigned to you</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? "bg-[hsl(192,100%,50%)]/10 text-[hsl(192,100%,50%)]"
                : "bg-white/5 text-gray-400 hover:bg-white/8"
            }`}
          >
            {f.label}
            <span className="text-[10px] opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Tasks */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-2">
          {filteredTasks.map((task, i) => (
            <motion.div
              key={task._id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/app/projects/${task.projectId}/task/${task._id}`)}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer"
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                task.status === "done" ? "bg-[hsl(142,71%,45%)]" :
                task.status === "in_progress" ? "bg-[hsl(192,100%,50%)]" :
                task.status === "review" ? "bg-[hsl(262,83%,58%)]" : "bg-gray-500"
              }`} />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${task.status === "done" ? "line-through text-gray-500" : ""}`}>
                  {task.title}
                </div>
                {task.project && (
                  <div className="text-[10px] text-gray-500 mt-0.5">{task.project.title}</div>
                )}
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${statusColors[task.status]}`}>
                {task.status.replace("_", " ")}
              </span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize hidden sm:block ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>
              {task.dueDate && (
                <span className="text-[10px] text-gray-500 flex items-center gap-1 hidden sm:flex">
                  <Calendar className="w-3 h-3" />
                  {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <LayoutList className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
          <p className="text-sm text-gray-400 max-w-md">
            {filter === "active" ? "You're all caught up! No active tasks assigned to you." :
             filter === "overdue" ? "No overdue tasks. Great job staying on track!" :
             "No tasks match this filter."}
          </p>
        </div>
      )}
    </div>
  );
}
