import { Link } from "react-router";
import { motion } from "framer-motion";
import NovaSyncLogo from "../components/NovaSyncLogo";
import {
  Users, Layout, BarChart3, Bell, Search, Brain,
  ArrowRight, Sparkles, Shield
} from "lucide-react";

const features = [
  {
    icon: Layout,
    title: "Kanban Boards",
    description: "Visual task management with drag-and-drop boards. Move work forward with clarity.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Real-time collaboration. See changes instantly. Stay aligned with your team.",
  },
  {
    icon: Brain,
    title: "Nova AI",
    description: "AI-powered project intelligence. Get health scores, workload analysis, and smart task generation.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Stay informed with intelligent notifications. Never miss what matters.",
  },
  {
    icon: BarChart3,
    title: "Project Analytics",
    description: "Track progress, timelines, and team performance with actionable insights.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Granular permissions. Owner, admin, member, and viewer roles built in.",
  },
];

const stats = [
  { value: "Real-time", label: "Collaboration" },
  { value: "AI-Powered", label: "Intelligence" },
  { value: "4 Roles", label: "Permissions" },
  { value: "24/7", label: "Availability" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[hsl(222,47%,8%)] text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[hsl(222,47%,8%)]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NovaSyncLogo size={28} />
            <span className="text-lg font-bold tracking-tight">NovaSync</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm text-gray-300 hover:text-white transition-colors px-3 py-2">
              Sign In
            </Link>
            <Link
              to="/auth"
              className="text-sm font-medium bg-gradient-to-r from-[hsl(192,100%,50%)] to-[hsl(262,83%,58%)] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[hsl(192,100%,50%)] opacity-5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[hsl(262,83%,58%)] opacity-5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-gray-300 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[hsl(192,100%,50%)]" />
              AI-Powered Project Intelligence
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
              Plan together.
              <br />
              <span className="bg-gradient-to-r from-[hsl(192,100%,50%)] to-[hsl(262,83%,58%)] bg-clip-text text-transparent">
                Build faster.
              </span>
              <br />
              Stay in sync.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              NovaSync is the collaborative project management platform that keeps your team aligned.
              Real-time updates, AI insights, and beautiful workflows — all in one place.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/auth"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[hsl(192,100%,50%)] to-[hsl(192,100%,40%)] text-white font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm"
              >
                Start Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/10 text-gray-300 font-medium px-6 py-3 rounded-lg hover:bg-white/5 transition-colors text-sm"
              >
                See Features
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-[hsl(192,100%,50%)] to-[hsl(262,83%,58%)] bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold">Everything you need to ship faster</h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
              From task management to AI-powered insights, NovaSync gives your team the tools to work smarter.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[hsl(192,100%,50%)]/20 hover:bg-white/[0.04] transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-[hsl(192,100%,50%)]/10 flex items-center justify-center mb-4 group-hover:bg-[hsl(192,100%,50%)]/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-[hsl(192,100%,50%)]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold">Up and running in minutes</h2>
            <p className="mt-4 text-gray-400">Three steps to better project management.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create Workspace", desc: "Set up your workspace and invite your team members." },
              { step: "02", title: "Plan Projects", desc: "Create projects, define tasks, and assign your team." },
              { step: "03", title: "Ship Together", desc: "Track progress with Kanban boards and AI insights." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="text-5xl font-bold bg-gradient-to-b from-white/20 to-transparent bg-clip-text text-transparent mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-12 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/5"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to sync your team?</h2>
            <p className="text-gray-400 mb-8">
              Start managing projects with clarity, collaboration, and AI-powered intelligence.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(192,100%,50%)] to-[hsl(262,83%,58%)] text-white font-medium px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <NovaSyncLogo size={22} />
            <span className="text-sm font-semibold">NovaSync</span>
          </div>
          <p className="text-xs text-gray-500">Plan together. Build faster. Stay in sync.</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
