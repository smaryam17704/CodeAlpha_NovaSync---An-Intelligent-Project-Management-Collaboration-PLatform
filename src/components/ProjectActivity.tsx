import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

interface Props {
  projectId: string;
}

const typeColors: Record<string, string> = {
  project_created: "#16a34a",
  task_created: "#0d9488",
  task_completed: "#16a34a",
  task_assigned: "#6366f1",
  task_status_changed: "#d97706",
  task_unassigned: "#dc2626",
  comment_added: "#2563eb",
  member_joined: "#16a34a",
  member_invited: "#d97706",
  member_removed: "#dc2626",
};

export default function ProjectActivity({ projectId }: Props) {
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
      <div className="py-12 text-center text-sm" style={{ color: '#9da2b3' }}>
        No activity yet. Start working on tasks to see activity here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event._id} className="flex items-start gap-3 p-3 rounded-lg transition-colors" style={{ background: '#ffffff', border: '1px solid #f0f1f5' }}>
          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: typeColors[event.type] || '#9da2b3' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm" style={{ color: '#5e6278' }}>
              <span className="font-medium" style={{ color: '#1a1d2e' }}>{event.user?.name || "Someone"}</span>{" "}
              {event.description}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: '#9da2b3' }}>{formatDate(event.createdAt)}</p>
          </div>
        </div>
      ))}
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
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
