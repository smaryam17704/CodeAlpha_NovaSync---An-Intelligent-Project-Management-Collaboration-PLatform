import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Brain, Send, Plus, AlertTriangle, CheckCircle2, BarChart3, Users } from "lucide-react";

interface Props {
  activeWorkspace: string | null;
}

type AITab = "copilot" | "generator" | "health" | "workload" | "deadline";

export default function NovaAI({ activeWorkspace }: Props) {
  const [activeTab, setActiveTab] = useState<AITab>("copilot");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const [taskPrompt, setTaskPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // The actual question sent to the AI (only set on submit)
  const [activeQuestion, setActiveQuestion] = useState("");

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
    selectedProjectId && activeQuestion ? { projectId: selectedProjectId as any, question: activeQuestion } : "skip"
  );

  const taskSuggestions = useQuery(
    api.ai.taskSuggestions,
    taskPrompt ? { prompt: taskPrompt, projectId: selectedProjectId ? (selectedProjectId as any) : undefined } : "skip"
  );

  const createTask = useMutation(api.tasks.create);

  // Append AI response when copilot data arrives
  useEffect(() => {
    if (copilot && isProcessing) {
      // Add assistant response
      setChatHistory((prev) => {
        // Prevent duplicate: check if last message is already this exact response
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === "assistant" && lastMsg.content === copilot.answer) {
          return prev;
        }
        return [...prev, { role: "assistant", content: copilot.answer }];
      });
      setIsProcessing(false);
    }
  }, [copilot, isProcessing]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleAsk = useCallback(() => {
    const q = inputValue.trim();
    if (!q || !selectedProjectId || isProcessing) return;
    setChatHistory((prev) => [...prev, { role: "user", content: q }]);
    setInputValue("");
    setActiveQuestion(q);
    setIsProcessing(true);
  }, [inputValue, selectedProjectId, isProcessing]);

  const [tasksAdded, setTasksAdded] = useState(false);
  const [addingTasks, setAddingTasks] = useState(false);

  const handleAddTasks = async (tasks: any[]) => {
    if (!selectedProjectId) return;
    setAddingTasks(true);
    try {
      for (const task of tasks) {
        await createTask({
          title: task.title,
          description: task.description,
          projectId: selectedProjectId as any,
          priority: task.priority,
        });
      }
      setTasksAdded(true);
      setTaskPrompt("");
      setTimeout(() => setTasksAdded(false), 3000);
    } catch (err) {
      console.error("Failed to add tasks:", err);
    } finally {
      setAddingTasks(false);
    }
  };

  const askSuggestedQuestion = (q: string) => {
    if (isProcessing) return;
    setChatHistory((prev) => [...prev, { role: "user", content: q }]);
    setInputValue(q);
    setActiveQuestion(q);
    setIsProcessing(true);
  };

  const suggestedQuestions = [
    "What is the current status?",
    "What tasks are overdue?",
    "Who has the most work?",
    "What is blocking this project?",
    "What should we focus on next?",
    "Give me a summary",
    "Which deadlines are coming up?",
    "Who is working on this?",
  ];

  const tabs = [
    { id: "copilot" as const, label: "Project Copilot", icon: Brain },
    { id: "generator" as const, label: "Task Generator", icon: Plus },
    { id: "health" as const, label: "Project Health", icon: BarChart3 },
    { id: "workload" as const, label: "Workload", icon: Users },
    { id: "deadline" as const, label: "Deadline Risk", icon: AlertTriangle },
  ];

  const selectedProject = projects?.find((p: any) => p?._id === selectedProjectId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2" style={{ color: "#1a1d2e" }}>
          <Brain className="w-6 h-6" style={{ color: "#6366f1" }} />
          Nova AI
        </h1>
        <p className="text-sm mt-1" style={{ color: "#5e6278" }}>AI-powered project intelligence</p>
      </div>

      {/* Project Selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium" style={{ color: "#5e6278" }}>Project:</label>
        <select
          value={selectedProjectId}
          onChange={(e) => {
            setSelectedProjectId(e.target.value);
            setChatHistory([]);
            setActiveQuestion("");
            setInputValue("");
            setIsProcessing(false);
          }}
          className="px-3 py-1.5 rounded-lg text-xs focus:outline-none transition-colors"
          style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)', color: 'var(--nova-text)' }}
        >
          <option value="">Select a project</option>
          {projects?.filter(Boolean).map((p: any) => (
            <option key={p!._id} value={p!._id}>{p!.title}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto" style={{ borderBottom: "1px solid #e8eaef" }}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors"
              style={{
                borderColor: active ? "#6366f1" : "transparent",
                color: active ? "#6366f1" : "#9da2b3",
              }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Copilot */}
      {activeTab === "copilot" && (
        <div className="space-y-4">
          {!selectedProjectId ? (
            <div className="py-12 text-center text-sm" style={{ color: "#9da2b3" }}>
              Select a project to start chatting with Nova AI.
            </div>
          ) : (
            <>
              <div className="h-[420px] overflow-y-auto space-y-3 p-4 rounded-xl" style={{ background: 'var(--nova-surface-warm)', border: '1px solid var(--nova-border)' }}>
                {chatHistory.length === 0 && (
                  <div className="text-center py-10">
                    <Brain className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(99,102,241,0.2)" }} />
                    <p className="text-sm font-medium mb-1" style={{ color: "#5e6278" }}>Ask Nova about &ldquo;{selectedProject?.title}&rdquo;</p>
                    <p className="text-xs mb-4" style={{ color: "#9da2b3" }}>Nova analyzes your project data to give real answers</p>
                    <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                      {suggestedQuestions.map((q) => (
                        <button
                          key={q}
                          onClick={() => askSuggestedQuestion(q)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg text-xs transition-colors hover:shadow-sm disabled:opacity-50"
                          style={{ background: "#ffffff", border: "1px solid #e8eaef", color: "#5e6278" }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[85%] p-3 rounded-xl text-sm whitespace-pre-wrap" style={{
                      background: msg.role === "user" ? 'var(--nova-teal-bg)' : 'var(--nova-surface)',
                      color: msg.role === "user" ? 'var(--nova-teal)' : 'var(--nova-text-secondary)',
                      border: msg.role === "user" ? '1px solid rgba(13,148,136,0.12)' : '1px solid var(--nova-border)',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {/* Loading indicator while waiting for copilot */}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] p-3 rounded-xl text-sm"                  style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)', color: 'var(--nova-text-muted)' }}
                >
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
                        Analyzing project data...
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAsk(); }}
                  disabled={isProcessing}
                  className="flex-1 px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 disabled:opacity-50"
                  style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)', color: 'var(--nova-text)' }}
                  placeholder={`Ask Nova about "${selectedProject?.title || "your project"}"...`}
                />
                <button
                  onClick={handleAsk}
                  disabled={!inputValue.trim() || isProcessing}
                  className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  style={{ background: 'var(--nova-indigo-bg)', color: 'var(--nova-indigo)' }}
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
              onKeyDown={(e) => { if (e.key === "Enter" && taskPrompt.trim()) {} }}
              className="flex-1 px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30"
              style={{ background: "#ffffff", border: "1px solid #e8eaef", color: "#1a1d2e" }}
              placeholder="Describe what to build, e.g. 'Build an e-commerce checkout system'"
            />
          </div>
          {taskSuggestions && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ color: "#1a1d2e" }}>Generated Tasks ({taskSuggestions.tasks.length})</h3>
                {selectedProjectId && (
                  <button
                    onClick={() => handleAddTasks(taskSuggestions.tasks)}
                    disabled={addingTasks}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    style={{ background: tasksAdded ? "rgba(22,163,74,0.12)" : "rgba(22,163,74,0.06)", color: "#16a34a" }}
                  >
                    {tasksAdded ? "✓ Added!" : addingTasks ? "Adding..." : (
                      <><Plus className="w-3 h-3 inline mr-1" />
                      Add to Project</>
                    )}
                  </button>
                )}
              </div>
              {taskSuggestions.tasks.map((task: any, i: number) => (
                <div key={i} className="p-3 rounded-lg" style={{ background: "#ffffff", border: "1px solid #e8eaef" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded capitalize" style={{
                      background: task.priority === "high" ? "rgba(217,119,6,0.06)" : "#f4f6f9",
                      color: task.priority === "high" ? "#d97706" : "#5e6278",
                    }}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="text-sm font-medium" style={{ color: "#1a1d2e" }}>{task.title}</div>
                  <div className="text-xs mt-1" style={{ color: "#9da2b3" }}>{task.description}</div>
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
            <div className="py-12 text-center text-sm" style={{ color: "#9da2b3" }}>Select a project to view health.</div>
          ) : health ? (
            <div className="space-y-4">
              <div className="p-6 rounded-xl text-center" style={{ background: "#ffffff", border: "1px solid #e8eaef" }}>
                <div className="text-5xl font-extrabold mb-2" style={{ color: "#0d9488" }}>
                  {health.score}
                </div>
                <div className="text-sm" style={{ color: "#9da2b3" }}>out of 100</div>
                <div className="text-lg font-semibold mt-1" style={{
                  color: health.status === "HEALTHY" ? "#16a34a" : health.status === "FAIR" ? "#d97706" : "#dc2626"
                }}>
                  {health.label}
                </div>
              </div>
              <div className="space-y-2">
                {health.factors.map((f: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#ffffff", border: "1px solid #e8eaef" }}>
                    <div className="w-2 h-2 rounded-full" style={{
                      background: f.impact === "positive" ? "#16a34a" : f.impact === "negative" ? "#dc2626" : "#d97706"
                    }} />
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: "#1a1d2e" }}>{f.name}</div>
                      <div className="text-xs" style={{ color: "#9da2b3" }}>{f.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              {health.recommendation && (
                <div className="p-4 rounded-xl" style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.1)" }}>
                  <div className="text-xs font-medium mb-1" style={{ color: "#6366f1" }}>Recommendation</div>
                  <p className="text-sm" style={{ color: "#5e6278" }}>{health.recommendation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Workload */}
      {activeTab === "workload" && (
        <div>
          {!selectedProjectId ? (
            <div className="py-12 text-center text-sm" style={{ color: "#9da2b3" }}>Select a project to view workload.</div>
          ) : workload ? (
            <div className="space-y-3">
              {workload.map((member: any) => (
                <div key={member.userId} className="p-4 rounded-xl" style={{ background: "#ffffff", border: "1px solid #e8eaef" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(13,148,136,0.08)", color: "#0d9488" }}>
                      {member.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: "#1a1d2e" }}>{member.name}</div>
                      <div className="text-[10px]" style={{ color: "#9da2b3" }}>{member.activeTasks} active tasks</div>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-1 rounded" style={{
                      background: member.status === "OVERLOADED" ? "rgba(220,38,38,0.06)" : member.status === "HIGH" ? "rgba(217,119,6,0.06)" : member.status === "MODERATE" ? "rgba(217,119,6,0.04)" : "rgba(22,163,74,0.06)",
                      color: member.status === "OVERLOADED" ? "#dc2626" : member.status === "HIGH" ? "#d97706" : member.status === "MODERATE" ? "#d97706" : "#16a34a",
                    }}>
                      {member.status} · {member.loadPercent}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#e8eaef" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: member.loadPercent > 100 ? "#dc2626" : member.loadPercent > 75 ? "#d97706" : member.loadPercent > 40 ? "#d97706" : "#16a34a",
                        width: `${Math.min(100, member.loadPercent)}%`,
                      }}
                    />
                  </div>
                  <div className="flex gap-4 mt-2 text-[10px]" style={{ color: "#9da2b3" }}>
                    <span>Completed: {member.completedTasks}</span>
                    <span>Overdue: {member.overdueTasks}</span>
                    <span>Urgent: {member.urgentTasks}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Deadline Risk */}
      {activeTab === "deadline" && (
        <div>
          {!selectedProjectId ? (
            <div className="py-12 text-center text-sm" style={{ color: "#9da2b3" }}>Select a project to view deadline risks.</div>
          ) : deadlineRisk ? (
            <div className="space-y-3">
              {deadlineRisk.length > 0 ? (
                deadlineRisk.map((risk: any) => (
                  <div key={risk.taskId} className="p-4 rounded-xl" style={{ background: "#ffffff", border: "1px solid #e8eaef" }}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{
                        background: risk.riskLevel === "HIGH" ? "rgba(220,38,38,0.06)" : risk.riskLevel === "MEDIUM" ? "rgba(217,119,6,0.06)" : "#f4f6f9",
                        color: risk.riskLevel === "HIGH" ? "#dc2626" : risk.riskLevel === "MEDIUM" ? "#d97706" : "#5e6278",
                      }}>
                        {risk.riskLevel} RISK
                      </span>
                      <span className="text-xs" style={{ color: "#9da2b3" }}>
                        {risk.daysUntilDue <= 0 ? "Overdue" : `${risk.daysUntilDue}d remaining`}
                      </span>
                    </div>
                    <div className="text-sm font-medium" style={{ color: "#1a1d2e" }}>{risk.title}</div>
                    <div className="text-xs mt-1" style={{ color: "#9da2b3" }}>{risk.reason}</div>
                    <div className="text-xs mt-2" style={{ color: "#0d9488" }}>→ {risk.recommendation}</div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-sm" style={{ color: "#9da2b3" }}>
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(22,163,74,0.3)" }} />
                  No deadline risks detected. All tasks are on track!
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
