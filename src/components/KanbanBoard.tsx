import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageSquare, Calendar, GripVertical } from "lucide-react";

interface Props {
  projectId: string;
  tasks: any[];
}

const columns = [
  { id: "todo" as const, label: "To Do", color: "hsl(220,20%,55%)" },
  { id: "in_progress" as const, label: "In Progress", color: "hsl(192,100%,50%)" },
  { id: "review" as const, label: "Review", color: "hsl(262,83%,58%)" },
  { id: "done" as const, label: "Done", color: "hsl(142,71%,45%)" },
];

const priorityColors: Record<string, string> = {
  urgent: "bg-[hsl(0,84%,60%)]/10 text-[hsl(0,84%,60%)]",
  high: "bg-[hsl(25,95%,53%)]/10 text-[hsl(25,95%,53%)]",
  medium: "bg-[hsl(192,100%,50%)]/10 text-[hsl(192,100%,50%)]",
  low: "bg-white/5 text-gray-400",
};

export default function KanbanBoard({ projectId, tasks }: Props) {
  const navigate = useNavigate();
  const moveTask = useMutation(api.tasks.move);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [showCreateInColumn, setShowCreateInColumn] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const createTask = useMutation(api.tasks.create);

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (columnId: string) => {
    if (draggedTask) {
      await moveTask({ taskId: draggedTask as any, newStatus: columnId as any });
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleCreateTask = async (status: string) => {
    if (!newTaskTitle.trim()) return;
    await createTask({
      title: newTaskTitle,
      projectId: projectId as any,
      status: status as any,
    });
    setNewTaskTitle("");
    setShowCreateInColumn(null);
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await moveTask({ taskId: taskId as any, newStatus: newStatus as any });
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        return (
          <div
            key={col.id}
            className={`flex-shrink-0 w-72 sm:flex-1 sm:min-w-0 rounded-xl border transition-colors ${
              dragOverColumn === col.id ? "border-[hsl(192,100%,50%)]/30 bg-[hsl(192,100%,50%)]/5" : "border-white/5 bg-white/[0.02]"
            }`}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(col.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                <span className="text-xs font-semibold uppercase tracking-wider">{col.label}</span>
                <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">{colTasks.length}</span>
              </div>
              <button
                onClick={() => setShowCreateInColumn(col.id)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task Cards */}
            <div className="p-2 space-y-2 min-h-[100px]">
              <AnimatePresence>
                {colTasks.map((task) => (
                  <motion.div
                    key={task._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    draggable
                    onDragStart={() => handleDragStart(task._id)}
                    onDragEnd={() => { setDraggedTask(null); setDragOverColumn(null); }}
                    className={`p-3 rounded-lg bg-white/5 border border-white/5 cursor-pointer hover:border-white/10 transition-all group ${
                      draggedTask === task._id ? "opacity-50 rotate-2" : ""
                    }`}
                    onClick={() => navigate(`/app/projects/${projectId}/task/${task._id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${priorityColors[task.priority] || priorityColors.medium}`}>
                        {task.priority}
                      </span>
                      <GripVertical className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h4 className="text-sm font-medium mb-2 leading-snug">{task.title}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {task.assignee ? (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[hsl(192,100%,50%)]/30 to-[hsl(262,83%,58%)]/30 flex items-center justify-center text-[8px] font-bold" title={task.assignee.name}>
                            {task.assignee.name?.charAt(0) || "?"}
                          </div>
                        ) : null}
                        {task.commentCount > 0 && (
                          <div className="flex items-center gap-0.5 text-[10px] text-gray-500">
                            <MessageSquare className="w-3 h-3" />
                            {task.commentCount}
                          </div>
                        )}
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-0.5 text-[10px] text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                      )}
                    </div>
                    {/* Mobile status changer */}
                    <div className="mt-2 sm:hidden">
                      <select
                        value={task.status}
                        onChange={(e) => { e.stopPropagation(); handleStatusChange(task._id, e.target.value); }}
                        className="w-full text-[10px] bg-white/5 border border-white/10 rounded px-2 py-1 text-gray-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {columns.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Quick create */}
              {showCreateInColumn === col.id ? (
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <input
                    autoFocus
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateTask(col.id);
                      if (e.key === "Escape") { setShowCreateInColumn(null); setNewTaskTitle(""); }
                    }}
                    className="w-full px-2 py-1.5 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                    placeholder="Task title..."
                  />
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => handleCreateTask(col.id)}
                      className="px-2 py-1 bg-[hsl(192,100%,50%)]/20 text-[hsl(192,100%,50%)] rounded text-[10px] font-medium hover:bg-[hsl(192,100%,50%)]/30"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setShowCreateInColumn(null); setNewTaskTitle(""); }}
                      className="px-2 py-1 text-gray-500 text-[10px] hover:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateInColumn(col.id)}
                  className="w-full py-2 rounded-lg border border-dashed border-white/5 text-xs text-gray-500 hover:border-white/10 hover:text-gray-400 transition-colors"
                >
                  + Add task
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
