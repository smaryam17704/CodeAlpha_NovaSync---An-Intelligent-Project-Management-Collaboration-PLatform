import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageSquare, Calendar, GripVertical } from "lucide-react";

interface Props {
  projectId: string;
  tasks: any[];
}

const columns = [
  { id: "todo" as const, label: "To Do", color: "#9da2b3" },
  { id: "in_progress" as const, label: "In Progress", color: "#0d9488" },
  { id: "review" as const, label: "Review", color: "#6366f1" },
  { id: "done" as const, label: "Done", color: "#16a34a" },
];

const priorityColors: Record<string, { bg: string; color: string }> = {
  urgent: { bg: 'rgba(220,38,38,0.06)', color: '#dc2626' },
  high: { bg: 'rgba(217,119,6,0.06)', color: '#d97706' },
  medium: { bg: '#f4f6f9', color: '#5e6278' },
  low: { bg: '#f4f6f9', color: '#9da2b3' },
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
        const isDragOver = dragOverColumn === col.id;
        return (
          <div
            key={col.id}
            className="flex-shrink-0 w-72 sm:flex-1 sm:min-w-0 rounded-xl border transition-colors"
            style={{
              borderColor: isDragOver ? 'rgba(13,148,136,0.2)' : '#e8eaef',
              background: isDragOver ? 'rgba(13,148,136,0.02)' : '#f8f6f3',
            }}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(col.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #e8eaef' }}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5e6278' }}>{col.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#e8eaef', color: '#9da2b3' }}>{colTasks.length}</span>
              </div>
              <button
                onClick={() => setShowCreateInColumn(col.id)}
                className="transition-colors hover:opacity-70"
                style={{ color: '#9da2b3' }}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task Cards */}
            <div className="p-2 space-y-2 min-h-[100px]">
              <AnimatePresence>
                {colTasks.map((task) => {
                  const pc = priorityColors[task.priority] || priorityColors.medium;
                  return (
                    <motion.div
                      key={task._id}
                      layout
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      draggable
                      onDragStart={() => handleDragStart(task._id)}
                      onDragEnd={() => { setDraggedTask(null); setDragOverColumn(null); }}
                      className="p-3 rounded-lg cursor-pointer transition-all group"
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e8eaef',
                        opacity: draggedTask === task._id ? 0.5 : 1,
                        transform: draggedTask === task._id ? 'rotate(1.5deg)' : undefined,
                      }}
                      onClick={() => navigate(`/app/projects/${projectId}/task/${task._id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded capitalize" style={{ background: pc.bg, color: pc.color }}>
                          {task.priority}
                        </span>
                        <GripVertical className="w-3 h-3 transition-opacity" style={{ color: '#9da2b3' }} />
                      </div>
                      <h4 className="text-sm font-medium mb-2 leading-snug" style={{ color: '#1a1d2e' }}>{task.title}</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {task.assignee ? (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold" title={task.assignee.name} style={{ background: 'rgba(13,148,136,0.08)', color: '#0d9488' }}>
                              {task.assignee.name?.charAt(0) || "?"}
                            </div>
                          ) : null}
                          {task.commentCount > 0 && (
                            <div className="flex items-center gap-0.5 text-[10px]" style={{ color: '#9da2b3' }}>
                              <MessageSquare className="w-3 h-3" />
                              {task.commentCount}
                            </div>
                          )}
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-0.5 text-[10px]" style={{ color: '#9da2b3' }}>
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
                          className="w-full text-[10px] rounded px-2 py-1"
                          style={{ background: '#f4f6f9', border: '1px solid #e8eaef', color: '#5e6278' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {columns.map((c) => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Quick create */}
              {showCreateInColumn === col.id ? (
                <div className="p-2 rounded-lg" style={{ background: '#ffffff', border: '1px solid #e8eaef' }}>
                  <input
                    autoFocus
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateTask(col.id);
                      if (e.key === "Escape") { setShowCreateInColumn(null); setNewTaskTitle(""); }
                    }}
                    className="w-full px-2 py-1.5 bg-transparent text-sm focus:outline-none"
                    style={{ color: '#1a1d2e' }}
                    placeholder="Task title..."
                  />
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => handleCreateTask(col.id)}
                      className="px-2 py-1 rounded text-[10px] font-medium transition-colors"
                      style={{ background: 'rgba(13,148,136,0.08)', color: '#0d9488' }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setShowCreateInColumn(null); setNewTaskTitle(""); }}
                      className="px-2 py-1 text-[10px] transition-colors"
                      style={{ color: '#9da2b3' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateInColumn(col.id)}
                  className="w-full py-2 rounded-lg border border-dashed text-xs transition-colors"
                  style={{ borderColor: '#d1d5db', color: '#9da2b3' }}
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
