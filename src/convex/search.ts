import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuth, getWorkspaceMember } from "./helpers";

export const globalSearch = query({
  args: {
    workspaceId: v.id("workspaces"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const wsMember = await getWorkspaceMember(ctx, args.workspaceId, userId);
    if (!wsMember) return { projects: [], tasks: [], users: [], comments: [] };

    const q = args.query.toLowerCase().trim();
    if (q.length < 2) return { projects: [], tasks: [], users: [], comments: [] };

    // Search projects
    const allProjects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const projectMemberIds = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const accessibleProjectIds = new Set(projectMemberIds.map((pm) => pm.projectId));

    const matchedProjects = allProjects.filter(
      (p) =>
        accessibleProjectIds.has(p._id) &&
        (p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)))
    );

    // Search tasks across accessible projects
    const matchedTasks: any[] = [];
    for (const project of matchedProjects) {
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      for (const task of tasks) {
        if (task.title.toLowerCase().includes(q) || (task.description && task.description.toLowerCase().includes(q))) {
          matchedTasks.push({ ...task, projectTitle: project.title });
        }
      }
    }

    // Also search tasks in projects where member
    if (matchedTasks.length === 0) {
      for (const pm of projectMemberIds) {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", pm.projectId))
          .collect();
        for (const task of tasks) {
          if (task.title.toLowerCase().includes(q) || (task.description && task.description.toLowerCase().includes(q))) {
            const proj = await ctx.db.get(task.projectId);
            matchedTasks.push({ ...task, projectTitle: proj?.title || "" });
          }
        }
      }
    }

    // Search workspace members
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const matchedUsers: any[] = [];
    for (const m of members) {
      const user = await ctx.db.get(m.userId);
      if (
        user &&
        (user.name?.toLowerCase().includes(q) || user.email?.toLowerCase().includes(q))
      ) {
        matchedUsers.push({ _id: user._id, name: user.name, email: user.email, image: user.image });
      }
    }

    // Search comments in accessible projects
    const matchedComments: any[] = [];
    for (const project of matchedProjects.slice(0, 10)) {
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      for (const comment of comments) {
        if (comment.content.toLowerCase().includes(q)) {
          const author = await ctx.db.get(comment.authorId);
          const task = await ctx.db.get(comment.taskId);
          matchedComments.push({
            ...comment,
            author: author ? { name: author.name } : null,
            taskTitle: task?.title || "",
            projectTitle: project.title,
          });
        }
      }
    }

    return {
      projects: matchedProjects.slice(0, 10),
      tasks: matchedTasks.slice(0, 10),
      users: matchedUsers.slice(0, 10),
      comments: matchedComments.slice(0, 10),
    };
  },
});
