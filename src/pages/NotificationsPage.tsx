import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Check, Mail, X } from "lucide-react";

const typeLabels: Record<string, string> = {
  task_assigned: "Task Assigned",
  task_reassigned: "Task Reassigned",
  task_unassigned: "Task Unassigned",
  task_status_changed: "Status Changed",
  comment_added: "Comment Added",
  comment_mention: "Mention",
  project_invitation: "Project Invitation",
  member_added: "Member Added",
  member_removed: "Member Removed",
  activity: "Activity",
};

export default function NotificationsPage() {
  const notifications = useQuery(api.notifications.list);
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const acceptInvitation = useMutation(api.invitations.acceptInvitation);
  const declineInvitation = useMutation(api.invitations.declineInvitation);
  const pendingInvitations = useQuery(api.invitations.listPendingForUser);
  const navigate = useNavigate();

  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);

  // Build maps of projectId -> invitationId AND projectId -> workspaceId for pending invitations
  const pendingInvMap = new Map<string, string>();
  const pendingWsMap = new Map<string, string>();
  if (pendingInvitations) {
    for (const inv of pendingInvitations) {
      pendingInvMap.set(inv.projectId, inv._id);
      pendingWsMap.set(inv.projectId, inv.workspaceId);
    }
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markRead({ notificationId: notification._id });
    }
    if (notification.taskId && notification.projectId) {
      navigate(`/app/projects/${notification.projectId}/task/${notification.taskId}`);
    } else if (notification.projectId) {
      navigate(`/app/projects/${notification.projectId}`);
    }
  };

  const handleAcceptInvitation = async (notification: any) => {
    const invitationId = pendingInvMap.get(notification.projectId);
    if (!invitationId) return;
    setProcessingInvitation(invitationId);
    try {
      const result = await acceptInvitation({ invitationId: invitationId as any });
      await markRead({ notificationId: notification._id });

      // Switch the active workspace to the invitation's workspace so the project appears.
      // The project belongs to the owner's workspace, not necessarily the invited user's current workspace.
      // We must update localStorage and force a full page reload so AppShell re-mounts with the correct workspace.
      const invWorkspaceId = result?.workspaceId || pendingWsMap.get(notification.projectId);
      if (invWorkspaceId) {
        try {
          localStorage.setItem("novasync_active_workspace", invWorkspaceId);
        } catch {}
      }
      // Force a full page reload so AppShell re-initializes with the correct activeWorkspace from localStorage.
      window.location.href = "/app/projects";
    } catch (err) {
      console.error("Failed to accept invitation:", err);
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleDeclineInvitation = async (notification: any) => {
    const invitationId = pendingInvMap.get(notification.projectId);
    if (!invitationId) return;
    setProcessingInvitation(invitationId);
    try {
      await declineInvitation({ invitationId: invitationId as any });
      await markRead({ notificationId: notification._id });
    } catch (err) {
      console.error("Failed to decline invitation:", err);
    } finally {
      setProcessingInvitation(null);
    }
  };

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--nova-text)' }}>Notifications</h1>
          <p className="text-sm mt-1" style={{ color: '#5e6278' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)', color: 'var(--nova-text-secondary)' }}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-1">
          {notifications.map((notification, i) => {
            const isInvitation = notification.type === "project_invitation";
            const invitationId = isInvitation ? pendingInvMap.get(notification.projectId || "") : null;
            const hasPendingInvitation = !!invitationId;

            return (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="p-4 rounded-xl transition-colors"
                style={{
                  background: notification.read ? 'transparent' : 'rgba(13,148,136,0.02)',
                  border: notification.read ? '1px solid transparent' : '1px solid #e8eaef',
                }}
              >
                <div className="flex items-start gap-3">                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
                    style={{
                      background: notification.read ? 'var(--nova-surface-cool)' : 'var(--nova-teal-bg)',
                    }}
                    onClick={() => !isInvitation && handleNotificationClick(notification)}
                  >
                    {notification.fromUser?.image ? (
                      <img src={notification.fromUser.image} alt="" className="w-8 h-8 rounded-full" />
                    ) : isInvitation ? (
                      <Mail className="w-4 h-4" style={{ color: '#0d9488' }} />
                    ) : (
                      <div className="text-xs font-bold" style={{ color: '#0d9488' }}>
                        {notification.fromUser?.name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-medium" style={{ color: '#0d9488' }}>
                        {typeLabels[notification.type] || notification.type}
                      </span>
                      {!notification.read && (
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0d9488' }} />
                      )}
                    </div>
                    <p
                      className="text-sm cursor-pointer"
                      style={{ color: '#5e6278' }}
                      onClick={() => !isInvitation && handleNotificationClick(notification)}
                    >
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px]" style={{ color: '#9da2b3' }}>{formatDate(notification.createdAt)}</span>
                      {notification.project && (
                        <span
                          className="text-[10px] cursor-pointer hover:underline"
                          style={{ color: '#9da2b3' }}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          · {notification.project.title}
                        </span>
                      )}
                    </div>

                    {/* Invitation action buttons */}
                    {isInvitation && hasPendingInvitation && invitationId && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handleAcceptInvitation(notification)}
                          disabled={processingInvitation === invitationId}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all disabled:opacity-50"
                          style={{ background: '#0d9488' }}
                        >
                          {processingInvitation === invitationId ? "Processing..." : "Accept"}
                        </button>
                        <button
                          onClick={() => handleDeclineInvitation(notification)}
                          disabled={processingInvitation === invitationId}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          style={{ background: '#f4f6f9', color: '#5e6278', border: '1px solid #e8eaef' }}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                    {isInvitation && !hasPendingInvitation && !notification.read && (
                      <div className="mt-2">
                        <span className="text-[10px] font-medium" style={{ color: '#9da2b3' }}>
                          Invitation already processed
                        </span>
                      </div>
                    )}
                  </div>
                  {!notification.read && !isInvitation && (
                    <button
                      onClick={() => markRead({ notificationId: notification._id })}
                      className="transition-colors shrink-0 hover:opacity-70"
                      style={{ color: '#9da2b3' }}
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(13,148,136,0.06)' }}>
            <Bell className="w-8 h-8" style={{ color: '#9da2b3' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a1d2e' }}>No notifications</h3>
          <p className="text-sm" style={{ color: '#5e6278' }}>You're all caught up! Notifications will appear here.</p>
        </div>
      )}
    </div>
  );
}

function formatDate(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
