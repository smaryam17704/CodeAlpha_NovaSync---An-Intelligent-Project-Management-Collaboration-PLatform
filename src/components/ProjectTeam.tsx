import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
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
  const createInvitation = useMutation(api.invitations.create);

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
    try {
      await createInvitation({
        projectId: projectId as any,
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteEmail("");
      setShowInvite(false);
    } catch (err: any) {
      setError(err.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Team Members ({members?.length || 0})</h3>
        {canManage && (
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[hsl(192,100%,50%)]/10 text-[hsl(192,100%,50%)] rounded-lg text-xs font-medium hover:bg-[hsl(192,100%,50%)]/20 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Invite
          </button>
        )}
      </div>

      {/* Members */}
      <div className="space-y-2">
        {members?.map((member) => (
          <div key={member._id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(192,100%,50%)]/30 to-[hsl(262,83%,58%)]/30 flex items-center justify-center text-sm font-bold shrink-0">
              {member.user?.name?.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{member.user?.name || "Unknown"}</div>
              <div className="text-[10px] text-gray-500">{member.user?.email}</div>
            </div>
            <span className={`text-[10px] font-medium px-2 py-1 rounded capitalize ${
              member.role === "owner" ? "bg-[hsl(192,100%,50%)]/10 text-[hsl(192,100%,50%)]" :
              member.role === "admin" ? "bg-[hsl(262,83%,58%)]/10 text-[hsl(262,83%,58%)]" :
              "bg-white/5 text-gray-400"
            }`}>
              {member.role}
            </span>
            {canManage && member.role !== "owner" && (
              <button
                onClick={() => removeMember({ projectId: projectId as any, userId: member.userId })}
                className="text-gray-600 hover:text-[hsl(0,84%,60%)] transition-colors"
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
          <h4 className="text-xs font-medium text-gray-400 mb-2">Pending Invitations</h4>
          <div className="space-y-2">
            {invitations.filter((i) => i.status === "pending").map((inv) => (
              <div key={inv._id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <Mail className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm">{inv.inviteeEmail}</div>
                  <div className="text-[10px] text-gray-500 capitalize">Role: {inv.role}</div>
                </div>
                <span className="text-[10px] text-[hsl(45,93%,47%)]">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowInvite(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-sm bg-[hsl(222,40%,12%)] border border-white/10 rounded-xl shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-lg font-semibold">Invite Member</h2>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleInvite} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email address</label>
                <input
                  autoFocus
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[hsl(192,100%,50%)]/50"
                  placeholder="teammate@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              {error && (
                <div className="p-3 bg-[hsl(0,84%,60%)]/10 border border-[hsl(0,84%,60%)]/20 rounded-lg text-sm text-[hsl(0,84%,60%)]">{error}</div>
              )}
              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
                className="w-full py-2.5 bg-[hsl(192,100%,50%)] text-[hsl(222,47%,8%)] font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
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
