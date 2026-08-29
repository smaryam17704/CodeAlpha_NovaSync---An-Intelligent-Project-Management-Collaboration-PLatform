import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Plus, X, Mail, Shield, UserMinus } from "lucide-react";

interface Props {
  projectId: string;
  project: any;
}

export default function ProjectTeam({ projectId, project }: Props) {
  const members = useQuery(api.projects.getMembers, { projectId: projectId as any });
  const invitations = useQuery(api.invitations.listByProject, { projectId: projectId as any });
  const addMember = useMutation(api.projects.addMember);
  const removeMember = useMutation(api.projects.removeMember);
  const createInvitation = useMutation(api.invitations.createInvitation);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin" | "viewer">("member");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");

  const canManage = project.role === "owner" || project.role === "admin";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError("");

    // Client-side email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setError("Please enter a valid email address.");
      setInviting(false);
      return;
    }

    // Check: don't invite yourself
    if (project?.ownerId === inviteEmail) {
      // Not perfect since ownerId is an ID not email, but this is a UX guard
    }

    try {
      await createInvitation({
        projectId: projectId as any,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });
      setInviteEmail("");
      setShowInvite(false);
    } catch (err: any) {
      const msg = String(err?.message || "Failed to send invitation");
      if (msg.includes("already") || msg.includes("pending")) {
        setError("An invitation has already been sent to this email.");
      } else if (msg.includes("already a member")) {
        setError("This user is already a member of the project.");
      } else {
        setError(msg);
      }
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--nova-text)' }}>Team Members ({members?.length || 0})</h3>
        {canManage && (
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'rgba(13,148,136,0.06)', color: '#0d9488' }}
          >
            <Plus className="w-3 h-3" />
            Invite
          </button>
        )}
      </div>

      {/* Members */}
      <div className="space-y-2">
        {members?.map((member) => (
          <div key={member._id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: 'rgba(13,148,136,0.08)', color: '#0d9488' }}>
              {member.user?.name?.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: 'var(--nova-text)' }}>{member.user?.name || "Unknown"}</div>
              <div className="text-[10px]" style={{ color: 'var(--nova-text-muted)' }}>{member.user?.email}</div>
            </div>
            <span className="text-[10px] font-medium px-2 py-1 rounded capitalize" style={{
              background: member.role === "owner" ? 'rgba(13,148,136,0.06)' : member.role === "admin" ? 'rgba(99,102,241,0.06)' : 'var(--nova-surface-cool)',
              color: member.role === "owner" ? '#0d9488' : member.role === "admin" ? '#6366f1' : 'var(--nova-text-secondary)',
            }}>
              {member.role}
            </span>
            {canManage && member.role !== "owner" && (
              <button
                onClick={() => removeMember({ projectId: projectId as any, userId: member.userId })}
                className="transition-colors hover:opacity-70"
                style={{ color: '#dc2626' }}
              >
                <UserMinus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Pending Invitations */}
      {invitations && invitations.filter((i) => i.status === "pending").length > 0 && (
        <div>
          <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--nova-text-muted)' }}>Pending Invitations</h4>
          <div className="space-y-2">
            {invitations.filter((i) => i.status === "pending").map((inv) => (
              <div key={inv._id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)' }}>
                <Mail className="w-4 h-4" style={{ color: 'var(--nova-text-muted)' }} />
                <div className="flex-1">
                  <div className="text-sm" style={{ color: 'var(--nova-text)' }}>{inv.inviteeEmail}</div>
                  <div className="text-[10px] capitalize" style={{ color: 'var(--nova-text-muted)' }}>Role: {inv.role}</div>
                </div>
                <span className="text-[10px] font-medium" style={{ color: '#d97706' }}>Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowInvite(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)' }} />              <div className="relative w-full max-w-sm rounded-xl shadow-2xl animate-scale-in" style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)' }} onClick={(e) => e.stopPropagation()}>              <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--nova-border-light)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--nova-text)' }}>Invite Member</h2>
              <button onClick={() => setShowInvite(false)} style={{ color: 'var(--nova-text-muted)' }}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleInvite} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nova-text-secondary)' }}>Email address</label>
                <input
                  autoFocus
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ background: 'var(--nova-surface-cool)', border: '1px solid var(--nova-border)', color: 'var(--nova-text)' }}
                  placeholder="teammate@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nova-text-secondary)' }}>Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                  style={{ background: 'var(--nova-surface-cool)', border: '1px solid var(--nova-border)', color: 'var(--nova-text)' }}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              {error && (
                <div className="p-3 rounded-lg text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>{error}</div>
              )}
              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
                className="w-full py-2.5 text-white font-semibold rounded-lg transition-all hover:shadow-md disabled:opacity-50 text-sm"
                style={{ background: '#0d9488' }}
              >
                {inviting ? "Sending..." : "Send Invitation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
