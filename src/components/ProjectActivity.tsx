import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Props {
  projectId: string;
}

const typeColors: Record<string, string> = {
  project_created: "bg-[hsl(142,71%,45%)]",
  task_created: "bg-[hsl(192,100%,50%)]",
  task_completed: "bg-[hsl(142,71%,45%)]",
  task_assigned: "bg-[hsl(262,83%,58%)]",
  task_status_changed: "bg-[hsl(45,93%,47%)]",
  task_unassigned: "bg-[hsl(0,84%,60%)]",
  comment_added: "bg-[hsl(210,100%,56%)]",
  member_joined: "bg-[hsl(142,71%,45%)]",
  member_invited: "bg-[hsl(45,93%,47%)]",
  member_removed: "bg-[hsl(0,84%,60%)]",
};

export default function ProjectActivity({ projectId }: Props) {
  const events = useQuery(api.activity.listByProject, { projectId: projectId as any, limit: 50 });

  if (!events) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[hsl(192,100%,50%)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        No activity yet. Start working on tasks to see activity here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event._id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors">
          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${typeColors[event.type] || "bg-gray-500"}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-300">
              <span className="font-medium text-white">{event.user?.name || "Someone"}</span>{" "}
              {event.description}
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">{formatDate(event.createdAt)}</p>
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
