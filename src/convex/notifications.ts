import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);

    return Promise.all(
      notifications.map(async (n) => {
        const fromUser = n.fromUserId ? await ctx.db.get(n.fromUserId) : null;
        const project = n.projectId ? await ctx.db.get(n.projectId) : null;
        const task = n.taskId ? await ctx.db.get(n.taskId) : null;
        return {
          ...n,
          fromUser: fromUser ? { name: fromUser.name, image: fromUser.image } : null,
          project: project ? { title: project.title } : null,
          task: task ? { title: task.title } : null,
        };
      })
    );
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
      .collect();
    return notifications.length;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== userId) throw new Error("Not your notification");
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});
