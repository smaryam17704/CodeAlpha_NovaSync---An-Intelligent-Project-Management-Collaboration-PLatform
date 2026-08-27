import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  requireAuth,
  getProjectMember,
  getWorkspaceMember,
  createNotification,
  createActivity,
  requireProjectAdmin,
} from "./helpers";

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const wsMember = await getWorkspaceMember(ctx, args.workspaceId, userId);
    if (!wsMember) return [];

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const results = await Promise.all(
      projects.map(async (project) => {
        const member = await getProjectMember(ctx, project._id, userId);
        if (!member) return null;

        const taskCount = await ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();

        const doneTasks = taskCount.filter((t) => t.status === "done").length;

        return {
          ...project,
          role: member.role,
          taskCount: taskCount.length,
          doneTasks,
          completionPercent: taskCount.length > 0 ? Math.round((doneTasks / taskCount.length) * 100) : 0,
        };
      })
    );

    return results.filter(Boolean);
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const member = await getProjectMember(ctx, args.projectId, userId);
    if (!member) return null;
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const memberDetails = await Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          ...m,
          user: user ? { name: user.name, email: user.email, image: user.image } : null,
        };
      })
    );

    return {
      ...project,
      role: member.role,
      taskCount: tasks.length,
      doneTasks: tasks.filter((t) => t.status === "done").length,
      inProgressTasks: tasks.filter((t) => t.status === "in_progress").length,
      reviewTasks: tasks.filter((t) => t.status === "review").length,
      todoTasks: tasks.filter((t) => t.status === "todo").length,
      members: memberDetails,
      completionPercent: tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100) : 0,
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    workspaceId: v.id("workspaces"),
    type: v.union(v.literal("personal"), v.literal("team")),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const wsMember = await getWorkspaceMember(ctx, args.workspaceId, userId);
    if (!wsMember || wsMember.role === "viewer") throw new Error("Insufficient permissions");

    const now = Date.now();
    const projectId = await ctx.db.insert("projects", {
      title: args.title,
      description: args.description,
      workspaceId: args.workspaceId,
      ownerId: userId,
      type: args.type,
      status: "active",
      icon: args.icon,
      color: args.color,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("projectMembers", {
      projectId,
      userId,
      role: "owner",
      joinedAt: now,
    });

    await createActivity(ctx, {
      workspaceId: args.workspaceId,
      projectId,
      userId,
      type: "project_created",
      description: `Created project "${args.title}"`,
    });

    return projectId;
  },
});

export const update = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("archived"), v.literal("completed"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const member = await getProjectMember(ctx, args.projectId, userId);
    if (!member) throw new Error("Not a project member");
    if (member.role === "viewer") throw new Error("Insufficient permissions");

    const updates: any = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.icon !== undefined) updates.icon = args.icon;
    if (args.color !== undefined) updates.color = args.color;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.projectId, updates);

    if (args.status === "completed") {
      const project = await ctx.db.get(args.projectId);
      if (project) {
        await createActivity(ctx, {
          workspaceId: project.workspaceId,
          projectId: args.projectId,
          userId,
          type: "project_completed",
          description: `Completed project "${args.title || project.title}"`,
        });
      }
    }
  },
});

export const getMembers = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const member = await getProjectMember(ctx, args.projectId, userId);
    if (!member) return [];

    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return Promise.all(
      members.map(async (m) => {
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
    projectId: v.id("projects"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuth(ctx);
    await requireProjectAdmin(ctx, args.projectId, currentUserId);

    const existing = await getProjectMember(ctx, args.projectId, args.userId);
    if (existing) throw new Error("User is already a member");

    const now = Date.now();
    await ctx.db.insert("projectMembers", {
      projectId: args.projectId,
      userId: args.userId,
      role: args.role,
      joinedAt: now,
      invitedBy: currentUserId,
    });

    const project = await ctx.db.get(args.projectId);
    if (project) {
      await createActivity(ctx, {
        workspaceId: project.workspaceId,
        projectId: args.projectId,
        userId: currentUserId,
        type: "member_joined",
        description: `Added a member to "${project.title}"`,
      });

      await createNotification(ctx, {
        userId: args.userId,
        type: "member_added",
        title: "Added to project",
        message: `You've been added to "${project.title}"`,
        projectId: args.projectId,
        fromUserId: currentUserId,
      });
    }
  },
});

export const removeMember = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuth(ctx);
    const adminMember = await requireProjectAdmin(ctx, args.projectId, currentUserId);

    const targetMembership = await getProjectMember(ctx, args.projectId, args.userId);
    if (!targetMembership) throw new Error("User is not a member");
    if (targetMembership.role === "owner") throw new Error("Cannot remove the project owner");

    await ctx.db.delete(targetMembership._id);

    const project = await ctx.db.get(args.projectId);
    if (project) {
      await createActivity(ctx, {
        workspaceId: project.workspaceId,
        projectId: args.projectId,
        userId: currentUserId,
        type: "member_removed",
        description: `Removed a member from "${project.title}"`,
      });

      // Notify the removed member
      if (args.userId !== currentUserId) {
        await createNotification(ctx, {
          userId: args.userId,
          type: "member_removed",
          title: "Removed from project",
          message: `You have been removed from "${project.title}"`,
          projectId: args.projectId,
          fromUserId: currentUserId,
        });
      }
    }
  },
});

export const convertToTeamProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const member = await getProjectMember(ctx, args.projectId, userId);
    if (!member) throw new Error("Not a project member");
    if (member.role !== "owner") throw new Error("Only the project owner can convert to a team project");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.type === "team") return { success: true, alreadyTeam: true };

    await ctx.db.patch(args.projectId, {
      type: "team",
      updatedAt: Date.now(),
    });

    await createActivity(ctx, {
      workspaceId: project.workspaceId,
      projectId: args.projectId,
      userId,
      type: "project_updated",
      description: `Converted "${project.title}" to a team project`,
    });

    return { success: true };
  },
});

export const getStats = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const member = await getProjectMember(ctx, args.projectId, userId);
    if (!member) return null;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const now = Date.now();
    const overdue = tasks.filter(
      (t) => t.status !== "done" && t.dueDate && t.dueDate < now
    ).length;
    const upcoming = tasks.filter(
      (t) => t.status !== "done" && t.dueDate && t.dueDate > now && t.dueDate < now + 7 * 24 * 60 * 60 * 1000
    ).length;

    const assigneeMap = new Map<string, number>();
    tasks.forEach((t) => {
      if (t.assigneeId) {
        const count = assigneeMap.get(t.assigneeId) || 0;
        assigneeMap.set(t.assigneeId, count + 1);
      }
    });

    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      review: tasks.filter((t) => t.status === "review").length,
      done: tasks.filter((t) => t.status === "done").length,
      overdue,
      upcoming,
      completionPercent: tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100) : 0,
      workload: Object.fromEntries(assigneeMap),
    };
  },
});
