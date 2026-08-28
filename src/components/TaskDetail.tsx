import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { X, Calendar, User, MessageSquare, Clock, Send, Edit3, Trash2, Check } from "lucide-react";

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
  const taskActivity = useQuery(api.activity.listByTask, (taskId && projectId) ? { taskId: taskId as any, projectId: projectId as any } : "skip");

  const updateTask = useMutation(api.tasks.update);
  const updateStatus = useMutation(api.tasks.updateStatus);
  const assignTask = useMutation(api.tasks.assign);
  const deleteTask = useMutation(api.tasks.deleteTask);
  const createComment = useMutation(api.comments.create);
  const updateComment = useMutation(api.comments.update);
  const deleteComment = useMutation(api.comments.remove);

  const [commentText, setCommentText] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "discussion" | "activity">("details");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionSelectedIdx, setMentionSelectedIdx] = useState(0);
  const [selectedMentionIds, setSelectedMentionIds] = useState<string[]>([]);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Local editing state for details
  const [editTitle, setEditTitle] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string | null>(null);
  const [editPriority, setEditPriority] = useState<string | null>(null);
  const [editAssignee, setEditAssignee] = useState<string | null | undefined>(undefined);
  const [editDueDate, setEditDueDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete = task && (task.userRole === "owner" || task.userRole === "admin");
  const canEditAll = task && (task.userRole === "owner" || task.userRole === "admin");
  // Members can edit: status + description only. Owner/admin can edit all.

  // Initialize edit state when task loads
  const initEditState = useCallback(() => {
    if (task && editTitle === null) {
      setEditTitle(task.title);
      setEditDescription(task.description || "");
      setEditStatus(task.status);
      setEditPriority(task.priority);
      setEditAssignee(task.assigneeId || undefined);
      setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    }
  }, [task, editTitle]);

  // Initialize on first render
  if (task && editTitle === null) {
    initEditState();
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const markChanged = () => {
    setHasChanges(true);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!task) return;
    setSaving(true);
    try {
      // Members can only edit description. Owner/admin can edit all fields.
      if (canEditAll) {
        const dueDateMs = editDueDate ? new Date(editDueDate).getTime() : undefined;
        await updateTask({
          taskId: task._id,
          title: editTitle !== null ? editTitle : task.title,
          description: editDescription !== null ? editDescription : undefined,
          priority: editPriority !== null ? editPriority as any : undefined,
          dueDate: dueDateMs,
        });

        // Save assignee separately if changed
        if (editAssignee !== undefined && editAssignee !== (task.assigneeId || "")) {
          await assignTask({
            taskId: task._id,
            assigneeId: editAssignee ? (editAssignee as any) : undefined,
          });
        }
      } else {
        // Member: only send description
        await updateTask({
          taskId: task._id,
          description: editDescription !== null ? editDescription : undefined,
        });
      }

      // Save status separately if changed (allowed for both member and owner/admin)
      if (editStatus !== null && editStatus !== task.status) {
        await updateStatus({ taskId: task._id, status: editStatus as any });
      }

      setHasChanges(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      console.error("Failed to save task:", err);
      alert(err?.message || "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !taskId) return;
    try {
      await createComment({
        taskId: taskId as any,
        content: commentText,
        mentions: selectedMentionIds.length > 0 ? selectedMentionIds as any : undefined,
      });
    } catch (err: any) {
      alert(err?.message || "Failed to post comment");
      return;
    }
    setCommentText("");
    setSelectedMentionIds([]);
    setMentionQuery(null);
  };

  // Filter project members for @mention dropdown
  const filteredMentionMembers = mentionQuery !== null && members
    ? members.filter((m: any) => {
        const name = (m.user?.name || "").toLowerCase();
        return name.includes(mentionQuery.toLowerCase());
      })
    : [];

  const selectMention = (member: any) => {
    if (!member) return;
    const name = member.user?.name || "user";
    // Replace @query with @name in the comment text
    const regex = /@([\w\s]*?)$/;
    const newCommentText = commentText.replace(regex, `@${name} `);
    setCommentText(newCommentText);
    setMentionQuery(null);
    if (!selectedMentionIds.includes(member.userId)) {
      setSelectedMentionIds([...selectedMentionIds, member.userId]);
    }
    commentInputRef.current?.focus();
  };

  const handleUpdateComment = async (commentId: string) => {
    await updateComment({ commentId: commentId as any, content: editText });
    setEditingComment(null);
    setEditText("");
  };

  return (
    <div className="animate-fade-in" onClick={(e) => e.stopPropagation()}>
      {/* Back button + Save */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(`/app/projects/${projectId}`)}
          className="text-xs transition-colors hover:opacity-70"
          style={{ color: '#5e6278' }}
        >
          ← Back to project
        </button>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#16a34a' }}>
              <Check className="w-3 h-3" />
              Saved
            </span>
          )}
          {canDelete && (
            <button
              onClick={async () => {
                if (!confirm("Are you sure you want to delete this task? This cannot be undone.")) return;
                setDeleting(true);
                try {
                  await deleteTask({ taskId: task._id });
                  navigate(`/app/projects/${projectId}`);
                } catch (err) {
                  console.error("Failed to delete task:", err);
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              style={{ background: 'rgba(220,38,38,0.06)', color: '#dc2626' }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-white text-xs font-semibold rounded-lg transition-all hover:shadow-md disabled:opacity-50"
              style={{ background: '#0d9488' }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </div>

      {/* Task Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <input
              value={editTitle !== null ? editTitle : task.title}
              onChange={(e) => { setEditTitle(e.target.value); markChanged(); }}
              className="w-full text-xl font-extrabold bg-transparent border-none focus:outline-none focus:ring-0 p-0"
              style={{ color: '#1a1d2e' }}
              disabled={!canEditAll}
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
                value={editDescription !== null ? editDescription : (task.description || "")}
                onChange={(e) => { setEditDescription(e.target.value); markChanged(); }}
                className="w-full px-3 py-2.5 rounded-lg text-sm transition-colors resize-none min-h-[80px] leading-relaxed"
                style={{ background: 'var(--nova-surface-warm)', border: '1px solid var(--nova-border)', color: 'var(--nova-text)' }}
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
                value={editStatus !== null ? editStatus : task.status}
                onChange={(e) => { setEditStatus(e.target.value); markChanged(); }}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs focus:outline-none"
                style={{ background: 'var(--nova-surface-cool)', border: '1px solid var(--nova-border)', color: 'var(--nova-text)' }}
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
                value={editPriority !== null ? editPriority : task.priority}
                onChange={(e) => { setEditPriority(e.target.value); markChanged(); }}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs focus:outline-none"
                style={{ background: 'var(--nova-surface-cool)', border: '1px solid var(--nova-border)', color: 'var(--nova-text)' }}
                disabled={!canEditAll}
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
                value={editAssignee !== undefined ? (editAssignee || "") : (task.assigneeId || "")}
                onChange={(e) => { setEditAssignee(e.target.value || undefined); markChanged(); }}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs focus:outline-none"
                style={{ background: 'var(--nova-surface-cool)', border: '1px solid var(--nova-border)', color: 'var(--nova-text)' }}
                disabled={!canEditAll}
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
                value={editDueDate !== null ? editDueDate : (task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "")}
                onChange={(e) => { setEditDueDate(e.target.value); markChanged(); }}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs focus:outline-none"
                style={{ background: 'var(--nova-surface-cool)', border: '1px solid var(--nova-border)', color: 'var(--nova-text)' }}
                disabled={!canEditAll}
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

            {/* Mobile Save button */}
            <div className="sm:hidden pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="w-full px-4 py-2 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                style={{ background: '#0d9488' }}
              >
                {saving ? "Saving..." : saved ? "✓ Saved" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "discussion" && (
        <div className="space-y-4">
          {/* Comment Input with @mention dropdown */}
          <div className="relative">
            <div className="flex gap-2">
              <input
                ref={commentInputRef}
                value={commentText}
                onChange={(e) => {
                  const val = e.target.value;
                  setCommentText(val);
                  // Detect @mention trigger
                  const cursorPos = e.target.selectionStart || val.length;
                  const textBeforeCursor = val.slice(0, cursorPos);
                  const atMatch = textBeforeCursor.match(/@([\w\s]*?)$/);
                  if (atMatch) {
                    setMentionQuery(atMatch[1]);
                    setMentionSelectedIdx(0);
                  } else {
                    setMentionQuery(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (mentionQuery !== null && filteredMentionMembers.length > 0) {
                    if (e.key === "ArrowDown") { e.preventDefault(); setMentionSelectedIdx((i) => Math.min(i + 1, filteredMentionMembers.length - 1)); return; }
                    if (e.key === "ArrowUp") { e.preventDefault(); setMentionSelectedIdx((i) => Math.max(i - 1, 0)); return; }
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); selectMention(filteredMentionMembers[mentionSelectedIdx]); return; }
                    if (e.key === "Escape") { setMentionQuery(null); return; }
                  }
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); }
                }}
                className="flex-1 px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ background: 'var(--nova-surface-cool)', border: '1px solid var(--nova-border)', color: 'var(--nova-text)' }}
                placeholder="Add a comment... (use @name to mention)"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                className="px-3 py-2 rounded-lg transition-colors disabled:opacity-50"                        style={{ background: 'var(--nova-teal-bg)', color: 'var(--nova-teal)' }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {/* @mention dropdown */}
            {mentionQuery !== null && filteredMentionMembers.length > 0 && (
              <div className="absolute left-0 right-12 mt-1 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto animate-scale-in" style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)' }}>
                {filteredMentionMembers.map((m: any, idx: number) => (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => selectMention(m)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
                    style={{ background: idx === mentionSelectedIdx ? 'var(--nova-teal-bg)' : 'transparent', color: 'var(--nova-text)' }}
                    onMouseEnter={() => setMentionSelectedIdx(idx)}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: 'rgba(13,148,136,0.08)', color: '#0d9488' }}>
                      {m.user?.name?.charAt(0) || "?"}
                    </div>
                    <span className="font-medium">{m.user?.name || m.user?.email || "Unknown"}</span>
                    <span className="ml-auto capitalize" style={{ color: '#9da2b3' }}>{m.role}</span>
                  </button>
                ))}
              </div>
            )}
            {/* Selected mentions display */}
            {selectedMentionIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedMentionIds.map((mid) => {
                  const m = members?.find((mem: any) => mem.userId === mid);
                  return (
                    <span key={mid} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(13,148,136,0.08)', color: '#0d9488' }}>
                      @{m?.user?.name || "user"}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="space-y-3">
            {comments && comments.length > 0 ? (
              comments.map((comment) => {
                const isOwn = comment.author?._id === task?.creator?._id;
                return (
                <div key={comment._id} className="flex gap-2.5 animate-fade-in" style={{ flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: 'rgba(13,148,136,0.08)', color: '#0d9488' }}>
                    {comment.author?.name?.charAt(0) || "?"}
                  </div>
                  <div className="max-w-[80%]">
                    <div className="flex items-center gap-2 mb-1" style={{ flexDirection: isOwn ? 'row-reverse' : 'row' }}>
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
                        style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)', color: 'var(--nova-text)' }}
                      />
                      <button onClick={() => handleUpdateComment(comment._id)} className="text-xs font-medium" style={{ color: '#0d9488' }}>Save</button>
                    </div>
                  ) : (
                    <div className="rounded-xl px-3 py-2" style={{ background: isOwn ? 'var(--nova-teal-bg)' : 'var(--nova-surface-warm)', color: 'var(--nova-text-secondary)' }}>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--nova-text-secondary)' }}>
                        {renderMentionText(comment.content)}
                      </p>
                    </div>
                  )}
                </div>
                </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-sm" style={{ color: '#9da2b3' }}>
                No comments yet. Start the conversation.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="space-y-2">
          {taskActivity && taskActivity.length > 0 ? (
            taskActivity.map((event) => (
              <div key={event._id} className="flex items-start gap-3 p-3 rounded-lg animate-fade-in" style={{ background: '#ffffff', border: '1px solid #e8eaef' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: 'rgba(13,148,136,0.08)', color: '#0d9488' }}>
                  {event.user?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: '#1a1d2e' }}>{event.user?.name || 'Someone'}</span>
                    <span className="text-[10px]" style={{ color: '#9da2b3' }}>{formatTime(event.createdAt)}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#5e6278' }}>{event.description}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-sm" style={{ color: '#9da2b3' }}>
              No activity recorded for this task yet.
            </div>
          )}
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

function renderMentionText(text: string) {
  // Highlight @mentions in text
  const parts = text.split(/(@[\w\s]+?)(?=[\s,.;!?"]|$)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span key={i} className="font-semibold" style={{ color: '#0d9488', background: 'rgba(13,148,136,0.06)', padding: '0 4px', borderRadius: '4px' }}>
          {part}
        </span>
      );
    }
    return part;
  });
}
