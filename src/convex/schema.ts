import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(v.union(v.literal("admin"), v.literal("user"), v.literal("member"))),
      bio: v.optional(v.string()),
      timezone: v.optional(v.string()),
      notificationPreferences: v.optional(
        v.object({
          emailNotifications: v.boolean(),
          taskAssigned: v.boolean(),
          taskCommented: v.boolean(),
          taskMentioned: v.boolean(),
          projectInvitation: v.boolean(),
        })
      ),
      lastActiveAt: v.optional(v.number()),
    }).index("email", ["email"]),

    workspaces: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      ownerId: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
      icon: v.optional(v.string()),
      color: v.optional(v.string()),
    }).index("by_owner", ["ownerId"]),

    workspaceMembers: defineTable({
      workspaceId: v.id("workspaces"),
      userId: v.id("users"),
      role: v.union(
        v.literal("owner"),
        v.literal("admin"),
        v.literal("member"),
        v.literal("viewer")
      ),
      joinedAt: v.number(),
      invitedBy: v.optional(v.id("users")),
    })
      .index("by_workspace", ["workspaceId"])
      .index("by_user", ["userId"])
      .index("by_workspace_user", ["workspaceId", "userId"]),

    projects: defineTable({
      title: v.string(),
      description: v.optional(v.string()),
      workspaceId: v.id("workspaces"),
      ownerId: v.id("users"),
      type: v.union(v.literal("personal"), v.literal("team")),
      status: v.union(v.literal("active"), v.literal("archived"), v.literal("completed")),
      icon: v.optional(v.string()),
      color: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_workspace", ["workspaceId"])
      .index("by_owner", ["ownerId"])
      .index("by_workspace_status", ["workspaceId", "status"]),

    projectMembers: defineTable({
      projectId: v.id("projects"),
      userId: v.id("users"),
      role: v.union(
        v.literal("owner"),
        v.literal("admin"),
        v.literal("member"),
        v.literal("viewer")
      ),
      joinedAt: v.number(),
      invitedBy: v.optional(v.id("users")),
    })
      .index("by_project", ["projectId"])
      .index("by_user", ["userId"])
      .index("by_project_user", ["projectId", "userId"]),

    invitations: defineTable({
      projectId: v.id("projects"),
      workspaceId: v.id("workspaces"),
      invitedBy: v.id("users"),
      inviteeEmail: v.string(),
      inviteeId: v.optional(v.id("users")),
      role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
      status: v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("declined"),
        v.literal("expired")
      ),
      createdAt: v.number(),
      expiresAt: v.number(),
    })
      .index("by_project", ["projectId"])
      .index("by_email", ["inviteeEmail"])
      .index("by_invitee", ["inviteeId"])
      .index("by_workspace", ["workspaceId"]),

    tasks: defineTable({
      title: v.string(),
      description: v.optional(v.string()),
      projectId: v.id("projects"),
      workspaceId: v.id("workspaces"),
      status: v.union(
        v.literal("todo"),
        v.literal("in_progress"),
        v.literal("review"),
        v.literal("done")
      ),
      priority: v.union(
        v.literal("urgent"),
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      ),
      assigneeId: v.optional(v.id("users")),
      creatorId: v.id("users"),
      dueDate: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
      completedAt: v.optional(v.number()),
      order: v.number(),
    })
      .index("by_project", ["projectId"])
      .index("by_assignee", ["assigneeId"])
      .index("by_workspace", ["workspaceId"])
      .index("by_project_status", ["projectId", "status"])
      .index("by_assignee_status", ["assigneeId", "status"])
      .index("by_due_date", ["dueDate"]),

    comments: defineTable({
      taskId: v.id("tasks"),
      projectId: v.id("projects"),
      authorId: v.id("users"),
      content: v.string(),
      editedAt: v.optional(v.number()),
      createdAt: v.number(),
      mentions: v.optional(v.array(v.id("users"))),
    })
      .index("by_task", ["taskId"])
      .index("by_project", ["projectId"])
      .index("by_author", ["authorId"]),

    notifications: defineTable({
      userId: v.id("users"),
      type: v.union(
        v.literal("task_assigned"),
        v.literal("task_reassigned"),
        v.literal("task_unassigned"),
        v.literal("task_status_changed"),
        v.literal("comment_added"),
        v.literal("comment_mention"),
        v.literal("project_invitation"),
        v.literal("member_added"),
        v.literal("member_removed"),
        v.literal("deadline_approaching"),
        v.literal("activity")
      ),
      title: v.string(),
      message: v.string(),
      projectId: v.optional(v.id("projects")),
      taskId: v.optional(v.id("tasks")),
      fromUserId: v.optional(v.id("users")),
      read: v.boolean(),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_read", ["userId", "read"])
      .index("by_user_created", ["userId", "createdAt"]),

    activityEvents: defineTable({
      workspaceId: v.id("workspaces"),
      projectId: v.id("projects"),
      taskId: v.optional(v.id("tasks")),
      userId: v.id("users"),
      type: v.union(
        v.literal("project_created"),
        v.literal("project_updated"),
        v.literal("member_invited"),
        v.literal("member_joined"),
        v.literal("member_removed"),
        v.literal("task_created"),
        v.literal("task_assigned"),
        v.literal("task_reassigned"),
        v.literal("task_unassigned"),
        v.literal("task_status_changed"),
        v.literal("task_completed"),
        v.literal("task_priority_changed"),
        v.literal("task_due_date_changed"),
        v.literal("comment_added"),
        v.literal("comment_edited"),
        v.literal("project_completed")
      ),
      description: v.string(),
      metadata: v.optional(v.any()),
      createdAt: v.number(),
    })
      .index("by_project", ["projectId"])
      .index("by_workspace", ["workspaceId"])
      .index("by_task", ["taskId"])
      .index("by_user", ["userId"])
      .index("by_project_created", ["projectId", "createdAt"]),
  },
  {
    schemaValidation: false,
  }
);

export default schema;
