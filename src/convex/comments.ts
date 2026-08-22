import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  requireAuth,
  getProjectMember,
  createNotification,
  createActivity,
} from "./helpers";

export const list = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) return [];

    const member = await getProjectMember(ctx, task.projectId, userId);
    if (!member) return [];

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("asc")
      .collect();

    return Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author: author
            ? { _id: author._id, name: author.name, email: author.email, image: author.image }
            : null,
          canEdit: comment.authorId === userId || member.role === "owner" || member.role === "admin",
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    content: v.string(),
    mentions: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const member = await getProjectMember(ctx, task.projectId, userId);
    if (!member || member.role === "viewer") throw new Error("Insufficient permissions");

    const now = Date.now();
    const commentId = await ctx.db.insert("comments", {
      taskId: args.taskId,
      projectId: task.projectId,
      authorId: userId,
      content: args.content,
      createdAt: now,
      mentions: args.mentions,
    });

    await createActivity(ctx, {
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: args.taskId,
      userId,
      type: "comment_added",
      description: `Commented on "${task.title}"`,
    });

    if (args.mentions && args.mentions.length > 0) {
      for (const mentionedUserId of args.mentions) {
        if (mentionedUserId !== userId) {
          const mentionedUser = await ctx.db.get(mentionedUserId);
          await createNotification(ctx, {
            userId: mentionedUserId,
            type: "comment_mention",
            title: "Mentioned in comment",
            message: `${mentionedUser?.name || "Someone"} mentioned you in "${task.title}"`,
            projectId: task.projectId,
            taskId: args.taskId,
            fromUserId: userId,
          });
        }
      }
    }

    return commentId;
  },
});

export const update = mutation({
  args: {
    commentId: v.id("comments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    if (comment.authorId !== userId) {
      const member = await getProjectMember(ctx, comment.projectId, userId);
      if (!member || (member.role !== "owner" && member.role !== "admin")) {
        throw new Error("Can only edit own comments");
      }
    }

    await ctx.db.patch(args.commentId, {
      content: args.content,
      editedAt: Date.now(),
    });

    await createActivity(ctx, {
      workspaceId: (await ctx.db.get(comment.projectId))?.workspaceId || "",
      projectId: comment.projectId,
      taskId: comment.taskId,
      userId,
      type: "comment_edited",
      description: "Edited a comment",
    });
  },
});

export const remove = mutation({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    if (comment.authorId !== userId) {
      const member = await getProjectMember(ctx, comment.projectId, userId);
      if (!member || (member.role !== "owner" && member.role !== "admin")) {
        throw new Error("Can only delete own comments");
      }
    }

    await ctx.db.delete(args.commentId);
  },
});
