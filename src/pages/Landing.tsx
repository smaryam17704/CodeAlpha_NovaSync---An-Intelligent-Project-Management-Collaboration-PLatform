import { Link } from "react-router";
import { motion } from "framer-motion";
import NovaSyncLogo from "../components/NovaSyncLogo";
import {
  Users, Layout, BarChart3, Bell, Search, Brain,
  ArrowRight, Sparkles, Shield, CheckCircle, Zap,
  ArrowUpRight, ChevronRight, Star
} from "lucide-react";

const features = [
  {
    icon: Layout,
    title: "Kanban Boards",
    description: "Visual task management with drag-and-drop boards. Move work forward with clarity and precision.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Real-time collaboration that keeps your entire team aligned and productive.",
  },
  {
    icon: Brain,
    title: "Nova AI",
    description: "AI-powered project intelligence. Health scores, workload analysis, and smart task generation.",
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
  { value: "99.9%", label: "Uptime" },
];

const workflowSteps = [
  { step: "01", title: "Create Workspace", desc: "Set up your workspace and invite your team members." },
  { step: "02", title: "Plan Projects", desc: "Create projects, define tasks, and assign your team." },
  { step: "03", title: "Ship Together", desc: "Track progress with Kanban boards and AI insights." },
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'var(--nova-surface-warm)' }}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50" style={{ background: 'color-mix(in srgb, var(--nova-surface-warm) 85%, transparent)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--nova-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <NovaSyncLogo size={28} />
            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--nova-text)' }}>NovaSync</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: 'var(--nova-text-secondary)' }}>
            <a href="#features" className="hover:text-[#1a1d2e] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#1a1d2e] transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm px-4 py-2 rounded-lg transition-colors font-medium" style={{ color: 'var(--nova-text-secondary)' }}>
              Sign In
            </Link>
            <Link
              to="/auth"
              className="text-sm font-semibold px-5 py-2.5 rounded-lg text-white transition-all hover:shadow-md hover:shadow-[#0d9488]/20"
              style={{ background: '#0d9488' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-[10%] w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.04) 0%, transparent 70%)' }} />
          <div className="absolute top-40 left-[5%] w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.03) 0%, transparent 70%)' }} />
        </div>
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8" style={{ background: 'rgba(13,148,136,0.06)', color: '#0d9488', border: '1px solid rgba(13,148,136,0.12)' }}>
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Project Intelligence
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.1]" style={{ color: 'var(--nova-text)' }}>
                Plan together.
                <br />
                <span style={{ color: '#0d9488' }}>Build smarter.</span>
                <br />
                Stay in sync.
              </h1>
              <p className="mt-6 text-lg max-w-xl leading-relaxed" style={{ color: 'var(--nova-text-secondary)' }}>
                NovaSync is the collaborative project management platform that keeps your team aligned.
                Real-time updates, AI insights, and beautiful workflows — all in one place.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                <Link
                  to="/auth"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white font-semibold px-7 py-3.5 rounded-lg transition-all hover:shadow-lg hover:shadow-[#0d9488]/25 text-sm"
                  style={{ background: '#0d9488' }}
                >
                  Start Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#features"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-medium px-7 py-3.5 rounded-lg text-sm transition-colors"
                  style={{ color: 'var(--nova-text-secondary)', border: '1px solid var(--nova-border)' }}
                >
                  See Features
                </a>
              </div>
              <div className="mt-8 flex items-center gap-6 text-xs" style={{ color: 'var(--nova-text-muted)' }}>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" style={{ color: '#0d9488' }} />
                  Free for small teams
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" style={{ color: '#0d9488' }} />
                  No credit card required
                </div>
              </div>
            </motion.div>

            {/* Right: Product Preview */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Mock product interface */}
                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)' }}>
                  {/* Top bar */}
                  <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #f0f1f5', background: 'var(--nova-surface-warm)' }}>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fca5a5' }} />
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fcd34d' }} />
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#86efac' }} />
                    </div>
                    <div className="flex-1 mx-8">
                      <div className="h-5 rounded-md mx-auto max-w-[200px]" style={{ background: '#f0f1f5' }} />
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-5 space-y-4" style={{ background: '#f8f6f3' }}>
                    {/* Project header mock */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg" style={{ background: 'rgba(13,148,136,0.1)' }}>
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: '#0d9488' }}>N</div>
                        </div>
                        <div>
                          <div className="h-3 w-24 rounded" style={{ background: '#d1d5db' }} />
                          <div className="h-2 w-16 rounded mt-1" style={{ background: '#e8eaef' }} />
                        </div>
                      </div>
                      <div className="flex -space-x-1.5">
                        {["#0d9488", "#6366f1", "#c5a55a", "#16a34a"].map((c, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-white" style={{ background: c, opacity: 0.7 + i * 0.1 }} />
                        ))}
                      </div>
                    </div>
                    {/* Kanban mock */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "To Do", color: "#9da2b3", count: 4, items: ["Auth flow", "Dashboard"] },
                        { label: "In Progress", color: "#0d9488", count: 3, items: ["API design", "Kanban"] },
                        { label: "Done", color: "#16a34a", count: 7, items: ["Setup", "Schema"] },
                      ].map((col) => (
                        <div key={col.label} className="rounded-lg p-3" style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)' }}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                            <div className="h-2 w-12 rounded" style={{ background: '#d1d5db' }} />
                          </div>
                          {col.items.map((item, i) => (
                            <div key={i} className="rounded-md p-2 mb-1.5" style={{ background: '#f8f6f3', border: '1px solid #f0f1f5' }}>
                              <div className="h-2 rounded" style={{ background: '#d1d5db', width: `${60 + i * 15}%` }} />
                              <div className="flex items-center gap-1 mt-1.5">
                                <div className="w-4 h-4 rounded-full" style={{ background: '#e8eaef' }} />
                                <div className="h-1.5 w-8 rounded" style={{ background: '#e8eaef' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    {/* Progress bar mock */}
                    <div className="flex items-center gap-3">
                      <div className="text-[10px] font-medium" style={{ color: 'var(--nova-text-secondary)' }}>Sprint Progress</div>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: '#e8eaef' }}>
                        <div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #0d9488, #6366f1)', width: '68%' }} />
                      </div>
                      <div className="text-[10px] font-semibold" style={{ color: '#0d9488' }}>68%</div>
                    </div>
                  </div>
                </div>
                {/* Floating accent card */}
                <div className="absolute -bottom-4 -left-4 rounded-lg p-3 animate-fade-in" style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'rgba(13,148,136,0.1)' }}>
                      <Brain className="w-3.5 h-3.5" style={{ color: '#0d9488' }} />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold" style={{ color: 'var(--nova-text)' }}>Nova AI</div>
                      <div className="text-[9px]" style={{ color: 'var(--nova-text-muted)' }}>Health: 82/100</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ borderTop: '1px solid var(--nova-border)', borderBottom: '1px solid var(--nova-border)', background: 'var(--nova-surface)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 py-10 px-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#0d9488' }}>{stat.value}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--nova-text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6" style={{ background: 'var(--nova-surface)' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-4" style={{ background: 'rgba(13,148,136,0.06)', color: '#0d9488' }}>
              Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ color: 'var(--nova-text)' }}>Everything you need to ship faster</h2>
            <p className="mt-4 max-w-2xl mx-auto text-base" style={{ color: 'var(--nova-text-secondary)' }}>
              From task management to AI-powered insights, NovaSync gives your team the tools to work smarter.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-6 rounded-xl transition-all group hover:shadow-lg hover:shadow-black/[0.03]"
                style={{ background: '#f8f6f3', border: '1px solid var(--nova-border)' }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors" style={{ background: 'rgba(13,148,136,0.08)' }}>
                  <feature.icon className="w-5 h-5" style={{ color: '#0d9488' }} />
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--nova-text)' }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--nova-text-secondary)' }}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6" style={{ background: 'var(--nova-surface-cool)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-4" style={{ background: 'rgba(99,102,241,0.06)', color: '#6366f1' }}>
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ color: 'var(--nova-text)' }}>Up and running in minutes</h2>
            <p className="mt-4 text-base" style={{ color: 'var(--nova-text-secondary)' }}>Three steps to better project management.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {workflowSteps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="text-center relative"
              >
                <div className="text-6xl font-extrabold mb-4" style={{ color: 'rgba(26,29,46,0.18)' }}>{item.step}</div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--nova-text)' }}>{item.title}</h3>
                <p className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 right-0 transform translate-x-1/2">
                    <ChevronRight className="w-5 h-5" style={{ color: '#d1d5db' }} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6" style={{ background: 'var(--nova-surface-warm)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-14 rounded-2xl"
            style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.04)' }}
          >
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-6" style={{ background: 'rgba(197,165,90,0.08)', color: '#c5a55a' }}>
              <Star className="w-3 h-3" />
              Trusted by teams worldwide
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: 'var(--nova-text)' }}>Ready to sync your team?</h2>
            <p className="text-base mb-8" style={{ color: 'var(--nova-text-secondary)' }}>
              Start managing projects with clarity, collaboration, and AI-powered intelligence.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 text-white font-semibold px-8 py-3.5 rounded-lg transition-all hover:shadow-lg hover:shadow-[#0d9488]/25"
              style={{ background: '#0d9488' }}
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--nova-border)', background: 'var(--nova-surface)' }}>
        <div className="max-w-6xl mx-auto py-12 px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <NovaSyncLogo size={24} />
                <span className="text-base font-bold" style={{ color: 'var(--nova-text)' }}>NovaSync</span>
              </div>
              <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--nova-text-secondary)' }}>
                Plan together. Build smarter. Stay in sync.
                The collaborative project management platform for modern teams.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--nova-text-muted)' }}>Product</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-sm transition-colors hover:text-[#0d9488]" style={{ color: 'var(--nova-text-secondary)' }}>Features</a>
                <a href="#how-it-works" className="block text-sm transition-colors hover:text-[#0d9488]" style={{ color: 'var(--nova-text-secondary)' }}>How It Works</a>
                <Link to="/auth" className="block text-sm transition-colors hover:text-[#0d9488]" style={{ color: 'var(--nova-text-secondary)' }}>Get Started</Link>
                <Link to="/auth" className="block text-sm transition-colors hover:text-[#0d9488]" style={{ color: 'var(--nova-text-secondary)' }}>Sign In</Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--nova-text-muted)' }}>Legal</h4>
              <div className="space-y-2">
                <Link to="/privacy" className="block text-sm transition-colors hover:text-[#0d9488]" style={{ color: 'var(--nova-text-secondary)' }}>Privacy Policy</Link>
                <Link to="/terms" className="block text-sm transition-colors hover:text-[#0d9488]" style={{ color: 'var(--nova-text-secondary)' }}>Terms of Service</Link>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3" style={{ borderTop: '1px solid var(--nova-border)' }}>
            <p className="text-xs" style={{ color: 'var(--nova-text-muted)' }}>&copy; {new Date().getFullYear()} NovaSync. All rights reserved.</p>
            <div className="flex items-center gap-1.5">
              <NovaSyncLogo size={14} />
              <span className="text-xs" style={{ color: 'var(--nova-text-muted)' }}>Built with precision for modern teams</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
