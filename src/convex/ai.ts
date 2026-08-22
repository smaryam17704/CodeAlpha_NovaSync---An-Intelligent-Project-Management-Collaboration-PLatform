import { v } from "convex/values";
import { query, action } from "./_generated/server";
import { requireAuth, getProjectMember } from "./helpers";

export const projectHealth = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const member = await getProjectMember(ctx, args.projectId, userId);
    if (!member) return null;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    if (tasks.length === 0) {
      return {
        score: 50, status: "NO_DATA", label: "Getting Started",
        factors: [{ name: "Tasks", value: "No tasks created yet", impact: "neutral" }],
        recommendation: "Create tasks to start tracking project health.",
      };
    }

    const now = Date.now();
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const review = tasks.filter((t) => t.status === "review").length;
    const overdue = tasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate < now).length;
    const unassigned = tasks.filter((t) => !t.assigneeId && t.status !== "done").length;
    const urgent = tasks.filter((t) => t.priority === "urgent" && t.status !== "done").length;

    const completionRate = done / total;
    let score = 100;
    score -= (overdue / total) * 30;
    score -= (urgent / total) * 15;
    score += completionRate * 20;
    score -= (unassigned / total) * 10;
    if (inProgress === 0 && done === 0 && total > 2) score -= 10;
    score = Math.max(0, Math.min(100, Math.round(score)));

    const factors = [
      { name: "Completion", value: `${done}/${total} tasks (${Math.round(completionRate * 100)}%)`, impact: completionRate > 0.5 ? "positive" : completionRate > 0.2 ? "neutral" : "negative" },
      { name: "Overdue", value: `${overdue} overdue tasks`, impact: overdue === 0 ? "positive" : overdue < 3 ? "neutral" : "negative" },
      { name: "Unassigned", value: `${unassigned} unassigned active tasks`, impact: unassigned === 0 ? "positive" : unassigned < 3 ? "neutral" : "negative" },
      { name: "Work in Progress", value: `${inProgress} in progress, ${review} in review`, impact: inProgress > 0 ? "positive" : "neutral" },
    ];

    let status: string, label: string;
    if (score >= 80) { status = "HEALTHY"; label = "Healthy"; }
    else if (score >= 60) { status = "FAIR"; label = "Needs Attention"; }
    else if (score >= 40) { status = "AT_RISK"; label = "At Risk"; }
    else { status = "CRITICAL"; label = "Critical"; }

    const recommendations: string[] = [];
    if (overdue > 0) recommendations.push(`Address ${overdue} overdue task(s).`);
    if (unassigned > 0) recommendations.push(`Assign ${unassigned} unassigned task(s).`);
    if (urgent > 0) recommendations.push(`Prioritize ${urgent} urgent task(s).`);
    if (review > 2) recommendations.push(`Review ${review} tasks awaiting review.`);

    return {
      score, status, label, factors,
      recommendation: recommendations.length > 0 ? recommendations.join(" ") : "Project is on track. Keep up the good work!",
    };
  },
});

export const workload = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const member = await getProjectMember(ctx, args.projectId, userId);
    if (!member) return [];

    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const now = Date.now();
    return Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        const userTasks = tasks.filter((t) => t.assigneeId === m.userId);
        const activeTasks = userTasks.filter((t) => t.status !== "done");
        const overdueTasks = activeTasks.filter((t) => t.dueDate && t.dueDate < now);
        const urgentTasks = activeTasks.filter((t) => t.priority === "urgent" || t.priority === "high");
        const loadPercent = Math.min(100, Math.round((activeTasks.length / 8) * 100));
        let status: string;
        if (loadPercent > 100) status = "OVERLOADED";
        else if (loadPercent > 75) status = "HIGH";
        else if (loadPercent > 40) status = "MODERATE";
        else status = "LOW";

        return {
          userId: m.userId, name: user?.name || "Unknown", email: user?.email, image: user?.image,
          role: m.role, totalTasks: userTasks.length, activeTasks: activeTasks.length,
          completedTasks: userTasks.length - activeTasks.length,
          overdueTasks: overdueTasks.length, urgentTasks: urgentTasks.length,
          loadPercent, status,
        };
      })
    );
  },
});

