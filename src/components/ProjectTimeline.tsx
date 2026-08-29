import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

interface Props {
  projectId: string;
}

const typeIcons: Record<string, string> = {
  project_created: "🎉",
  task_created: "📋",
  task_completed: "✅",
  task_assigned: "👤",
  task_status_changed: "🔄",
  comment_added: "💬",
  member_joined: "🤝",
  member_invited: "📧",
  member_removed: "👋",
  project_updated: "✏️",
  project_completed: "🏆",
};

export default function ProjectTimeline({ projectId }: Props) {
  const events = useQuery(api.activity.listByProject, { projectId: projectId as any, limit: 50 });

  if (!events) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: 'var(--nova-text-muted)' }}>
        No timeline events yet. Activity will appear here as your project progresses.
      </div>
    );
  }

  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-0 bottom-0 w-px" style={{ background: 'var(--nova-border)' }} />
      <div className="space-y-6">
        {events.map((event, i) => (
          <div key={event._id} className="relative animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
            <div className="absolute -left-5 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: 'var(--nova-surface)', border: '2px solid var(--nova-border)' }}>
              {typeIcons[event.type] || "📌"}
            </div>
            <div className="pl-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: 'rgba(13,148,136,0.08)', color: '#0d9488' }}>
                  {event.user?.name?.charAt(0) || "?"}
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--nova-text)' }}>{event.user?.name || "Someone"}</span>
                <span className="text-[10px]" style={{ color: 'var(--nova-text-muted)' }}>·</span>
                <span className="text-[10px]" style={{ color: 'var(--nova-text-muted)' }}>{formatDate(event.createdAt)}</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>{event.description}</p>
              {event.task && (
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--nova-surface-cool)', color: 'var(--nova-text-muted)' }}>
                  Task: {event.task.title}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
