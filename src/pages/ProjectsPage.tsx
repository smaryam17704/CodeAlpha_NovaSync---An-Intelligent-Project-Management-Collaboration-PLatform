import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { Plus, FolderKanban, Users, User, ArrowRight, X } from "lucide-react";

interface Props {
  activeWorkspace: string | null;
}

export default function ProjectsPage({ activeWorkspace }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(searchParams.get("create") === "true");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"personal" | "team">("personal");
  const [color, setColor] = useState("#00d4ff");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const projects = useQuery(
    api.projects.list,
    activeWorkspace ? { workspaceId: activeWorkspace as any } : "skip"
  );
  const createProject = useMutation(api.projects.create);

  useEffect(() => {
    if (searchParams.get("create") === "true") setShowCreate(true);
  }, [searchParams]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    setCreating(true);
    setError("");
    try {
      await createProject({
        title,
        description: description || undefined,
        workspaceId: activeWorkspace as any,
        type,
        color,
      });
      setTitle("");
      setDescription("");
      setShowCreate(false);
      setSearchParams({});
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const colors = ["#00d4ff", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-gray-400 mt-1">{projects?.length || 0} project(s)</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-[hsl(192,100%,50%)] text-[hsl(222,47%,8%)] px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Projects Grid */}
      {projects && projects.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, i) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/app/projects/${project._id}`}
                className="block p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ background: `${project.color || "#00d4ff"}15`, color: project.color || "#00d4ff" }}
                  >
                    {project.icon || project.title.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1">
                    {project.type === "team" ? (
                      <Users className="w-3.5 h-3.5 text-gray-500" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-gray-500" />
                    )}
                    <span className="text-[10px] text-gray-500 capitalize">{project.type}</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold mb-1 group-hover:text-[hsl(192,100%,50%)] transition-colors">{project.title}</h3>
                {project.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{project.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">{project.taskCount || 0} tasks</div>
                  <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[hsl(192,100%,50%)] to-[hsl(262,83%,58%)]"
                      style={{ width: `${project.completionPercent || 0}%` }}
                    />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <FolderKanban className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-sm text-gray-400 max-w-md mb-4">
            Create your first project and turn ideas into execution.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-[hsl(192,100%,50%)]/10 text-[hsl(192,100%,50%)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[hsl(192,100%,50%)]/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setShowCreate(false); setSearchParams({}); }}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full max-w-md bg-[hsl(222,40%,12%)] border border-white/10 rounded-xl shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-lg font-semibold">Create Project</h2>
              <button onClick={() => { setShowCreate(false); setSearchParams({}); }} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Project name</label>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[hsl(192,100%,50%)]/50"
                  placeholder="My new project"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[hsl(192,100%,50%)]/50 resize-none"
                  placeholder="Brief description..."
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Type</label>
                <div className="flex gap-2">
                  {(["personal", "team"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                        type === t
                          ? "bg-[hsl(192,100%,50%)]/10 border-[hsl(192,100%,50%)]/30 text-[hsl(192,100%,50%)]"
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/8"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Color</label>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-lg transition-transform ${color === c ? "scale-110 ring-2 ring-white/20" : ""}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              {error && (
                <div className="p-3 bg-[hsl(0,84%,60%)]/10 border border-[hsl(0,84%,60%)]/20 rounded-lg text-sm text-[hsl(0,84%,60%)]">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={creating || !title.trim()}
                className="w-full py-2.5 bg-[hsl(192,100%,50%)] text-[hsl(222,47%,8%)] font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
              >
                {creating ? "Creating..." : "Create Project"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
