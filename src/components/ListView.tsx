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

const statusColors: Record<string, { bg: string; color: string }> = {
  todo: { bg: '#f4f6f9', color: '#5e6278' },
  in_progress: { bg: 'rgba(13,148,136,0.06)', color: '#0d9488' },
  review: { bg: 'rgba(99,102,241,0.06)', color: '#6366f1' },
  done: { bg: 'rgba(22,163,74,0.06)', color: '#16a34a' },
};

const priorityLabels: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const priorityColors: Record<string, { bg: string; color: string }> = {
  urgent: { bg: 'rgba(220,38,38,0.06)', color: '#dc2626' },
  high: { bg: 'rgba(217,119,6,0.06)', color: '#d97706' },
  medium: { bg: '#f4f6f9', color: '#5e6278' },
  low: { bg: '#f4f6f9', color: '#9da2b3' },
};

export default function ListView({ projectId, tasks }: Props) {
  const navigate = useNavigate();
  const updateStatus = useMutation(api.tasks.updateStatus);

  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
  });

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e8eaef', background: '#ffffff' }}>
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid #e8eaef' }}>
            {["Task", "Status", "Assignee", "Priority", "Due Date"].map((label, i) => (
              <th
                key={label}
                className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${i >= 2 ? 'hidden ' + (i === 2 ? 'md' : i === 3 ? 'md' : 'lg') + ':table-cell' : i === 1 ? 'hidden sm:table-cell' : ''}`}
                style={{ color: '#9da2b3' }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map((task) => {
            const sc = statusColors[task.status] || statusColors.todo;
            const pc = priorityColors[task.priority] || priorityColors.medium;
            return (
              <tr
                key={task._id}
                onClick={() => navigate(`/app/projects/${projectId}/task/${task._id}`)}
                className="cursor-pointer transition-colors"
                style={{ borderBottom: '1px solid #f0f1f5' }}
              >
                <td className="px-4 py-3">
                  <div className="text-sm font-medium" style={{ color: '#1a1d2e' }}>{task.title}</div>
                  <div className="text-[10px] sm:hidden mt-0.5" style={{ color: '#9da2b3' }}>{statusLabels[task.status]}</div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <select
                    value={task.status}
                    onChange={(e) => { e.stopPropagation(); updateStatus({ taskId: task._id, status: e.target.value as any }); }}
                    className="text-[10px] font-medium px-2 py-1 rounded capitalize bg-transparent focus:outline-none"
                    style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.color}15` }}
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
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: 'rgba(13,148,136,0.08)', color: '#0d9488' }}>
                        {task.assignee.name?.charAt(0)}
                      </div>
                      <span className="text-xs" style={{ color: '#5e6278' }}>{task.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: '#9da2b3' }}>Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded capitalize" style={{ background: pc.bg, color: pc.color }}>
                    {priorityLabels[task.priority]}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {task.dueDate ? (
                    <span className="text-xs flex items-center gap-1" style={{ color: '#5e6278' }}>
                      <Calendar className="w-3 h-3" />
                      {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: '#d1d5db' }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
          {sortedTasks.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-sm" style={{ color: '#9da2b3' }}>
                No tasks yet. Create your first task to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
