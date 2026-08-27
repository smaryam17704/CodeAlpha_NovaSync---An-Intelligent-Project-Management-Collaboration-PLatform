import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Link, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { Plus, FolderKanban, Users, User, ArrowRight, X, Pencil, Check } from "lucide-react";

interface Props {
  activeWorkspace: string | null;
}

export default function ProjectsPage({ activeWorkspace }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(searchParams.get("create") === "true");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"personal" | "team">("personal");
  const [color, setColor] = useState("#0d9488");
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

  // Project editing state
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState("#0d9488");
  const [savingEdit, setSavingEdit] = useState(false);
  const updateProject = useMutation(api.projects.update);

  const colors = ["#0d9488", "#6366f1", "#16a34a", "#d97706", "#dc2626", "#c5a55a", "#8b5cf6", "#3b82f6", "#f59e0b", "#64748b"];

  const openEditModal = (project: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProject(project);
    setEditTitle(project.title);
    setEditDescription(project.description || "");
    setEditColor(project.color || "#0d9488");
  };

  const handleSaveEdit = async () => {
    if (!editingProject || !editTitle.trim()) return;
    setSavingEdit(true);
    try {
      await updateProject({
        projectId: editingProject._id,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        color: editColor,
      });
      setEditingProject(null);
    } catch (err) {
      console.error("Failed to update project:", err);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#1a1d2e' }}>Projects</h1>
          <p className="text-sm mt-1" style={{ color: '#9da2b3' }}>{projects?.length || 0} project(s)</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-md"
          style={{ background: '#0d9488' }}
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Projects Grid */}
      {projects && projects.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: any, i: number) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={`/app/projects/${project._id}`}
                className="block p-5 rounded-xl transition-all group hover:shadow-lg hover:shadow-black/[0.03] relative"
                style={{ background: '#ffffff', border: '1px solid #e8eaef' }}
              >
                {/* Edit button for owner */}
                {project.role === "owner" && (
                  <button
                    onClick={(e) => openEditModal(project, e)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                    style={{ background: '#f4f6f9', color: '#9da2b3' }}
                    title="Edit project"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ background: `${project.color || '#0d9488'}10`, color: project.color || '#0d9488' }}
                  >
                    {project.icon || project.title.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1">
                    {project.type === "team" ? (
                      <Users className="w-3.5 h-3.5" style={{ color: '#9da2b3' }} />
                    ) : (
                      <User className="w-3.5 h-3.5" style={{ color: '#9da2b3' }} />
                    )}
                    <span className="text-[10px] capitalize" style={{ color: '#9da2b3' }}>{project.type}</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold mb-1 group-hover:text-[#0d9488] transition-colors" style={{ color: '#1a1d2e' }}>{project.title}</h3>
                {project.description && (
                  <p className="text-xs line-clamp-2 mb-3" style={{ color: '#9da2b3' }}>{project.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-xs" style={{ color: '#9da2b3' }}>{project.taskCount || 0} tasks</div>
                  <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: '#e8eaef' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #0d9488, #6366f1)', width: `${project.completionPercent || 0}%` }}
                    />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(13,148,136,0.06)' }}>
            <FolderKanban className="w-8 h-8" style={{ color: '#9da2b3' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a1d2e' }}>No projects yet</h3>
          <p className="text-sm max-w-md mb-4" style={{ color: '#5e6278' }}>
            Create your first project and turn ideas into execution.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'rgba(13,148,136,0.06)', color: '#0d9488' }}
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setShowCreate(false); setSearchParams({}); }}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)' }} />
          <div
            className="relative w-full max-w-md rounded-xl shadow-2xl animate-scale-in"
            style={{ background: '#ffffff', border: '1px solid #e8eaef' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #f0f1f5' }}>
              <h2 className="text-lg font-semibold" style={{ color: '#1a1d2e' }}>Create Project</h2>
              <button onClick={() => { setShowCreate(false); setSearchParams({}); }} style={{ color: '#9da2b3' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#5e6278' }}>Project name</label>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ background: '#f4f6f9', border: '1px solid #e8eaef', color: '#1a1d2e' }}
                  placeholder="My new project"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#5e6278' }}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm transition-colors resize-none"
                  style={{ background: '#f4f6f9', border: '1px solid #e8eaef', color: '#1a1d2e' }}
                  placeholder="Brief description..."
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#5e6278' }}>Type</label>
                <div className="flex gap-2">
                  {(["personal", "team"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize"
                      style={{
                        background: type === t ? 'rgba(13,148,136,0.06)' : '#f4f6f9',
                        borderColor: type === t ? 'rgba(13,148,136,0.2)' : '#e8eaef',
                        color: type === t ? '#0d9488' : '#9da2b3',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#5e6278' }}>Color</label>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-lg transition-transform ${color === c ? "scale-110 ring-2 ring-offset-2" : ""}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              {error && (
                <div className="p-3 rounded-lg text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={creating || !title.trim()}
                className="w-full py-2.5 text-white font-semibold rounded-lg transition-all hover:shadow-md disabled:opacity-50 text-sm"
                style={{ background: '#0d9488' }}
              >
                {creating ? "Creating..." : "Create Project"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditingProject(null)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)' }} />
          <div className="relative w-full max-w-md rounded-xl shadow-2xl animate-scale-in" style={{ background: '#ffffff', border: '1px solid #e8eaef' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #f0f1f5' }}>
              <h2 className="text-lg font-semibold" style={{ color: '#1a1d2e' }}>Edit Project</h2>
              <button onClick={() => setEditingProject(null)} style={{ color: '#9da2b3' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#5e6278' }}>Project name</label>
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: '#f4f6f9', border: '1px solid #e8eaef', color: '#1a1d2e' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#5e6278' }}>Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                  style={{ background: '#f4f6f9', border: '1px solid #e8eaef', color: '#1a1d2e' }}
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#5e6278' }}>Color</label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-7 h-7 rounded-lg transition-transform ${editColor === c ? 'scale-110 ring-2 ring-offset-2' : ''}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit || !editTitle.trim()}
                className="w-full py-2.5 text-white font-semibold rounded-lg transition-all hover:shadow-md disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                style={{ background: '#0d9488' }}
              >
                {savingEdit ? "Saving..." : <><Check className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
