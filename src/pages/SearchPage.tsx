import { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router";
import { Search, FolderKanban, LayoutList, Users, MessageSquare } from "lucide-react";

interface Props {
  activeWorkspace: string | null;
}

export default function SearchPage({ activeWorkspace }: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useQuery(
    api.search.globalSearch,
    activeWorkspace && debouncedQuery.length >= 2
      ? { workspaceId: activeWorkspace as any, query: debouncedQuery }
      : "skip"
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-sm text-gray-400 mt-1">Search across projects, tasks, people, and comments</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[hsl(192,100%,50%)]/50"
          placeholder="Search projects, tasks, people..."
        />
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Projects */}
          {results.projects.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FolderKanban className="w-3 h-3" />
                Projects ({results.projects.length})
              </h3>
              <div className="space-y-1">
                {results.projects.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => navigate(`/app/projects/${p._id}`)}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ background: `${p.color || "#00d4ff"}15`, color: p.color || "#00d4ff" }}>
                      {p.icon || p.title.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{p.title}</div>
                      {p.description && <div className="text-[10px] text-gray-500 line-clamp-1">{p.description}</div>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {results.tasks.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <LayoutList className="w-3 h-3" />
                Tasks ({results.tasks.length})
              </h3>
              <div className="space-y-1">
                {results.tasks.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => navigate(`/app/projects/${t.projectId}/task/${t._id}`)}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      t.status === "done" ? "bg-[hsl(142,71%,45%)]" :
                      t.status === "in_progress" ? "bg-[hsl(192,100%,50%)]" :
                      t.status === "review" ? "bg-[hsl(262,83%,58%)]" : "bg-gray-500"
                    }`} />
                    <div>
                      <div className="text-sm font-medium">{t.title}</div>
                      <div className="text-[10px] text-gray-500">{t.projectTitle} · {t.status.replace("_", " ")}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* People */}
          {results.users.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                People ({results.users.length})
              </h3>
              <div className="space-y-1">
                {results.users.map((u) => (
                  <div key={u._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(192,100%,50%)]/30 to-[hsl(262,83%,58%)]/30 flex items-center justify-center text-xs font-bold">
                      {u.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{u.name || "Unknown"}</div>
                      <div className="text-[10px] text-gray-500">{u.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {results.comments.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" />
                Comments ({results.comments.length})
              </h3>
              <div className="space-y-1">
                {results.comments.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => navigate(`/app/projects/${c.projectId}/task/${c.taskId}`)}
                    className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="text-xs text-gray-400 mb-1">
                      {c.author?.name || "Someone"} · {c.projectTitle} · {c.taskTitle}
                    </div>
                    <div className="text-sm text-gray-300 line-clamp-2">{c.content}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {results.projects.length === 0 && results.tasks.length === 0 && results.users.length === 0 && results.comments.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-500">
              No results found for "{debouncedQuery}"
            </div>
          )}
        </div>
      )}

      {query.length > 0 && query.length < 2 && (
        <p className="text-xs text-gray-500 text-center">Type at least 2 characters to search</p>
      )}
    </div>
  );
}
