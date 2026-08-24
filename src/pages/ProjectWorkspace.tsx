import { useState, useEffect } from "react";
import { Routes, Route, Link, useParams, useLocation } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Kanban, List, Clock, Users, Activity, Settings,
  Plus, ChevronRight
} from "lucide-react";

import KanbanBoard from "../components/KanbanBoard";
import ListView from "../components/ListView";
import ProjectTimeline from "../components/ProjectTimeline";
import ProjectTeam from "../components/ProjectTeam";
import ProjectActivity from "../components/ProjectActivity";
import TaskDetail from "../components/TaskDetail";

interface Props {
  activeWorkspace: string | null;
}

export default function ProjectWorkspace({ activeWorkspace }: Props) {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const project = useQuery(
    api.projects.get,
    projectId ? { projectId: projectId as any } : "skip"
  );
  const tasks = useQuery(
    api.tasks.list,
    projectId ? { projectId: projectId as any } : "skip"
  );
  const health = useQuery(
    api.ai.projectHealth,
    projectId ? { projectId: projectId as any } : "skip"
  );

  const tabs = [
    { path: "", label: "Overview", icon: LayoutDashboard },
    { path: "board", label: "Board", icon: Kanban },
    { path: "list", label: "List", icon: List },
    { path: "timeline", label: "Timeline", icon: Clock },
    { path: "team", label: "Team", icon: Users },
    { path: "activity", label: "Activity", icon: Activity },
  ];

  const basePath = `/app/projects/${projectId}`;
  const currentTab = location.pathname === basePath ? "" :
    location.pathname.replace(basePath + "/", "").split("/")[0];

  if (!project) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs" style={{ color: '#9da2b3' }}>
        <Link to="/app/projects" className="hover:text-[#1a1d2e] transition-colors">Projects</Link>
        <ChevronRight className="w-3 h-3" />
        <span style={{ color: '#5e6278' }}>{project.title}</span>
      </div>

      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: `${project.color || '#0d9488'}10`, color: project.color || '#0d9488' }}
          >
            {project.icon || project.title.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-extrabold" style={{ color: '#1a1d2e' }}>{project.title}</h1>
            {project.description && (
              <p className="text-sm mt-0.5 line-clamp-1" style={{ color: '#5e6278' }}>{project.description}</p>
            )}
          </div>
        </div>
        {health && (
          <div className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{
            background: health.status === "HEALTHY" ? 'rgba(22,163,74,0.06)' : health.status === "FAIR" ? 'rgba(217,119,6,0.06)' : 'rgba(220,38,38,0.06)',
            color: health.status === "HEALTHY" ? '#16a34a' : health.status === "FAIR" ? '#d97706' : '#dc2626',
          }}>
            Health: {health.score}/100
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto" style={{ borderBottom: '1px solid #e8eaef' }}>
        {tabs.map((tab) => {
          const active = currentTab === tab.path;
          return (
            <Link
              key={tab.path}
              to={`${basePath}/${tab.path}`}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors"
              style={{
                borderColor: active ? '#0d9488' : 'transparent',
                color: active ? '#0d9488' : '#9da2b3',
              }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Tab Content */}
      <Routes>
        <Route index element={<ProjectOverview project={project} tasks={tasks} health={health} />} />
        <Route path="board" element={<KanbanBoard projectId={projectId!} tasks={tasks || []} />} />
        <Route path="list" element={<ListView projectId={projectId!} tasks={tasks || []} />} />
        <Route path="timeline" element={<ProjectTimeline projectId={projectId!} />} />
        <Route path="team" element={<ProjectTeam projectId={projectId!} project={project} />} />
        <Route path="activity" element={<ProjectActivity projectId={projectId!} />} />
        <Route path="task/:taskId" element={<TaskDetail />} />
      </Routes>
    </div>
  );
}

function ProjectOverview({ project, tasks, health }: any) {
  const stats = [
    { label: "Total Tasks", value: project.taskCount || 0 },
    { label: "In Progress", value: project.inProgressTasks || 0 },
    { label: "Review", value: project.reviewTasks || 0 },
    { label: "Done", value: project.doneTasks || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="rounded-xl p-5" style={{ background: '#ffffff', border: '1px solid #e8eaef' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: '#1a1d2e' }}>Progress</h3>
          <span className="text-sm font-bold" style={{ color: '#0d9488' }}>{project.completionPercent || 0}%</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#e8eaef' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${project.completionPercent || 0}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #0d9488, #6366f1)' }}
          />
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-lg font-bold" style={{ color: '#1a1d2e' }}>{s.value}</div>
              <div className="text-[10px]" style={{ color: '#9da2b3' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      {project.members && project.members.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: '#ffffff', border: '1px solid #e8eaef' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#1a1d2e' }}>Team ({project.members.length})</h3>
          <div className="flex flex-wrap gap-2">
            {project.members.map((m: any) => (
              <div key={m._id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: '#f4f6f9' }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: 'rgba(13,148,136,0.1)', color: '#0d9488' }}>
                  {m.user?.name?.charAt(0) || "?"}
                </div>
                <span className="text-xs" style={{ color: '#1a1d2e' }}>{m.user?.name || "Unknown"}</span>
                <span className="text-[9px] capitalize" style={{ color: '#9da2b3' }}>{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Health */}
      {health && health.status !== "NO_DATA" && (
        <div className="rounded-xl p-5" style={{ background: '#ffffff', border: '1px solid #e8eaef' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#1a1d2e' }}>AI Insights</h3>
          <div className="space-y-2">
            {health.factors?.map((f: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  f.impact === "positive" ? "" : f.impact === "negative" ? "" : ""
                }`} style={{
                  background: f.impact === "positive" ? '#16a34a' : f.impact === "negative" ? '#dc2626' : '#d97706'
                }} />
                <span className="text-xs" style={{ color: '#5e6278' }}>{f.name}: {f.value}</span>
              </div>
            ))}
            {health.recommendation && (
              <p className="text-xs mt-2 pt-2" style={{ color: '#5e6278', borderTop: '1px solid #f0f1f5' }}>{health.recommendation}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
