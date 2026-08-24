import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  requireAuth,
  getProjectMember,
  createNotification,
  createActivity,
  requireProjectAdmin,
} from "./helpers";

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const member = await getProjectMember(ctx, args.projectId, userId);
    if (!member) return [];

    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return Promise.all(
      invitations.map(async (inv) => {
        const inviter = await ctx.db.get(inv.invitedBy);
        return {
          ...inv,
          inviter: inviter ? { name: inviter.name, email: inviter.email } : null,
        };
      })
    );
  },
});

export const listPendingForUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const user = await ctx.db.get(userId);
    if (!user) return [];

    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("inviteeEmail", user.email || ""))
      .collect();

    return invitations.filter((inv) => inv.status === "pending");
  },
});

export const createInvitation = mutation({
  args: {
    projectId: v.id("projects"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireProjectAdmin(ctx, args.projectId, userId);

    const existing = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("inviteeEmail", args.email))
      .collect();

    const activeInvitation = existing.find(
      (inv) => inv.projectId === args.projectId && inv.status === "pending"
    );
    if (activeInvitation) throw new Error("An invitation has already been sent to this email for this project.");

    // Check if user exists
    const invitee = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    // Check if already a member
    if (invitee) {
      const existingMember = await getProjectMember(ctx, args.projectId, invitee._id);
      if (existingMember) throw new Error("This user is already a member of the project.");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const now = Date.now();
    const invitationId = await ctx.db.insert("invitations", {
      projectId: args.projectId,
      workspaceId: project.workspaceId,
      invitedBy: userId,
      inviteeEmail: args.email,
      inviteeId: invitee?._id,
      role: args.role,
      status: "pending",
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
    });

    await createActivity(ctx, {
      workspaceId: project.workspaceId,
      projectId: args.projectId,
      userId,
      type: "member_invited",
      description: `Invited ${args.email} to "${project.title}"`,
    });

    if (invitee) {
      await createNotification(ctx, {
        userId: invitee._id,
        type: "project_invitation",
        title: "Project invitation",
        message: `You've been invited to "${project.title}"`,
        projectId: args.projectId,
        fromUserId: userId,
      });
    }

    return invitationId;
  },
});

export const acceptInvitation = mutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");
    if (invitation.status !== "pending") throw new Error("Invitation already processed");
    if (Date.now() > invitation.expiresAt) {
      await ctx.db.patch(args.invitationId, { status: "expired" });
      throw new Error("Invitation has expired");
    }

    const user = await ctx.db.get(userId);
    if (!user || user.email !== invitation.inviteeEmail) {
      throw new Error("Invitation is not for this user");
    }

    // Add as project member
    const existingMember = await getProjectMember(ctx, invitation.projectId, userId);
    if (!existingMember) {
      await ctx.db.insert("projectMembers", {
        projectId: invitation.projectId,
        userId,
        role: invitation.role,
        joinedAt: Date.now(),
        invitedBy: invitation.invitedBy,
      });
    }

    await ctx.db.patch(args.invitationId, { status: "accepted", inviteeId: userId });

    const project = await ctx.db.get(invitation.projectId);
    if (project) {
      await createActivity(ctx, {
        workspaceId: invitation.workspaceId,
        projectId: invitation.projectId,
        userId,
        type: "member_joined",
        description: `Joined project "${project.title}"`,
      });
    }
  },
});

export const declineInvitation = mutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");
    if (invitation.status !== "pending") throw new Error("Invitation already processed");
    if (invitation.inviteeId !== userId && invitation.inviteeEmail !== (await ctx.db.get(userId))?.email) {
      throw new Error("Not your invitation");
    }
    await ctx.db.patch(args.invitationId, { status: "declined" });
  },
});
