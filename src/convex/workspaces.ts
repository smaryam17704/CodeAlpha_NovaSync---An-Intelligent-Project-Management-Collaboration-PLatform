import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  requireAuth,
  getWorkspaceMember,
  createNotification,
  createActivity,
} from "./helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const workspaces = await Promise.all(
      memberships.map(async (m) => {
        const ws = await ctx.db.get(m.workspaceId);
        return ws ? { ...ws, role: m.role, membershipId: m._id } : null;
      })
    );
    return workspaces.filter(Boolean);
  },
});

export const get = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const member = await getWorkspaceMember(ctx, args.workspaceId, userId);
    if (!member) return null;
    const ws = await ctx.db.get(args.workspaceId);
    return ws ? { ...ws, role: member.role } : null;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const now = Date.now();
    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      description: args.description,
      ownerId: userId,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId,
      role: "owner",
      joinedAt: now,
    });
    return workspaceId;
  },
});

export const update = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const member = await getWorkspaceMember(ctx, args.workspaceId, userId);
    if (!member || member.role === "viewer") throw new Error("Insufficient permissions");
    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    await ctx.db.patch(args.workspaceId, updates);
  },
});

export const getMembers = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const member = await getWorkspaceMember(ctx, args.workspaceId, userId);
    if (!member) return [];
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    return Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          ...m,
          user: user ? { name: user.name, email: user.email, image: user.image } : null,
        };
      })
    );
  },
});

export const addMember = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("member"),
      v.literal("viewer")
    ),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuth(ctx);
    const adminMember = await getWorkspaceMember(ctx, args.workspaceId, currentUserId);
    if (!adminMember || adminMember.role === "viewer" || adminMember.role === "member") {
      throw new Error("Insufficient permissions");
    }
    const existing = await getWorkspaceMember(ctx, args.workspaceId, args.userId);
    if (existing) throw new Error("User is already a member");
    const now = Date.now();
    await ctx.db.insert("workspaceMembers", {
      workspaceId: args.workspaceId,
      userId: args.userId,
      role: args.role,
      joinedAt: now,
      invitedBy: currentUserId,
    });
    const ws = await ctx.db.get(args.workspaceId);
    await createNotification(ctx, {
      userId: args.userId,
      type: "member_added",
      title: "Added to workspace",
      message: `You've been added to ${ws?.name || "a workspace"}`,
      projectId: undefined,
      fromUserId: currentUserId,
    });
  },
});

export const removeMember = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuth(ctx);
    const adminMember = await getWorkspaceMember(ctx, args.workspaceId, currentUserId);
    if (!adminMember || adminMember.role === "viewer" || adminMember.role === "member") {
      throw new Error("Insufficient permissions");
    }
    const targetMembership = await getWorkspaceMember(ctx, args.workspaceId, args.userId);
    if (!targetMembership) throw new Error("User is not a member");
    if (targetMembership.role === "owner") throw new Error("Cannot remove the workspace owner");
    await ctx.db.delete(targetMembership._id);
  },
});
