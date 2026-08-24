import { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
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
        <h1 className="text-2xl font-extrabold" style={{ color: '#1a1d2e' }}>Search</h1>
        <p className="text-sm mt-1" style={{ color: '#5e6278' }}>Search across projects, tasks, people, and comments</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9da2b3' }} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-colors"
          style={{ background: '#ffffff', border: '1px solid #e8eaef', color: '#1a1d2e' }}
          placeholder="Search projects, tasks, people..."
        />
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Projects */}
          {results.projects.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#9da2b3' }}>
                <FolderKanban className="w-3 h-3" />
                Projects ({results.projects.length})
              </h3>
              <div className="space-y-1">
                {results.projects.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => navigate(`/app/projects/${p._id}`)}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors"
                    style={{ background: '#ffffff' }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ background: `${p.color || '#0d9488'}10`, color: p.color || '#0d9488' }}>
                      {p.icon || p.title.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#1a1d2e' }}>{p.title}</div>
                      {p.description && <div className="text-[10px] line-clamp-1" style={{ color: '#9da2b3' }}>{p.description}</div>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {results.tasks.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#9da2b3' }}>
                <LayoutList className="w-3 h-3" />
                Tasks ({results.tasks.length})
              </h3>
              <div className="space-y-1">
                {results.tasks.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => navigate(`/app/projects/${t.projectId}/task/${t._id}`)}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors"
                    style={{ background: '#ffffff' }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{
                      background: t.status === "done" ? '#16a34a' : t.status === "in_progress" ? '#0d9488' : t.status === "review" ? '#6366f1' : '#9da2b3'
                    }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#1a1d2e' }}>{t.title}</div>
                      <div className="text-[10px]" style={{ color: '#9da2b3' }}>{t.projectTitle} · {t.status.replace("_", " ")}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* People */}
          {results.users.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#9da2b3' }}>
                <Users className="w-3 h-3" />
                People ({results.users.length})
              </h3>
              <div className="space-y-1">
                {results.users.map((u) => (
                  <div key={u._id} className="flex items-center gap-3 p-3 rounded-lg transition-colors" style={{ background: '#ffffff' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(13,148,136,0.08)', color: '#0d9488' }}>
                      {u.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#1a1d2e' }}>{u.name || "Unknown"}</div>
                      <div className="text-[10px]" style={{ color: '#9da2b3' }}>{u.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {results.comments.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#9da2b3' }}>
                <MessageSquare className="w-3 h-3" />
                Comments ({results.comments.length})
              </h3>
              <div className="space-y-1">
                {results.comments.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => navigate(`/app/projects/${c.projectId}/task/${c.taskId}`)}
                    className="w-full text-left p-3 rounded-lg transition-colors"
                    style={{ background: '#ffffff' }}
                  >
                    <div className="text-xs mb-1" style={{ color: '#9da2b3' }}>
                      {c.author?.name || "Someone"} · {c.projectTitle} · {c.taskTitle}
                    </div>
                    <div className="text-sm line-clamp-2" style={{ color: '#5e6278' }}>{c.content}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {results.projects.length === 0 && results.tasks.length === 0 && results.users.length === 0 && results.comments.length === 0 && (
            <div className="py-12 text-center text-sm" style={{ color: '#9da2b3' }}>
              No results found for "{debouncedQuery}"
            </div>
          )}
        </div>
      )}

      {query.length > 0 && query.length < 2 && (
        <p className="text-xs text-center" style={{ color: '#9da2b3' }}>Type at least 2 characters to search</p>
      )}
    </div>
  );
}