export const deadlineRisk = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const member = await getProjectMember(ctx, args.projectId, userId);
    if (!member) return [];

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const now = Date.now();
    return tasks
      .filter((t) => t.status !== "done" && t.dueDate)
      .map((t) => {
        const daysUntilDue = Math.ceil((t.dueDate! - now) / (1000 * 60 * 60 * 24));
        const daysSinceCreated = Math.ceil((now - t.createdAt) / (1000 * 60 * 60 * 24));
        let riskLevel: string, reason: string, recommendation: string;

        if (t.status === "todo" && daysUntilDue <= 1) {
          riskLevel = "HIGH"; reason = "Still in To Do with <1 day remaining."; recommendation = "Start immediately or extend deadline.";
        } else if (t.status === "todo" && daysUntilDue <= 3) {
          riskLevel = "MEDIUM"; reason = "In To Do with <3 days remaining."; recommendation = "Begin soon.";
        } else if (t.status === "in_progress" && daysUntilDue <= 2) {
          riskLevel = "MEDIUM"; reason = "In progress but deadline approaching."; recommendation = "Focus or delegate.";
        } else if (daysUntilDue <= 0) {
          riskLevel = "HIGH"; reason = "Task is overdue."; recommendation = "Address urgently.";
        } else if (t.status === "todo" && daysSinceCreated > 7) {
          riskLevel = "MEDIUM"; reason = "In To Do for over a week."; recommendation = "Start or reassess.";
        } else if (daysUntilDue <= 3) {
          riskLevel = "LOW"; reason = "Deadline approaching."; recommendation = "Monitor.";
        } else { return null; }

        return { taskId: t._id, title: t.title, status: t.status, priority: t.priority, dueDate: t.dueDate, daysUntilDue, riskLevel, reason, recommendation };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a!.daysUntilDue - b!.daysUntilDue);
  },
});

// AI Copilot and Task Generator — implemented as client-side logic
// using the query data above. No cross-function action calls needed.
export const copilotAnalysis = query({
  args: { projectId: v.id("projects"), question: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const member = await getProjectMember(ctx, args.projectId, userId);
    if (!member) return null;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const project = await ctx.db.get(args.projectId);
    const now = Date.now();
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    const review = tasks.filter((t) => t.status === "review").length;
    const overdue = tasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate < now).length;
    const unassigned = tasks.filter((t) => !t.assigneeId && t.status !== "done").length;
    const urgent = tasks.filter((t) => t.priority === "urgent" && t.status !== "done").length;
    const completionPercent = total > 0 ? Math.round((done / total) * 100) : 0;

    const q = args.question.toLowerCase();

    if (q.includes("block") || q.includes("stuck") || q.includes("problem")) {
      const blockers: string[] = [];
      if (overdue > 0) blockers.push(`${overdue} overdue task(s) need attention.`);
      if (urgent > 0) blockers.push(`${urgent} urgent task(s) are not yet complete.`);
      if (unassigned > 0) blockers.push(`${unassigned} task(s) are unassigned.`);
      if (todo > inProgress * 2 && total > 3) blockers.push("More tasks in To Do than In Progress — work may be stalled.");
      if (review > 3) blockers.push(`${review} tasks awaiting review — bottleneck detected.`);

      return {
        answer: blockers.length > 0
          ? `Key blockers for "${project?.title}":\n\n${blockers.map((b, i) => `${i + 1}. ${b}`).join("\n")}\n\nHealth: ${completionPercent}% complete`
          : `No major blockers detected for "${project?.title}". ${done}/${total} tasks completed. Keep up the momentum!`,
        confidence: "high",
      };
    }

    if (q.includes("health") || q.includes("status") || q.includes("how")) {
      return {
        answer: `Project "${project?.title}"\n\n• Completion: ${done}/${total} (${completionPercent}%)\n• In Progress: ${inProgress}\n• Review: ${review}\n• To Do: ${todo}\n• Overdue: ${overdue}\n• Unassigned: ${unassigned}`,
        confidence: "high",
      };
    }

    if (q.includes("summary") || q.includes("overview") || q.includes("report")) {
      return {
        answer: `Summary — "${project?.title}":\n\n📊 Tasks: ${total} total\n✅ Done: ${done}\n🔄 In Progress: ${inProgress}\n👀 Review: ${review}\n📋 To Do: ${todo}\n⚠️ Overdue: ${overdue}\n\nCompletion: ${completionPercent}%`,
        confidence: "high",
      };
    }

    if (q.includes("suggest") || q.includes("recommend") || q.includes("improve")) {
      const suggestions: string[] = [];
      if (unassigned > 0) suggestions.push(`Assign the ${unassigned} unassigned task(s).`);
      if (overdue > 0) suggestions.push(`Address ${overdue} overdue task(s).`);
      if (review > 2) suggestions.push(`Review ${review} tasks awaiting review.`);
      if (urgent > 0) suggestions.push(`Focus on ${urgent} urgent task(s).`);
      if (todo > 0 && inProgress === 0) suggestions.push("Move tasks from To Do to In Progress.");

      return {
        answer: `Recommendations for "${project?.title}":\n\n${suggestions.length > 0 ? suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n") : "Project is healthy! Continue the current pace."}`,
        confidence: "high",
      };
    }

    return {
      answer: `Analyzed "${project?.title}": ${total} tasks, ${done} completed (${completionPercent}%). Ask about blockers, health, or recommendations.`,
      confidence: "medium",
    };
  },
});

