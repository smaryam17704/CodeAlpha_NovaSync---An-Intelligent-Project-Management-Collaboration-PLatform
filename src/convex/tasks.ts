import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  requireAuth,
  getProjectMember,
  createNotification,
  createActivity,
  canEditTask,
} from "./helpers";

export const list = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const member = await getProjectMember(ctx, args.projectId, userId);
    if (!member) return [];

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return Promise.all(
      tasks.map(async (task) => {
        const assignee = task.assigneeId ? await ctx.db.get(task.assigneeId) : null;
        const commentCount = (
          await ctx.db
            .query("comments")
            .withIndex("by_task", (q) => q.eq("taskId", task._id))
            .collect()
        ).length;
        return {
          ...task,
          assignee: assignee
            ? { name: assignee.name, email: assignee.email, image: assignee.image, _id: assignee._id }
            : null,
          commentCount,
        };
      })
    );
  },
});

export const get = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    const member = await getProjectMember(ctx, task.projectId, userId);
    if (!member) return null;

    const assignee = task.assigneeId ? await ctx.db.get(task.assigneeId) : null;
    const creator = await ctx.db.get(task.creatorId);
    const project = await ctx.db.get(task.projectId);

    return {
      ...task,
      assignee: assignee
        ? { _id: assignee._id, name: assignee.name, email: assignee.email, image: assignee.image }
        : null,
      creator: creator
        ? { _id: creator._id, name: creator.name, email: creator.email, image: creator.image }
        : null,
      project: project
        ? { _id: project._id, title: project.title, color: project.color, icon: project.icon }
        : null,
      userRole: member.role,
    };
  },
});

export const getByAssignee = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuth(ctx);
    if (args.userId !== currentUserId) throw new Error("Can only view own tasks");

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.userId))
      .collect();

    return Promise.all(
      tasks.map(async (task) => {
        const project = await ctx.db.get(task.projectId);
        return {
          ...task,
          project: project ? { _id: project._id, title: project.title, color: project.color } : null,
        };
      })
    );
  },
});

export const getByCreator = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuth(ctx);
    if (args.userId !== currentUserId) throw new Error("Can only view own tasks");

    const allTasks = await ctx.db.query("tasks").collect();
    const tasks = allTasks.filter((t) => t.creatorId === args.userId);

    return Promise.all(
      tasks.map(async (task) => {
        const project = await ctx.db.get(task.projectId);
        return {
          ...task,
          project: project ? { _id: project._id, title: project.title, color: project.color } : null,
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    status: v.optional(v.union(v.literal("todo"), v.literal("in_progress"), v.literal("review"), v.literal("done"))),
    priority: v.optional(v.union(v.literal("urgent"), v.literal("high"), v.literal("medium"), v.literal("low"))),
    assigneeId: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const member = await getProjectMember(ctx, args.projectId, userId);
    if (!member || member.role === "viewer") throw new Error("Insufficient permissions");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const maxOrder = existingTasks.reduce((max, t) => Math.max(max, t.order), 0);

    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      projectId: args.projectId,
      workspaceId: project.workspaceId,
      status: args.status || "todo",
      priority: args.priority || "medium",
      assigneeId: args.assigneeId,
      creatorId: userId,
      dueDate: args.dueDate,
      createdAt: now,
      updatedAt: now,
      order: maxOrder + 1,
    });

    await createActivity(ctx, {
      workspaceId: project.workspaceId,
      projectId: args.projectId,
      taskId,
      userId,
      type: "task_created",
      description: `Created task "${args.title}"`,
    });

    if (args.assigneeId && args.assigneeId !== userId) {
      await createNotification(ctx, {
        userId: args.assigneeId,
        type: "task_assigned",
        title: "Task assigned",
        message: `You've been assigned to "${args.title}"`,
        projectId: args.projectId,
        taskId,
        fromUserId: userId,
      });
    }

    return taskId;
  },
});

export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("urgent"), v.literal("high"), v.literal("medium"), v.literal("low"))),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const member = await getProjectMember(ctx, task.projectId, userId);
    if (!member || member.role === "viewer") throw new Error("Insufficient permissions");

    const project = await ctx.db.get(task.projectId);
    const updates: any = { updatedAt: Date.now() };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.priority !== undefined && args.priority !== task.priority) {
      updates.priority = args.priority;
      if (project) {
        await createActivity(ctx, {
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          taskId: args.taskId,
          userId,
          type: "task_priority_changed",
          description: `Changed priority of "${task.title}" to ${args.priority}`,
        });
      }
    }
    if (args.dueDate !== undefined) {
      updates.dueDate = args.dueDate;
      if (project && args.dueDate !== task.dueDate) {
        await createActivity(ctx, {
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          taskId: args.taskId,
          userId,
          type: "task_due_date_changed",
          description: `Changed due date of "${task.title}"`,
        });
      }
    }

    await ctx.db.patch(args.taskId, updates);
  },
});

