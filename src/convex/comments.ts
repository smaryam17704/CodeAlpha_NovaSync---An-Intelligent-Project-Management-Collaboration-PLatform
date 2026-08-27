import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  requireAuth,
  getProjectMember,
  createNotification,
  createActivity,
} from "./helpers";

/**
 * Extract @mentions from comment text by matching @Name patterns
 * against actual project member names.
 */
async function extractMentionsFromText(
  ctx: any,
  projectId: string,
  content: string,
  currentUserId: string
): Promise<{ valid: boolean; mentionedIds: string[]; error?: string }> {
  // Find all @word patterns in the content
  const mentionPatterns = content.match(/@([\w\s]+?)(?=[\s,.;!?"'()\]\[{}]|$)/g);
  if (!mentionPatterns || mentionPatterns.length === 0) {
    return { valid: true, mentionedIds: [] };
  }

  // Load all active project members
  const members = await ctx.db
    .query("projectMembers")
    .withIndex("by_project", (q: any) => q.eq("projectId", projectId as any))
    .collect();

  const memberUsers: { userId: string; name: string }[] = [];
  for (const m of members) {
    const user = await ctx.db.get(m.userId);
    if (user && "name" in user) {
      memberUsers.push({ userId: m.userId, name: (user as any).name || "" });
    }
  }

  const mentionedIds: string[] = [];
  for (const pattern of mentionPatterns) {
    const mentionedName = pattern.slice(1).trim().toLowerCase();
    if (!mentionedName) continue;

    const matchedMember = memberUsers.find(
      (m) => m.name.toLowerCase() === mentionedName ||
             m.name.toLowerCase().startsWith(mentionedName)
    );

    if (!matchedMember) {
      return {
        valid: false,
        mentionedIds: [] as string[],
        error: "You can mention only the team members.",
      };
    }

    if (!mentionedIds.includes(matchedMember.userId as string)) {
      mentionedIds.push(matchedMember.userId as string);
    }
  }

  return { valid: true, mentionedIds };
}

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
          canEdit: comment.authorId === userId,
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
    if (!member) throw new Error("Not a project member");
    // All project members including viewers can comment (communication only)

    // Validate @mentions in text content — reject if invalid @name patterns exist
    const textMentionCheck = await extractMentionsFromText(ctx, task.projectId, args.content, userId);
    if (!textMentionCheck.valid) {
      throw new Error(textMentionCheck.error);
    }

    // Merge text-extracted mentions with explicitly passed mentions
    const allMentionedIds = [...new Set([
      ...(args.mentions || []),
      ...textMentionCheck.mentionedIds,
    ])].filter((id) => id !== userId); // Don't notify yourself

    const now = Date.now();
    const commentId = await ctx.db.insert("comments", {
      taskId: args.taskId,
      projectId: task.projectId,
      authorId: userId,
      content: args.content,
      createdAt: now,
      mentions: allMentionedIds.length > 0 ? (allMentionedIds as any) : undefined,
    });

    await createActivity(ctx, {
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: args.taskId,
      userId,
      type: "comment_added",
      description: `Commented on "${task.title}"`,
    });

    // Send mention notifications
    for (const mentionedUserId of allMentionedIds) {
      const mentionedMember = await getProjectMember(ctx, task.projectId, mentionedUserId as any);
      if (mentionedMember && mentionedUserId !== userId) {
        const mentionedUser = await ctx.db.get(mentionedUserId as any);
        const authorUser = await ctx.db.get(userId);
        await createNotification(ctx, {
          userId: mentionedUserId as any,
          type: "comment_mention",
          title: "Mentioned in comment",
          message: `${authorUser?.name || "Someone"} mentioned you in "${task.title}"`,
          projectId: task.projectId,
          taskId: args.taskId,
          fromUserId: userId,
        });
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

    // STRICT: Only the comment author can edit. Role does not override ownership.
    if (comment.authorId !== userId) {
      throw new Error("You can only edit your own comments");
    }

    // Validate @mentions in edited content
    const textMentionCheck = await extractMentionsFromText(ctx, comment.projectId, args.content, userId);
    if (!textMentionCheck.valid) {
      throw new Error(textMentionCheck.error);
    }

    await ctx.db.patch(args.commentId, {
      content: args.content,
      editedAt: Date.now(),
    });

    const project = await ctx.db.get(comment.projectId);
    await createActivity(ctx, {
      workspaceId: project?.workspaceId || "",
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

    // STRICT: Only the comment author can delete. Role does not override ownership.
    if (comment.authorId !== userId) {
      throw new Error("You can only delete your own comments");
    }

    await ctx.db.delete(args.commentId);
  },
});
