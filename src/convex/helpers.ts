import { getAuthUserId } from "@convex-dev/auth/server";
export async function requireAuth(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function getWorkspaceMember(
  ctx: any,
  workspaceId: string,
  userId: string
) {
  return await ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspace_user", (q: any) =>
      q.eq("workspaceId", workspaceId as any).eq("userId", userId as any)
    )
    .first();
}

export async function getProjectMember(
  ctx: any,
  projectId: string,
  userId: string
) {
  return await ctx.db
    .query("projectMembers")
    .withIndex("by_project_user", (q: any) =>
      q.eq("projectId", projectId as any).eq("userId", userId as any)
    )
    .first();
}

export async function requireWorkspaceMember(
  ctx: any,
  workspaceId: string,
  userId: string
) {
  const member = await getWorkspaceMember(ctx, workspaceId, userId);
  if (!member) throw new Error("Not a workspace member");
  return member;
}

export async function requireProjectMember(
  ctx: any,
  projectId: string,
  userId: string
) {
  const member = await getProjectMember(ctx, projectId, userId);
  if (!member) throw new Error("Not a project member");
  return member;
}

export async function requireProjectAdmin(
  ctx: any,
  projectId: string,
  userId: string
) {
  const member = await requireProjectMember(ctx, projectId, userId);
  if (member.role === "viewer" || member.role === "member") {
    throw new Error("Insufficient permissions");
  }
  return member;
}

export async function requireWorkspaceAdmin(
  ctx: any,
  workspaceId: string,
  userId: string
) {
  const member = await requireWorkspaceMember(ctx, workspaceId, userId);
  if (member.role === "viewer") {
    throw new Error("Insufficient permissions");
  }
  return member;
}

export function canEditProject(role: string) {
  return role === "owner" || role === "admin";
}

export function canEditTask(role: string) {
  return role === "owner" || role === "admin" || role === "member";
}

export function canComment(role: string) {
  return role === "owner" || role === "admin" || role === "member";
}

export async function getUserById(ctx: any, userId: string) {
  return await ctx.db.get(userId as any);
}

export async function createNotification(
  ctx: any,
  params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    projectId?: string;
    taskId?: string;
    fromUserId?: string;
  }
) {
  return await ctx.db.insert("notifications", {
    userId: params.userId as any,
    type: params.type as any,
    title: params.title,
    message: params.message,
    projectId: params.projectId as any,
    taskId: params.taskId as any,
    fromUserId: params.fromUserId as any,
    read: false,
    createdAt: Date.now(),
  });
}

export async function createActivity(
  ctx: any,
  params: {
    workspaceId: string;
    projectId: string;
    taskId?: string;
    userId: string;
    type: string;
    description: string;
    metadata?: any;
  }
) {
  return await ctx.db.insert("activityEvents", {
    workspaceId: params.workspaceId as any,
    projectId: params.projectId as any,
    taskId: params.taskId as any,
    userId: params.userId as any,
    type: params.type as any,
    description: params.description,
    metadata: params.metadata,
    createdAt: Date.now(),
  });
}