export const updateStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("review"), v.literal("done")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const member = await getProjectMember(ctx, task.projectId, userId);
    if (!member || member.role === "viewer") throw new Error("Insufficient permissions");

    const now = Date.now();
    const updates: any = { status: args.status, updatedAt: now };

    if (args.status === "done" && task.status !== "done") {
      updates.completedAt = now;
    } else if (args.status !== "done") {
      updates.completedAt = undefined;
    }

    await ctx.db.patch(args.taskId, updates);

    const project = await ctx.db.get(task.projectId);
    if (project) {
      const statusLabel =
        args.status === "todo"
          ? "To Do"
          : args.status === "in_progress"
          ? "In Progress"
          : args.status === "review"
          ? "Review"
          : "Done";

      await createActivity(ctx, {
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        taskId: args.taskId,
        userId,
        type: args.status === "done" ? "task_completed" : "task_status_changed",
        description: args.status === "done"
          ? `Completed task "${task.title}"`
          : `Moved "${task.title}" to ${statusLabel}`,
      });
    }

    if (task.assigneeId && task.assigneeId !== userId) {
      await createNotification(ctx, {
        userId: task.assigneeId,
        type: "task_status_changed",
        title: "Task status changed",
        message: `"${task.title}" status was changed`,
        projectId: task.projectId,
        taskId: args.taskId,
        fromUserId: userId,
      });
    }
  },
});

export const assign = mutation({
  args: {
    taskId: v.id("tasks"),
    assigneeId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const member = await getProjectMember(ctx, task.projectId, userId);
    if (!member || member.role === "viewer") throw new Error("Insufficient permissions");

    const previousAssigneeId = task.assigneeId;
    await ctx.db.patch(args.taskId, {
      assigneeId: args.assigneeId,
      updatedAt: Date.now(),
    });

    const project = await ctx.db.get(task.projectId);

    if (args.assigneeId && args.assigneeId !== previousAssigneeId) {
      const assignee = await ctx.db.get(args.assigneeId);
      if (project) {
        await createActivity(ctx, {
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          taskId: args.taskId,
          userId,
          type: previousAssigneeId ? "task_reassigned" : "task_assigned",
          description: previousAssigneeId
            ? `Reassigned "${task.title}" to ${assignee?.name || "user"}`
            : `Assigned "${task.title}" to ${assignee?.name || "user"}`,
        });
      }

      await createNotification(ctx, {
        userId: args.assigneeId,
        type: previousAssigneeId ? "task_reassigned" : "task_assigned",
        title: previousAssigneeId ? "Task reassigned" : "Task assigned",
        message: `You've been assigned to "${task.title}"`,
        projectId: task.projectId,
        taskId: args.taskId,
        fromUserId: userId,
      });

      if (previousAssigneeId && previousAssigneeId !== userId && previousAssigneeId !== args.assigneeId) {
        await createNotification(ctx, {
          userId: previousAssigneeId,
          type: "task_unassigned",
          title: "Task unassigned",
          message: `You've been unassigned from "${task.title}"`,
          projectId: task.projectId,
          taskId: args.taskId,
          fromUserId: userId,
        });
      }
    } else if (!args.assigneeId && previousAssigneeId) {
      if (project) {
        await createActivity(ctx, {
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          taskId: args.taskId,
          userId,
          type: "task_unassigned",
          description: `Unassigned "${task.title}"`,
        });
      }

      if (previousAssigneeId !== userId) {
        await createNotification(ctx, {
          userId: previousAssigneeId,
          type: "task_unassigned",
          title: "Task unassigned",
          message: `You've been unassigned from "${task.title}"`,
          projectId: task.projectId,
          taskId: args.taskId,
          fromUserId: userId,
        });
      }
    }
  },
});

export const move = mutation({
  args: {
    taskId: v.id("tasks"),
    newStatus: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("review"), v.literal("done")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const member = await getProjectMember(ctx, task.projectId, userId);
    if (!member || member.role === "viewer") throw new Error("Insufficient permissions");

    const now = Date.now();
    const updates: any = { status: args.newStatus, updatedAt: now };
    if (args.newStatus === "done" && task.status !== "done") {
      updates.completedAt = now;
    } else if (args.newStatus !== "done") {
      updates.completedAt = undefined;
    }

    await ctx.db.patch(args.taskId, updates);

    const statusLabel =
      args.newStatus === "todo"
        ? "To Do"
        : args.newStatus === "in_progress"
        ? "In Progress"
        : args.newStatus === "review"
        ? "Review"
        : "Done";

    await createActivity(ctx, {
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: args.taskId,
      userId,
      type: args.newStatus === "done" ? "task_completed" : "task_status_changed",
      description: args.newStatus === "done"
        ? `Completed task "${task.title}"`
        : `Moved "${task.title}" to ${statusLabel}`,
    });

    if (task.assigneeId && task.assigneeId !== userId) {
      await createNotification(ctx, {
        userId: task.assigneeId,
        type: "task_status_changed",
        title: "Task status changed",
        message: `"${task.title}" was moved to ${statusLabel}`,
        projectId: task.projectId,
        taskId: args.taskId,
        fromUserId: userId,
      });
    }
  },
});

export const reorder = mutation({
  args: {
    taskId: v.id("tasks"),
    newOrder: v.number(),
    newStatus: v.optional(v.union(v.literal("todo"), v.literal("in_progress"), v.literal("review"), v.literal("done"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const member = await getProjectMember(ctx, task.projectId, userId);
    if (!member || member.role === "viewer") throw new Error("Insufficient permissions");

    const updates: any = { order: args.newOrder, updatedAt: Date.now() };
    if (args.newStatus) updates.status = args.newStatus;
    await ctx.db.patch(args.taskId, updates);
  },
});
