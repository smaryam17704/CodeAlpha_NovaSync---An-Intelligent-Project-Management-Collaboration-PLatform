import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Check } from "lucide-react";

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
  const navigate = useNavigate();

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

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-gray-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-gray-300 rounded-lg text-xs font-medium hover:bg-white/8 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-1">
          {notifications.map((notification, i) => (
            <motion.div
              key={notification._id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => handleNotificationClick(notification)}
              className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-colors ${
                notification.read
                  ? "bg-transparent hover:bg-white/[0.02]"
                  : "bg-white/[0.03] hover:bg-white/[0.05] border border-white/5"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                notification.read ? "bg-white/5" : "bg-[hsl(192,100%,50%)]/10"
              }`}>
                {notification.fromUser?.image ? (
                  <img src={notification.fromUser.image} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="text-xs font-bold text-[hsl(192,100%,50%)]">
                    {notification.fromUser?.name?.charAt(0) || "?"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-medium text-[hsl(192,100%,50%)]">
                    {typeLabels[notification.type] || notification.type}
                  </span>
                  {!notification.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(192,100%,50%)]" />
                  )}
                </div>
                <p className="text-sm text-gray-300">{notification.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-600">{formatDate(notification.createdAt)}</span>
                  {notification.project && (
                    <span className="text-[10px] text-gray-600">· {notification.project.title}</span>
                  )}
                </div>
              </div>
              {!notification.read && (
                <button
                  onClick={(e) => { e.stopPropagation(); markRead({ notificationId: notification._id }); }}
                  className="text-gray-600 hover:text-gray-300 transition-colors shrink-0"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No notifications</h3>
          <p className="text-sm text-gray-400">You're all caught up! Notifications will appear here.</p>
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
