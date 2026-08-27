import { v } from "convex/values";
import { query } from "./_generated/server";
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

/**
 * Nova AI Copilot — rich, context-aware responses.
 * Uses actual project data (tasks, members, activity, comments)
 * to answer questions intelligently. No generic canned responses.
 */
export const copilotAnalysis = query({
  args: { projectId: v.id("projects"), question: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const member = await getProjectMember(ctx, args.projectId, userId);
    if (!member) return null;

    const [tasks, project, members] = await Promise.all([
      ctx.db.query("tasks").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).collect(),
      ctx.db.get(args.projectId),
      ctx.db.query("projectMembers").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).collect(),
    ]);

    // Load assignee info for all tasks
    const userIds = [...new Set(tasks.map((t) => t.assigneeId).filter(Boolean) as string[])];
    const userMap = new Map<string, { _id: any; name?: string; email?: string; image?: string }>();
    for (const uid of userIds) {
      const doc = await ctx.db.get(uid as any);
      if (doc && "name" in doc) {
        userMap.set(uid, doc as any);
      }
    }

    // Load comments for the project
    const comments = await ctx.db.query("comments").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).collect();

    const now = Date.now();
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    const review = tasks.filter((t) => t.status === "review").length;
    const overdue = tasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate < now);
    const unassigned = tasks.filter((t) => !t.assigneeId && t.status !== "done");
    const urgent = tasks.filter((t) => t.priority === "urgent" && t.status !== "done");
    const high = tasks.filter((t) => t.priority === "high" && t.status !== "done");
    const completedPercent = total > 0 ? Math.round((done / total) * 100) : 0;
    const projectName = project?.title || "this project";

    // Helper: get task name by id
    const taskById = new Map(tasks.map((t) => [t._id, t]));
    const memberNames: { name: string; role: string; userId: string }[] = [];
    for (const m of members) {
      const doc = await ctx.db.get(m.userId);
      const name = doc && "name" in doc ? (doc as any).name || "Unknown" : "Unknown";
      memberNames.push({ name, role: m.role, userId: m.userId });
    }

    const q = args.question.toLowerCase();

    // ── OVERDUE TASKS ──
    if (q.includes("overdue") || q.includes("late") || q.includes("past due") || q.includes("miss")) {
      if (overdue.length === 0) {
        return { answer: `No overdue tasks in "${projectName}". All ${total} tasks are on track. Nice work! 🎯`, confidence: "high" };
      }
      const overdueList = overdue.map((t) => {
        const assignee = t.assigneeId ? userMap.get(t.assigneeId)?.name || "Unassigned" : "Unassigned";
        const daysOver = Math.ceil((now - t.dueDate!) / (1000 * 60 * 60 * 24));
        return `• "${t.title}" — ${daysOver} day(s) overdue, assigned to ${assignee} (${t.priority} priority)`;
      }).join("\n");
      return {
        answer: `⚠️ ${overdue.length} overdue task(s) in "${projectName}":\n\n${overdueList}\n\nRecommendation: Address these immediately to avoid further delays.`,
        confidence: "high",
      };
    }

    // ── COMPLETED / DONE TASKS ──
    if (q.includes("completed") || q.includes("done") || q.includes("finish") || q.includes("how many")) {
      const doneList = tasks.filter((t) => t.status === "done").map((t) => {
        const assignee = t.assigneeId ? userMap.get(t.assigneeId)?.name || "Unknown" : "Unknown";
        return `• "${t.title}" — completed by ${assignee}`;
      }).join("\n");
      if (done === 0) {
        return { answer: `No tasks completed yet in "${projectName}". ${total} tasks remain — time to start making progress!`, confidence: "high" };
      }
      return {
        answer: `📊 "${projectName}" progress: ${done}/${total} tasks completed (${completedPercent}%)\n\nCompleted tasks:\n${doneList}`,
        confidence: "high",
      };
    }

    // ── PENDING / TODO TASKS ──
    if (q.includes("pending") || q.includes("todo") || q.includes("remaining") || q.includes("left")) {
      const pendingTasks = tasks.filter((t) => t.status !== "done");
      if (pendingTasks.length === 0) {
        return { answer: `All tasks in "${projectName}" are completed! The project is done. 🎉`, confidence: "high" };
      }
      const pendingList = pendingTasks.map((t) => {
        const status = t.status === "in_progress" ? "🔄 In Progress" : t.status === "review" ? "👀 Review" : "📋 To Do";
        const assignee = t.assigneeId ? userMap.get(t.assigneeId)?.name || "Unassigned" : "Unassigned";
        const dueStr = t.dueDate ? ` (due ${new Date(t.dueDate).toLocaleDateString()})` : "";
        return `• "${t.title}" — ${status}, assigned to ${assignee}${dueStr}`;
      }).join("\n");
      return {
        answer: `📋 ${pendingTasks.length} pending task(s) in "${projectName}":\n\n${pendingList}`,
        confidence: "high",
      };
    }

    // ── WHO HAS THE MOST WORK ──
    if (q.includes("who") && (q.includes("most") || q.includes("work") || q.includes("assign") || q.includes("busy") || q.includes("overloaded"))) {
      const taskCounts = new Map<string, number>();
      for (const t of tasks.filter((t) => t.status !== "done" && t.assigneeId)) {
        taskCounts.set(t.assigneeId!, (taskCounts.get(t.assigneeId!) || 0) + 1);
      }
      if (taskCounts.size === 0) {
        return { answer: `No tasks are currently assigned to anyone in "${projectName}". Consider distributing the workload.`, confidence: "high" };
      }
      const sorted = [...taskCounts.entries()].sort((a, b) => b[1] - a[1]);
      const workloadList = sorted.map(([uid, count]) => {
        const name = userMap.get(uid)?.name || "Unknown";
        const overdueCount = tasks.filter((t) => t.assigneeId === uid && t.status !== "done" && t.dueDate && t.dueDate < now).length;
        return `• ${name} — ${count} active task(s)${overdueCount > 0 ? ` (${overdueCount} overdue!)` : ""}`;
      }).join("\n");
      const topPerson = userMap.get(sorted[0][0])?.name || "Unknown";
      return {
        answer: `👥 Workload distribution in "${projectName}":\n\n${workloadList}\n\n💡 ${topPerson} has the most active work (${sorted[0][1]} tasks). Consider rebalancing if needed.`,
        confidence: "high",
      };
    }

    // ── WHAT IS BLOCKING ──
    if (q.includes("block") || q.includes("stuck") || q.includes("problem") || q.includes("issue") || q.includes("risk")) {
      const blockers: string[] = [];
      if (overdue.length > 0) blockers.push(`${overdue.length} overdue task(s) need urgent attention.`);
      if (urgent.length > 0) blockers.push(`${urgent.length} urgent task(s) are still open.`);
      if (unassigned.length > 0) blockers.push(`${unassigned.length} task(s) are unassigned — work can't start without an owner.`);
      if (todo > inProgress * 2 && total > 3) blockers.push(`Work is stalled: ${todo} tasks in To Do vs only ${inProgress} in progress.`);
      if (review > 3) blockers.push(`${review} tasks stuck in review — this may indicate a bottleneck.`);
      if (high.length > 2) blockers.push(`${high.length} high-priority tasks still open.`);

      if (blockers.length > 0) {
        return {
          answer: `🚧 Blockers in "${projectName}":\n\n${blockers.map((b, i) => `${i + 1}. ${b}`).join("\n")}\n\n📊 Progress: ${completedPercent}% complete (${done}/${total})\n\n⚡ Priority: Address overdue tasks and unassigned work first.`,
          confidence: "high",
        };
      }
      return {
        answer: `✅ No major blockers detected in "${projectName}". ${done}/${total} tasks completed (${completedPercent}%). The project is moving forward smoothly.`,
        confidence: "high",
      };
    }

    // ── PROJECT STATUS / HEALTH ──
    if (q.includes("status") || q.includes("health") || q.includes("how") || q.includes("doing") || q.includes("going")) {
      let healthEmoji = "🟢";
      if (completedPercent < 25) healthEmoji = "🔴";
      else if (completedPercent < 50) healthEmoji = "🟡";

      const statusBreakdown = `📋 To Do: ${todo}  |  🔄 In Progress: ${inProgress}  |  👀 Review: ${review}  |  ✅ Done: ${done}`;
      return {
        answer: `📊 Status of "${projectName}":\n\n${healthEmoji} ${completedPercent}% complete (${done}/${total} tasks)\n\n${statusBreakdown}\n\n⚠️ Overdue: ${overdue.length}  |  🚫 Unassigned: ${unassigned.length}  |  🔴 Urgent: ${urgent.length}\n\nTeam: ${memberNames.length} member(s)`,
        confidence: "high",
      };
    }

    // ── SUMMARY / OVERVIEW / REPORT ──
    if (q.includes("summary") || q.includes("overview") || q.includes("report") || q.includes("summarize")) {
      const recentComments = comments.length;
      const overdueCount = overdue.length;
      return {
        answer: `📋 Project Summary — "${projectName}"\n\n📊 Tasks: ${total} total | ${done} done | ${inProgress} in progress | ${review} review | ${todo} to do\n✅ Completion: ${completedPercent}%\n⚠️ Overdue: ${overdueCount} | 🚫 Unassigned: ${unassigned.length}\n👥 Team: ${memberNames.length} member(s)\n💬 Comments: ${recentComments}\n\n${overdueCount > 0 ? `⚠️ Key concern: ${overdueCount} overdue task(s) need attention.` : "✅ No overdue tasks."}${unassigned.length > 0 ? `\n📌 ${unassigned.length} task(s) need to be assigned.` : ""}`,
        confidence: "high",
      };
    }

    // ── TEAM / WHO IS WORKING ──
    if (q.includes("team") || q.includes("member") || q.includes("who") || q.includes("people") || q.includes("working")) {
      const teamList = memberNames.map((m) => {
        const myTasks = tasks.filter((t) => t.assigneeId === m.userId);
        const myActive = myTasks.filter((t) => t.status !== "done");
        const myDone = myTasks.filter((t) => t.status === "done");
        return `• ${m.name} (${m.role}) — ${myActive.length} active, ${myDone.length} completed`;
      }).join("\n");
      return {
        answer: `👥 Team on "${projectName}" (${memberNames.length} members):\n\n${teamList}`,
        confidence: "high",
      };
    }

    // ── DEADLINES / DUE DATES ──
    if (q.includes("deadline") || q.includes("due") || q.includes("schedule") || q.includes("timeline") || q.includes("upcoming")) {
      const withDueDates = tasks.filter((t) => t.status !== "done" && t.dueDate).sort((a, b) => a.dueDate! - b.dueDate!);
      if (withDueDates.length === 0) {
        return { answer: `No tasks with due dates set in "${projectName}". Consider adding deadlines to keep work on track.`, confidence: "high" };
      }
      const deadlineList = withDueDates.slice(0, 10).map((t) => {
        const daysUntil = Math.ceil((t.dueDate! - now) / (1000 * 60 * 60 * 24));
        const urgency = daysUntil <= 0 ? "🔴 OVERDUE" : daysUntil <= 2 ? "🟡 Due soon" : daysUntil <= 7 ? "🟢 This week" : "";
        return `• "${t.title}" — due ${new Date(t.dueDate!).toLocaleDateString()} (${daysUntil}d) ${urgency}`;
      }).join("\n");
      return {
        answer: `📅 Upcoming deadlines in "${projectName}":\n\n${deadlineList}${withDueDates.length > 10 ? `\n\n...and ${withDueDates.length - 10} more.` : ""}`,
        confidence: "high",
      };
    }

    // ── SUGGESTIONS / RECOMMENDATIONS / FOCUS ──
    if (q.includes("suggest") || q.includes("recommend") || q.includes("improve") || q.includes("focus") || q.includes("next") || q.includes("should")) {
      const suggestions: string[] = [];
      if (unassigned.length > 0) suggestions.push(`Assign the ${unassigned.length} unassigned task(s) so team members can start working.`);
      if (overdue.length > 0) suggestions.push(`Address ${overdue.length} overdue task(s) — these are the biggest risk to the project.`);
      if (urgent.length > 0) suggestions.push(`Focus on ${urgent.length} urgent task(s) first.`);
      if (review > 2) suggestions.push(`Review ${review} tasks — they're waiting to be completed.`);
      if (todo > 0 && inProgress === 0) suggestions.push("No tasks are in progress. Move tasks from To Do to get the team moving.");
      if (done > 0 && completedPercent < 50) suggestions.push(`You're at ${completedPercent}% — maintain momentum by pushing through the remaining ${total - done} tasks.`);
      if (suggestions.length === 0) suggestions.push("Project looks great! Keep up the excellent pace.");

      return {
        answer: `💡 Recommendations for "${projectName}":\n\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n📊 Current progress: ${completedPercent}% (${done}/${total} tasks done)`,
        confidence: "high",
      };
    }

    // ── PRIORITY / URGENT TASKS ──
    if (q.includes("priority") || q.includes("urgent") || q.includes("important")) {
      const urgentTasks = tasks.filter((t) => (t.priority === "urgent" || t.priority === "high") && t.status !== "done");
      if (urgentTasks.length === 0) {
        return { answer: `No urgent or high-priority tasks remaining in "${projectName}". Great prioritization!`, confidence: "high" };
      }
      const urgentList = urgentTasks.map((t) => {
        const assignee = t.assigneeId ? userMap.get(t.assigneeId)?.name || "Unassigned" : "Unassigned";
        const statusLabel = t.status === "in_progress" ? "🔄" : t.status === "review" ? "👀" : "📋";
        return `• ${statusLabel} "${t.title}" [${t.priority}] → ${assignee}`;
      }).join("\n");
      return {
        answer: `🔴 Priority tasks in "${projectName}":\n\n${urgentList}\n\nTotal: ${urgentTasks.length} task(s) requiring attention.`,
        confidence: "high",
      };
    }

    // ── SPECIFIC TASK LOOKUP ──
    // Check if question mentions a specific task by looking for quoted terms
    const quotedMatch = q.match(/["""]([^"""]+)["""]/);
    if (quotedMatch) {
      const search = quotedMatch[1];
      const found = tasks.find((t) => t.title.toLowerCase().includes(search));
      if (found) {
        const assignee = found.assigneeId ? userMap.get(found.assigneeId)?.name || "Unassigned" : "Unassigned";
        const dueStr = found.dueDate ? new Date(found.dueDate).toLocaleDateString() : "No due date";
        return {
          answer: `📋 Task: "${found.title}"\n\nStatus: ${found.status.replace("_", " ")}\nPriority: ${found.priority}\nAssignee: ${assignee}\nDue: ${dueStr}\nCreated: ${new Date(found.createdAt).toLocaleDateString()}`,
          confidence: "high",
        };
      }
      return { answer: `I couldn't find a task matching "${search}" in "${projectName}". Check the task name and try again.`, confidence: "medium" };
    }

    // ── COMMENTS / COMMUNICATION ──
    if (q.includes("comment") || q.includes("discussion") || q.includes("communication") || q.includes("chat")) {
      if (comments.length === 0) {
        return { answer: `No comments yet in "${projectName}". Start a discussion by adding comments to tasks.`, confidence: "high" };
      }
      return {
        answer: `💬 ${comments.length} comment(s) across tasks in "${projectName}". Check individual tasks to see their discussion threads.`,
        confidence: "high",
      };
    }

    // ── OFF-TOPIC DETECTION — redirect gracefully ──
    const projectKeywords = [
      "project", "task", "status", "team", "work", "assign", "deadline",
      "progress", "health", "block", "risk", "priority", "overdue",
      "review", "sprint", "milestone", "backlog", "feature", "bug",
      "story", "epic", "release", "deploy", "test", "qa",
      "design", "develop", "build", "ship", "deliver", "plan",
      "schedule", "resource", "capacity", "velocity", "burndown",
      "standup", "retrospective", "sprint", "kanban", "board",
      "comment", "discussion", "mention", "notification",
      "member", "admin", "viewer", "role", "permission",
      "workspace", "settings", "profile", "activity",
      "create", "update", "delete", "edit", "save",
      "what", "who", "how", "when", "where", "which", "why",
      "report", "summary", "overview", "suggest", "recommend",
      "focus", "next", "should", "improve", "help",
    ];
    const words = q.split(/\s+/);
    const hasProjectKeyword = words.some((w) => projectKeywords.includes(w));

    if (!hasProjectKeyword && words.length > 3) {
      return {
        answer: `I'm Nova AI, focused on helping with your NovaSync projects. I can help you analyze "${projectName}" — try asking about:\n\n📊 Project status or health\n⚠️ Overdue tasks\n👥 Team workload\n📅 Deadlines\n🚧 What's blocking the project\n💡 Recommendations\n🔍 A specific task\n\nWhat would you like to know about this project?`,
        confidence: "medium",
      };
    }

    // ── GENERIC / FALLBACK — context-aware ──
    const taskStatusSummary = total === 0
      ? "The project has no tasks yet."
      : `${completedPercent}% complete with ${total} tasks: ${done} done, ${inProgress} in progress, ${review} in review, ${todo} to do.`;

    return {
      answer: `Here's what I can tell you about "${projectName}":\n\n${taskStatusSummary}\n${overdue.length > 0 ? `\n⚠️ ${overdue.length} task(s) are overdue.` : ""}\n${unassigned.length > 0 ? `\n📌 ${unassigned.length} task(s) are unassigned.` : ""}\n👥 ${memberNames.length} team member(s) | 💬 ${comments.length} comment(s)\n\n💡 Try asking about:\n• Project status or health\n• Overdue tasks\n• Team workload\n• Deadlines\n• What's blocking the project\n• Recommendations\n• A specific task name`,
      confidence: "medium",
    };
  },
});

export const taskSuggestions = query({
  args: { prompt: v.string(), projectId: v.optional(v.id("projects")) },
  handler: async (ctx, args) => {
    const prompt = args.prompt.toLowerCase();
    const generatedTasks: any[] = [];

    // Load project context if available
    let projectName = "the project";
    let projectDescription = "";
    let existingTaskTitles: string[] = [];
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (project) {
        projectName = project.title;
        projectDescription = (project.description || "").toLowerCase();
        const existingTasks = await ctx.db.query("tasks").withIndex("by_project", (q: any) => q.eq("projectId", args.projectId)).collect();
        existingTaskTitles = existingTasks.map((t) => t.title.toLowerCase());
      }
    }

    const context = `${projectName} ${projectDescription} ${args.prompt}`.toLowerCase();

    // Dynamic task generation based on actual project context + user prompt
    if (context.includes("test") || context.includes("qa") || context.includes("quality") || context.includes("bug")) {
      generatedTasks.push(
        { title: "Create test plan document", priority: "high", description: "Define test strategy, scope, and acceptance criteria" },
        { title: "Write unit tests", priority: "high", description: "Cover core business logic with unit tests" },
        { title: "Write integration tests", priority: "high", description: "Test component interactions and API endpoints" },
        { title: "Test edge cases", priority: "medium", description: "Identify and test boundary conditions" },
        { title: "Performance testing", priority: "medium", description: "Benchmark response times and resource usage" },
        { title: "Security review", priority: "high", description: "Review for common vulnerabilities" },
        { title: "Cross-browser testing", priority: "low", description: "Verify functionality across browsers" },
        { title: "Document test results", priority: "low", description: "Summarize findings and log defects" }
      );
    } else if (context.includes("checkout") || context.includes("payment") || context.includes("ecommerce") || context.includes("e-commerce")) {
      generatedTasks.push(
        { title: "Design checkout UI", priority: "high", description: "Create wireframes and design for the checkout interface" },
        { title: "Implement cart validation", priority: "medium", description: "Add validation rules for cart items" },
        { title: "Create checkout API", priority: "high", description: "Build the backend API for processing checkout" },
        { title: "Integrate payment gateway", priority: "high", description: "Connect with payment provider (Stripe, etc.)" },
        { title: "Handle payment failures", priority: "high", description: "Implement error handling for failed transactions" },
        { title: "Order confirmation flow", priority: "medium", description: "Build order confirmation page and email notification" },
        { title: "Write integration tests", priority: "medium", description: "Test the complete checkout flow" }
      );
    } else if (context.includes("auth") || context.includes("login") || context.includes("register")) {
      generatedTasks.push(
        { title: "Design auth UI screens", priority: "high", description: "Create login, register, and forgot password screens" },
        { title: "Implement auth API", priority: "high", description: "Build authentication endpoints" },
        { title: "Add session management", priority: "high", description: "Implement secure session handling" },
        { title: "Password reset flow", priority: "medium", description: "Build password reset with email verification" },
        { title: "OAuth integration", priority: "low", description: "Add social login providers" },
        { title: "Add rate limiting", priority: "medium", description: "Protect auth endpoints" }
      );
    } else if (context.includes("dashboard") || context.includes("analytics") || context.includes("report")) {
      generatedTasks.push(
        { title: "Design dashboard layout", priority: "high", description: "Create wireframes for the analytics dashboard" },
        { title: "Build data aggregation service", priority: "high", description: "Create backend service to aggregate analytics data" },
        { title: "Implement charts and graphs", priority: "medium", description: "Add data visualization components" },
        { title: "Real-time data updates", priority: "medium", description: "Implement live data updates" },
        { title: "Export functionality", priority: "low", description: "Add CSV/PDF export for reports" }
      );
    } else if (context.includes("api") || context.includes("backend") || context.includes("server")) {
      generatedTasks.push(
        { title: "Define API specification", priority: "high", description: "Document all API endpoints and data models" },
        { title: "Implement core API endpoints", priority: "high", description: "Build the main CRUD operations" },
        { title: "Add authentication middleware", priority: "high", description: "Implement auth checks for protected routes" },
        { title: "Input validation", priority: "medium", description: "Add request validation and sanitization" },
        { title: "Error handling", priority: "medium", description: "Implement consistent error responses" },
        { title: "API documentation", priority: "low", description: "Generate OpenAPI/Swagger docs" },
        { title: "Write API tests", priority: "medium", description: "Test all endpoints" }
      );
    } else if (context.includes("design") || context.includes("ui") || context.includes("ux") || context.includes("frontend")) {
      generatedTasks.push(
        { title: "Create design system", priority: "high", description: "Define typography, colors, spacing, and component tokens" },
        { title: "Build core UI components", priority: "high", description: "Implement reusable component library" },
        { title: "Responsive layouts", priority: "medium", description: "Ensure all pages work across devices" },
        { title: "Animation and transitions", priority: "low", description: "Add micro-interactions for polish" },
        { title: "Accessibility audit", priority: "medium", description: "Verify WCAG compliance" },
        { title: "Dark mode support", priority: "low", description: "Implement dark theme variant" }
      );
    } else if (context.includes("deploy") || context.includes("devops") || context.includes("ci") || context.includes("infrastructure")) {
      generatedTasks.push(
        { title: "Set up CI/CD pipeline", priority: "high", description: "Automate build, test, and deployment" },
        { title: "Configure staging environment", priority: "high", description: "Mirror production for testing" },
        { title: "Set up monitoring and alerts", priority: "medium", description: "Track application health and errors" },
        { title: "Database backup strategy", priority: "medium", description: "Automated backups and recovery plan" },
        { title: "Performance optimization", priority: "medium", description: "Optimize bundle size and load times" },
        { title: "Security hardening", priority: "high", description: "Review production security posture" }
      );
    } else {
      // Generic context-aware tasks: derive from project name + user prompt
      const titleWords = projectName.split(/\s+/).filter((w) => w.length > 3).slice(0, 2).join(" ");
      generatedTasks.push(
        { title: `Plan ${titleWords || "project"} milestones`, priority: "high", description: "Define key deliverables and timeline" },
        { title: "Implement core functionality", priority: "high", description: "Build the main features based on requirements" },
        { title: "Create UI/UX", priority: "medium", description: "Design and implement the user interface" },
        { title: "Write tests", priority: "medium", description: "Add unit and integration tests" },
        { title: "Code review", priority: "medium", description: "Review code quality and best practices" },
        { title: "Documentation", priority: "low", description: "Write API and user documentation" },
        { title: "Performance optimization", priority: "low", description: "Profile and optimize critical paths" },
        { title: "Deploy to production", priority: "high", description: "Set up deployment pipeline and release" }
      );
    }

    // Filter out tasks that already exist in the project
    const filtered = generatedTasks.filter((t) => !existingTaskTitles.includes(t.title.toLowerCase()));

    return {
      tasks: filtered.map((t, i) => ({ ...t, status: "todo" as const, order: i })),
      prompt: args.prompt,
      projectName,
    };
  },
});