export const taskSuggestions = query({
  args: { prompt: v.string() },
  handler: async (_ctx, args) => {
    const prompt = args.prompt.toLowerCase();
    const generatedTasks: any[] = [];

    if (prompt.includes("checkout") || prompt.includes("payment")) {
      generatedTasks.push(
        { title: "Design checkout UI", priority: "high", description: "Create wireframes and design for the checkout interface" },
        { title: "Implement cart validation", priority: "medium", description: "Add validation rules for cart items" },
        { title: "Create checkout API", priority: "high", description: "Build the backend API for processing checkout" },
        { title: "Integrate payment gateway", priority: "high", description: "Connect with payment provider (Stripe, etc.)" },
        { title: "Handle payment failures", priority: "high", description: "Implement error handling for failed transactions" },
        { title: "Order confirmation flow", priority: "medium", description: "Build order confirmation page and email notification" },
        { title: "Write integration tests", priority: "medium", description: "Test the complete checkout flow" }
      );
    } else if (prompt.includes("auth") || prompt.includes("login")) {
      generatedTasks.push(
        { title: "Design auth UI screens", priority: "high", description: "Create login, register, and forgot password screens" },
        { title: "Implement auth API", priority: "high", description: "Build authentication endpoints" },
        { title: "Add session management", priority: "high", description: "Implement secure session handling" },
        { title: "Password reset flow", priority: "medium", description: "Build password reset with email verification" },
        { title: "OAuth integration", priority: "low", description: "Add social login providers" },
        { title: "Add rate limiting", priority: "medium", description: "Protect auth endpoints" }
      );
    } else if (prompt.includes("dashboard") || prompt.includes("analytics")) {
      generatedTasks.push(
        { title: "Design dashboard layout", priority: "high", description: "Create wireframes for the analytics dashboard" },
        { title: "Build data aggregation service", priority: "high", description: "Create backend service to aggregate analytics data" },
        { title: "Implement charts and graphs", priority: "medium", description: "Add data visualization components" },
        { title: "Real-time data updates", priority: "medium", description: "Implement live data updates" },
        { title: "Export functionality", priority: "low", description: "Add CSV/PDF export for reports" }
      );
    } else {
      generatedTasks.push(
        { title: `Plan: ${args.prompt}`, priority: "high", description: "Research and plan the implementation" },
        { title: "Implement core functionality", priority: "high", description: "Build the main components" },
        { title: "Create UI/UX", priority: "medium", description: "Design and implement the user interface" },
        { title: "Write tests", priority: "medium", description: "Add unit and integration tests" },
        { title: "Documentation", priority: "low", description: "Write documentation" }
      );
    }

    return {
      tasks: generatedTasks.map((t, i) => ({ ...t, status: "todo" as const, order: i })),
      prompt: args.prompt,
    };
  },
});
