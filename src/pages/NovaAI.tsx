import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { Brain, Send, Plus, AlertTriangle, CheckCircle2, BarChart3, Users, Zap } from "lucide-react";

interface Props {
  activeWorkspace: string | null;
}

type AITab = "copilot" | "generator" | "health" | "workload" | "deadline";

export default function NovaAI({ activeWorkspace }: Props) {
  const [activeTab, setActiveTab] = useState<AITab>("copilot");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [taskPrompt, setTaskPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);

  const projects = useQuery(
    api.projects.list,
    activeWorkspace ? { workspaceId: activeWorkspace as any } : "skip"
  );

  const health = useQuery(
    api.ai.projectHealth,
    selectedProjectId ? { projectId: selectedProjectId as any } : "skip"
  );

  const workload = useQuery(
    api.ai.workload,
    selectedProjectId ? { projectId: selectedProjectId as any } : "skip"
  );

  const deadlineRisk = useQuery(
    api.ai.deadlineRisk,
    selectedProjectId ? { projectId: selectedProjectId as any } : "skip"
  );

  const copilot = useQuery(
    api.ai.copilotAnalysis,
    selectedProjectId && question ? { projectId: selectedProjectId as any, question } : "skip"
  );

  const taskSuggestions = useQuery(
    api.ai.taskSuggestions,
    taskPrompt ? { prompt: taskPrompt } : "skip"
  );

  const createTask = useMutation(api.tasks.create);

  const handleAsk = () => {
    if (!question.trim() || !selectedProjectId) return;
    setChatHistory((prev) => [...prev, { role: "user", content: question }]);
  };

  const handleAddTasks = async (tasks: any[]) => {
    if (!selectedProjectId) return;
    for (const task of tasks) {
      await createTask({
        title: task.title,
        description: task.description,
        projectId: selectedProjectId as any,
        priority: task.priority,
      });
    }
  };

  // Auto-add AI response to chat
  if (copilot && chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role !== "assistant") {
    setChatHistory((prev) => [...prev, { role: "assistant", content: copilot.answer }]);
  }

  const tabs = [
    { id: "copilot" as const, label: "Project Copilot", icon: Brain },
    { id: "generator" as const, label: "Task Generator", icon: Plus },
    { id: "health" as const, label: "Project Health", icon: BarChart3 },
    { id: "workload" as const, label: "Workload", icon: Users },
    { id: "deadline" as const, label: "Deadline Risk", icon: AlertTriangle },
  ];

  const selectedProject = projects?.find((p) => p._id === selectedProjectId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-[hsl(262,83%,58%)]" />
          Nova AI
        </h1>
        <p className="text-sm text-gray-400 mt-1">AI-powered project intelligence</p>
      </div>

      {/* Project Selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-400">Project:</label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none"
        >
          <option value="">Select a project</option>
          {projects?.map((p) => (
            <option key={p._id} value={p._id}>{p.title}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[hsl(262,83%,58%)] text-[hsl(262,83%,58%)]"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Copilot */}
      {activeTab === "copilot" && (
        <div className="space-y-4">
          {!selectedProjectId ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Select a project to start chatting with Nova AI.
            </div>
          ) : (
            <>
              <div className="h-[400px] overflow-y-auto space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                {chatHistory.length === 0 && (
                  <div className="text-center py-12">
                    <Brain className="w-12 h-12 text-[hsl(262,83%,58%)]/30 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Ask Nova about your project</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {["What is blocking this project?", "Give me a summary", "Recommend improvements"].map((q) => (
                        <button
                          key={q}
                          onClick={() => { setQuestion(q); handleAsk(); }}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400 hover:bg-white/8 hover:text-gray-300 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-3 rounded-xl text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-[hsl(192,100%,50%)]/10 text-[hsl(192,100%,50%)]"
                        : "bg-white/5 text-gray-300"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {copilot && chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role !== "assistant" && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-3 rounded-xl text-sm bg-white/5 text-gray-300 whitespace-pre-wrap">
                      {copilot.answer}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAsk(); }}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[hsl(262,83%,58%)]/50"
                  placeholder="Ask Nova AI about your project..."
                />
                <button
                  onClick={handleAsk}
                  disabled={!question.trim()}
                  className="px-4 py-2 bg-[hsl(262,83%,58%)]/20 text-[hsl(262,83%,58%)] rounded-lg hover:bg-[hsl(262,83%,58%)]/30 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Task Generator */}
      {activeTab === "generator" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[hsl(262,83%,58%)]/50"
              placeholder="Describe what to build, e.g. 'Build an e-commerce checkout system'"
            />
            <button
              onClick={() => {}}
              disabled={!taskPrompt.trim()}
              className="px-4 py-2 bg-[hsl(262,83%,58%)]/20 text-[hsl(262,83%,58%)] rounded-lg hover:bg-[hsl(262,83%,58%)]/30 transition-colors disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
          {taskSuggestions && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Generated Tasks ({taskSuggestions.tasks.length})</h3>
                {selectedProjectId && (
                  <button
                    onClick={() => handleAddTasks(taskSuggestions.tasks)}
                    className="px-3 py-1.5 bg-[hsl(142,71%,45%)]/10 text-[hsl(142,71%,45%)] rounded-lg text-xs font-medium hover:bg-[hsl(142,71%,45%)]/20 transition-colors"
                  >
                    <Plus className="w-3 h-3 inline mr-1" />
                    Add to Project
                  </button>
                )}
              </div>
              {taskSuggestions.tasks.map((task: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${
                      task.priority === "high" ? "bg-[hsl(25,95%,53%)]/10 text-[hsl(25,95%,53%)]" :
                      task.priority === "medium" ? "bg-white/5 text-gray-400" : "bg-white/5 text-gray-500"
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="text-sm font-medium">{task.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{task.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Health */}
      {activeTab === "health" && (
        <div>
          {!selectedProjectId ? (
            <div className="py-12 text-center text-sm text-gray-500">Select a project to view health.</div>
          ) : health ? (
            <div className="space-y-4">
              <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-[hsl(192,100%,50%)] to-[hsl(262,83%,58%)] bg-clip-text text-transparent">
                  {health.score}
                </div>
                <div className="text-sm text-gray-400">out of 100</div>
                <div className={`text-lg font-semibold mt-1 ${
                  health.status === "HEALTHY" ? "text-[hsl(142,71%,45%)]" :
                  health.status === "FAIR" ? "text-[hsl(45,93%,47%)]" : "text-[hsl(0,84%,60%)]"
                }`}>
                  {health.label}
                </div>
              </div>
              <div className="space-y-2">
                {health.factors.map((f: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className={`w-2 h-2 rounded-full ${
                      f.impact === "positive" ? "bg-[hsl(142,71%,45%)]" :
                      f.impact === "negative" ? "bg-[hsl(0,84%,60%)]" : "bg-[hsl(45,93%,47%)]"
                    }`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{f.name}</div>
                      <div className="text-xs text-gray-500">{f.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              {health.recommendation && (
                <div className="p-4 rounded-xl bg-[hsl(262,83%,58%)]/5 border border-[hsl(262,83%,58%)]/10">
                  <div className="text-xs font-medium text-[hsl(262,83%,58%)] mb-1">Recommendation</div>
                  <p className="text-sm text-gray-300">{health.recommendation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[hsl(262,83%,58%)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Workload */}
      {activeTab === "workload" && (
        <div>
          {!selectedProjectId ? (
            <div className="py-12 text-center text-sm text-gray-500">Select a project to view workload.</div>
          ) : workload ? (
            <div className="space-y-3">
              {workload.map((member: any) => (
                <div key={member.userId} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(192,100%,50%)]/30 to-[hsl(262,83%,58%)]/30 flex items-center justify-center text-xs font-bold">
                      {member.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{member.name}</div>
                      <div className="text-[10px] text-gray-500">{member.activeTasks} active tasks</div>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-1 rounded ${
                      member.status === "OVERLOADED" ? "bg-[hsl(0,84%,60%)]/10 text-[hsl(0,84%,60%)]" :
                      member.status === "HIGH" ? "bg-[hsl(25,95%,53%)]/10 text-[hsl(25,95%,53%)]" :
                      member.status === "MODERATE" ? "bg-[hsl(45,93%,47%)]/10 text-[hsl(45,93%,47%)]" :
                      "bg-[hsl(142,71%,45%)]/10 text-[hsl(142,71%,45%)]"
                    }`}>
                      {member.status} · {member.loadPercent}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        member.loadPercent > 100 ? "bg-[hsl(0,84%,60%)]" :
                        member.loadPercent > 75 ? "bg-[hsl(25,95%,53%)]" :
                        member.loadPercent > 40 ? "bg-[hsl(45,93%,47%)]" : "bg-[hsl(142,71%,45%)]"
                      }`}
                      style={{ width: `${Math.min(100, member.loadPercent)}%` }}
                    />
                  </div>
                  <div className="flex gap-4 mt-2 text-[10px] text-gray-500">
                    <span>Completed: {member.completedTasks}</span>
                    <span>Overdue: {member.overdueTasks}</span>
                    <span>Urgent: {member.urgentTasks}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[hsl(262,83%,58%)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Deadline Risk */}
      {activeTab === "deadline" && (
        <div>
          {!selectedProjectId ? (
            <div className="py-12 text-center text-sm text-gray-500">Select a project to view deadline risks.</div>
          ) : deadlineRisk ? (
            <div className="space-y-3">
              {deadlineRisk.length > 0 ? (
                deadlineRisk.map((risk: any) => (
                  <div key={risk.taskId} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                        risk.riskLevel === "HIGH" ? "bg-[hsl(0,84%,60%)]/10 text-[hsl(0,84%,60%)]" :
                        risk.riskLevel === "MEDIUM" ? "bg-[hsl(45,93%,47%)]/10 text-[hsl(45,93%,47%)]" :
                        "bg-white/5 text-gray-400"
                      }`}>
                        {risk.riskLevel} RISK
                      </span>
                      <span className="text-xs text-gray-500">
                        {risk.daysUntilDue <= 0 ? "Overdue" : `${risk.daysUntilDue}d remaining`}
                      </span>
                    </div>
                    <div className="text-sm font-medium">{risk.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{risk.reason}</div>
                    <div className="text-xs text-[hsl(192,100%,50%)] mt-2">→ {risk.recommendation}</div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-sm text-gray-500">
                  <CheckCircle2 className="w-8 h-8 text-[hsl(142,71%,45%)]/30 mx-auto mb-2" />
                  No deadline risks detected. All tasks are on track!
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[hsl(262,83%,58%)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
