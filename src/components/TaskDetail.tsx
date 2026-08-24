import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { motion } from "framer-motion";
import { X, Calendar, User, MessageSquare, Clock, Send, Edit3, Trash2 } from "lucide-react";

const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

const priorityOptions = [
  { value: "urgent", label: "Urgent", color: "text-[#dc2626]" },
  { value: "high", label: "High", color: "text-[#d97706]" },
  { value: "medium", label: "Medium", color: "text-[#5e6278]" },
  { value: "low", label: "Low", color: "text-[#9da2b3]" },
];

export default function TaskDetail() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const navigate = useNavigate();
  const task = useQuery(api.tasks.get, taskId ? { taskId: taskId as any } : "skip");
  const comments = useQuery(api.comments.list, taskId ? { taskId: taskId as any } : "skip");
  const members = useQuery(api.projects.getMembers, projectId ? { projectId: projectId as any } : "skip");

  const updateTask = useMutation(api.tasks.update);
  const updateStatus = useMutation(api.tasks.updateStatus);
  const assignTask = useMutation(api.tasks.assign);
  const createComment = useMutation(api.comments.create);
  const updateComment = useMutation(api.comments.update);
  const deleteComment = useMutation(api.comments.remove);

  const [commentText, setCommentText] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "discussion" | "activity">("details");

  if (!task) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleAddComment = async () => {
    if (!commentText.trim() || !taskId) return;
    await createComment({
      taskId: taskId as any,
      content: commentText,
    });
    setCommentText("");
  };

  const handleUpdateComment = async (commentId: string) => {
    await updateComment({ commentId: commentId as any, content: editText });
    setEditingComment(null);
    setEditText("");
  };

  return (
    <div className="animate-fade-in" onClick={(e) => e.stopPropagation()}>
      {/* Back button */}
      <button
        onClick={() => navigate(`/app/projects/${projectId}`)}
        className="text-xs mb-4 transition-colors hover:opacity-70"
        style={{ color: '#5e6278' }}
      >
        ← Back to project
      </button>

      {/* Task Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <input
              value={task.title}
              onChange={(e) => updateTask({ taskId: task._id, title: e.target.value })}
              className="w-full text-xl font-extrabold bg-transparent border-none focus:outline-none focus:ring-0 p-0"
              style={{ color: '#1a1d2e' }}
              disabled={task.userRole === "viewer"}
            />
          </div>
          <button
            onClick={() => navigate(`/app/projects/${projectId}`)}
            className="transition-colors shrink-0 hover:opacity-70"
            style={{ color: '#9da2b3' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid #e8eaef' }}>
        {(["details", "discussion", "activity"] as const).map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-2.5 text-xs font-medium capitalize border-b-2 transition-colors"
              style={{
                borderColor: active ? '#0d9488' : 'transparent',
                color: active ? '#0d9488' : '#9da2b3',
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {activeTab === "details" && (
        <div className="grid sm:grid-cols-[1fr_240px] gap-6">
          {/* Description */}
          <div className="space-y-6">
            <div>
              <label className="text-xs font-medium block mb-2" style={{ color: '#5e6278' }}>Description</label>
              <textarea
                value={task.description || ""}
                onChange={(e) => updateTask({ taskId: task._id, description: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm transition-colors resize-none min-h-[80px] leading-relaxed"
                style={{ background: '#f8f6f3', border: '1px solid #e8eaef', color: '#1a1d2e' }}
                placeholder="Add a description..."
                rows={Math.max(3, Math.ceil((task.description || "").length / 60))}
                disabled={task.userRole === "viewer"}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status */}
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider block mb-1.5" style={{ color: '#9da2b3' }}>Status</label>
              <select
                value={task.status}
                onChange={(e) => updateStatus({ taskId: task._id, status: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs focus:outline-none"
                style={{ background: '#f4f6f9', border: '1px solid #e8eaef', color: '#1a1d2e' }}
                disabled={task.userRole === "viewer"}
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider block mb-1.5" style={{ color: '#9da2b3' }}>Priority</label>
              <select
                value={task.priority}
                onChange={(e) => updateTask({ taskId: task._id, priority: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs focus:outline-none"
                style={{ background: '#f4f6f9', border: '1px solid #e8eaef', color: '#1a1d2e' }}
                disabled={task.userRole === "viewer"}
              >
                {priorityOptions.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider block mb-1.5" style={{ color: '#9da2b3' }}>Assignee</label>
              <select
                value={task.assigneeId || ""}
                onChange={(e) => assignTask({ taskId: task._id, assigneeId: e.target.value ? (e.target.value as any) : undefined })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs focus:outline-none"
                style={{ background: '#f4f6f9', border: '1px solid #e8eaef', color: '#1a1d2e' }}
                disabled={task.userRole === "viewer"}
              >
                <option value="">Unassigned</option>
                {members?.map((m) => (
                  <option key={m._id} value={m.userId}>{m.user?.name || m.user?.email}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider block mb-1.5" style={{ color: '#9da2b3' }}>Due Date</label>
              <input
                type="date"
                value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                onChange={(e) => updateTask({ taskId: task._id, dueDate: e.target.value ? new Date(e.target.value).getTime() : undefined })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs focus:outline-none"
                style={{ background: '#f4f6f9', border: '1px solid #e8eaef', color: '#1a1d2e' }}
                disabled={task.userRole === "viewer"}
              />
            </div>

            {/* Meta */}
            <div className="pt-3 space-y-2" style={{ borderTop: '1px solid #f0f1f5' }}>
              <div className="text-[10px]" style={{ color: '#9da2b3' }}>
                Created: {new Date(task.createdAt).toLocaleDateString()}
              </div>
              {task.completedAt && (
                <div className="text-[10px] font-medium" style={{ color: '#16a34a' }}>
                  Completed: {new Date(task.completedAt).toLocaleDateString()}
                </div>
              )}
              {task.creator && (
                <div className="text-[10px]" style={{ color: '#9da2b3' }}>
                  Created by: {task.creator.name}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "discussion" && (
        <div className="space-y-4">
          {/* Comment Input */}
          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
              className="flex-1 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ background: '#f4f6f9', border: '1px solid #e8eaef', color: '#1a1d2e' }}
              placeholder="Add a comment... (use @name to mention)"
              disabled={task.userRole === "viewer"}
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              className="px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              style={{ background: 'rgba(13,148,136,0.08)', color: '#0d9488' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Comments */}
          <div className="space-y-3">
            {comments && comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment._id} className="p-3 rounded-lg" style={{ background: '#f8f6f3', border: '1px solid #e8eaef' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: 'rgba(13,148,136,0.08)', color: '#0d9488' }}>
                      {comment.author?.name?.charAt(0) || "?"}
                    </div>
                    <span className="text-xs font-medium" style={{ color: '#1a1d2e' }}>{comment.author?.name || "Unknown"}</span>
                    <span className="text-[10px]" style={{ color: '#9da2b3' }}>{formatTime(comment.createdAt)}</span>
                    {comment.editedAt && <span className="text-[10px]" style={{ color: '#d1d5db' }}>(edited)</span>}
                    {comment.canEdit && (
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          onClick={() => { setEditingComment(comment._id); setEditText(comment.content); }}
                          className="transition-colors hover:opacity-70"
                          style={{ color: '#9da2b3' }}
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteComment({ commentId: comment._id })}
                          className="transition-colors hover:opacity-70"
                          style={{ color: '#dc2626' }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  {editingComment === comment._id ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleUpdateComment(comment._id); if (e.key === "Escape") setEditingComment(null); }}
                        className="flex-1 px-2 py-1 rounded text-xs focus:outline-none"
                        style={{ background: '#ffffff', border: '1px solid #e8eaef', color: '#1a1d2e' }}
                      />
                      <button onClick={() => handleUpdateComment(comment._id)} className="text-xs font-medium" style={{ color: '#0d9488' }}>Save</button>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap" style={{ color: '#5e6278' }}>{comment.content}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm" style={{ color: '#9da2b3' }}>
                No comments yet. Start the conversation.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="py-8 text-center text-sm" style={{ color: '#9da2b3' }}>
          Task activity will appear here.
        </div>
      )}
    </div>
  );
}

function formatTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
