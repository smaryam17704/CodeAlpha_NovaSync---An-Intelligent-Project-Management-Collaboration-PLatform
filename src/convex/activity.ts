import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuth, getProjectMember, getWorkspaceMember } from "./helpers";

export const listByProject = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const member = await getProjectMember(ctx, args.projectId, userId);
    if (!member) return [];

    const events = await ctx.db
      .query("activityEvents")
      .withIndex("by_project_created", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(args.limit || 50);

    return Promise.all(
      events.map(async (e) => {
        const user = await ctx.db.get(e.userId);
        const task = e.taskId ? await ctx.db.get(e.taskId) : null;
        return {
          ...e,
          user: user ? { name: user.name, image: user.image } : null,
          task: task ? { title: task.title, status: task.status } : null,
        };
      })
    );
  },
});

export const listByTask = query({
  args: {
    taskId: v.id("tasks"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const member = await getProjectMember(ctx, args.projectId, userId);
    if (!member) return [];

    const events = await ctx.db
      .query("activityEvents")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("desc")
      .take(50);

    return Promise.all(
      events.map(async (e) => {
        const user = await ctx.db.get(e.userId);
        return {
          ...e,
          user: user ? { name: user.name, image: user.image } : null,
        };
      })
    );
  },
});

export const listByWorkspace = query({
  args: {
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const wsMember = await getWorkspaceMember(ctx, args.workspaceId, userId);
    if (!wsMember) return [];

    const events = await ctx.db
      .query("activityEvents")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(args.limit || 30);

    return Promise.all(
      events.map(async (e) => {
        const user = await ctx.db.get(e.userId);
        const project = await ctx.db.get(e.projectId);
        const task = e.taskId ? await ctx.db.get(e.taskId) : null;
        return {
          ...e,
          user: user ? { name: user.name, image: user.image } : null,
          project: project ? { title: project.title } : null,
          task: task ? { title: task.title } : null,
        };
      })
    );
  },
});
