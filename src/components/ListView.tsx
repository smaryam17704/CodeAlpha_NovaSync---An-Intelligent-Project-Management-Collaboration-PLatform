import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useNavigate } from "react-router";
import { Calendar, ArrowUpDown } from "lucide-react";

interface Props {
  projectId: string;
  tasks: any[];
}

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

const statusColors: Record<string, string> = {
  todo: "bg-white/5 text-gray-400",
  in_progress: "bg-[hsl(192,100%,50%)]/10 text-[hsl(192,100%,50%)]",
  review: "bg-[hsl(262,83%,58%)]/10 text-[hsl(262,83%,58%)]",
  done: "bg-[hsl(142,71%,45%)]/10 text-[hsl(142,71%,45%)]",
};

const priorityLabels: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const priorityColors: Record<string, string> = {
  urgent: "bg-[hsl(0,84%,60%)]/10 text-[hsl(0,84%,60%)]",
  high: "bg-[hsl(25,95%,53%)]/10 text-[hsl(25,95%,53%)]",
  medium: "bg-white/5 text-gray-400",
  low: "bg-white/5 text-gray-500",
};

export default function ListView({ projectId, tasks }: Props) {
  const navigate = useNavigate();
  const updateStatus = useMutation(api.tasks.updateStatus);

  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
  });

  return (
    <div className="rounded-xl border border-white/5 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
            <th className="text-left px-4 py-3 font-medium">Task</th>
            <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Status</th>
            <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Assignee</th>
            <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Priority</th>
            <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Due Date</th>
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map((task) => (
            <tr
              key={task._id}
              onClick={() => navigate(`/app/projects/${projectId}/task/${task._id}`)}
              className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <div className="text-sm font-medium">{task.title}</div>
                <div className="text-[10px] text-gray-500 sm:hidden mt-0.5">{statusLabels[task.status]}</div>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <select
                  value={task.status}
                  onChange={(e) => { e.stopPropagation(); updateStatus({ taskId: task._id, status: e.target.value as any }); }}
                  className={`text-[10px] font-medium px-2 py-1 rounded capitalize ${statusColors[task.status]} bg-transparent border border-white/10 focus:outline-none`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                {task.assignee ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[hsl(192,100%,50%)]/30 to-[hsl(262,83%,58%)]/30 flex items-center justify-center text-[8px] font-bold">
                      {task.assignee.name?.charAt(0)}
                    </div>
                    <span className="text-xs text-gray-300">{task.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">Unassigned</span>
                )}
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${priorityColors[task.priority]}`}>
                  {priorityLabels[task.priority]}
                </span>
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                {task.dueDate ? (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                ) : (
                  <span className="text-xs text-gray-600">—</span>
                )}
              </td>
            </tr>
          ))}
          {sortedTasks.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                No tasks yet. Create your first task to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
