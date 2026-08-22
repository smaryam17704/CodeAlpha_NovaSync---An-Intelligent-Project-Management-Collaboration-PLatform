import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link, useNavigate } from "react-router";
import { Zap, Eye, EyeOff, ArrowLeft } from "lucide-react";

interface AuthPageProps {
  redirectAfterAuth?: string;
}

export default function AuthPage({ redirectAfterAuth = "/app" }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuthActions();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp("password", { name, email, password, flow: "signUp" });
      } else {
        await signIn("password", { email, password });
      }
      navigate(redirectAfterAuth);
    } catch (err: any) {
      const msg = err?.message || "Authentication failed";
      if (msg.includes("already") || msg.includes("duplicate") || msg.includes("exists")) {
        setError("An account with this email already exists.");
      } else if (msg.includes("invalid") || msg.includes("password") || msg.includes("credentials")) {
        setError("Invalid email or password.");
      } else {
        setError(msg.length > 100 ? "Authentication failed. Please try again." : msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(222,47%,8%)] flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(192,100%,50%)]/5 to-[hsl(262,83%,58%)]/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(192,100%,50%)] opacity-5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(192,100%,50%)] to-[hsl(262,83%,58%)] flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">NovaSync</span>
          </Link>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Plan together.
            <br />
            <span className="bg-gradient-to-r from-[hsl(192,100%,50%)] to-[hsl(262,83%,58%)] bg-clip-text text-transparent">
              Build faster.
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md">
            Collaborative project management with real-time updates and AI-powered intelligence.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(192,100%,50%)] to-[hsl(262,83%,58%)] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">NovaSync</span>
          </div>

          <h2 className="text-2xl font-bold mb-2">{isSignUp ? "Create account" : "Welcome back"}</h2>
          <p className="text-sm text-gray-400 mb-8">
            {isSignUp ? "Start managing projects with your team." : "Sign in to continue."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[hsl(192,100%,50%)]/50 focus:ring-1 focus:ring-[hsl(192,100%,50%)]/30 transition-colors"
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[hsl(192,100%,50%)]/50 focus:ring-1 focus:ring-[hsl(192,100%,50%)]/30 transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[hsl(192,100%,50%)]/50 focus:ring-1 focus:ring-[hsl(192,100%,50%)]/30 transition-colors pr-10"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-[hsl(0,84%,60%)]/10 border border-[hsl(0,84%,60%)]/20 rounded-lg text-sm text-[hsl(0,84%,60%)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-[hsl(192,100%,50%)] to-[hsl(192,100%,40%)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
            >
              {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
              className="text-[hsl(192,100%,50%)] hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
