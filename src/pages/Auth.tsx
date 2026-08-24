import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Link, useNavigate, useSearchParams } from "react-router";
import NovaSyncLogo from "../components/NovaSyncLogo";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

interface AuthPageProps {
  redirectAfterAuth?: string;
}

export default function AuthPage({ redirectAfterAuth = "/app" }: AuthPageProps) {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const destination = returnTo || redirectAfterAuth;

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuthActions();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up: creates account + establishes session
        await signIn("password", {
          email,
          password,
          flow: "signUp",
          name,
        });
      } else {
        // Sign in: validates credentials + establishes session
        await signIn("password", { email, password });
      }
      // Navigation happens after successful auth
      navigate(destination);
    } catch (err: any) {
      const msg = String(err?.message || err || "").toLowerCase();

      if (isSignUp) {
        // Registration-specific error handling
        if (msg.includes("already") || msg.includes("duplicate") || msg.includes("exists") || msg.includes("unique")) {
          setError("An account with this email already exists. Please sign in instead.");
        } else if (msg.includes("invalid") && msg.includes("email")) {
          setError("Please enter a valid email address.");
        } else if (msg.includes("password") && (msg.includes("short") || msg.includes("length") || msg.includes("weak"))) {
          setError("Password must be at least 8 characters.");
        } else {
          setError("Registration failed. Please try again.");
        }
      } else {
        // Login-specific error handling
        if (msg.includes("invalid") || msg.includes("password") || msg.includes("credential") || msg.includes("incorrect") || msg.includes("unauthorized")) {
          setError("Invalid email or password. Please check your credentials and try again.");
        } else if (msg.includes("not found") || msg.includes("no account") || msg.includes("user not")) {
          setError("No account found with this email. Please create an account first.");
        } else {
          setError("Sign in failed. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#faf9f7" }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden"
        style={{ background: "#1a1d2e" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 40%, rgba(13,148,136,0.15) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 70% 80%, rgba(99,102,241,0.1) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 flex flex-col justify-center px-16 max-w-lg">
          <Link to="/" className="flex items-center gap-2.5 mb-14">
            <NovaSyncLogo size={36} />
            <span className="text-xl font-bold text-white">NovaSync</span>
          </Link>
          <h1 className="text-4xl font-extrabold leading-tight text-white mb-5">
            Plan together.
            <br />
            <span style={{ color: "#14b8a6" }}>Build smarter.</span>
            <br />
            Stay in sync.
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "#9da2b3" }}>
            Collaborative project management with real-time updates and
            AI-powered intelligence for modern teams.
          </p>
          <div className="mt-10 flex items-center gap-4">
            {[
              { label: "Real-time collaboration", icon: "⚡" },
              { label: "AI-powered insights", icon: "🧠" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-sm"
                style={{ color: "#9da2b3" }}
              >
                <span>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: "#ffffff" }}
      >
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm mb-8 transition-colors hover:opacity-80"
            style={{ color: "#9da2b3" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <NovaSyncLogo size={28} />
            <span className="text-lg font-bold" style={{ color: "#1a1d2e" }}>
              NovaSync
            </span>
          </div>

          <h2
            className="text-2xl font-extrabold mb-2"
            style={{ color: "#1a1d2e" }}
          >
            {isSignUp ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-sm mb-8" style={{ color: "#5e6278" }}>
            {isSignUp
              ? "Start managing projects with your team."
              : "Sign in to continue to NovaSync."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "#5e6278" }}
                >
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
                  style={{
                    background: "#f4f6f9",
                    border: "1px solid #e8eaef",
                    color: "#1a1d2e",
                  }}
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#5e6278" }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
                style={{
                  background: "#f4f6f9",
                  border: "1px solid #e8eaef",
                  color: "#1a1d2e",
                }}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#5e6278" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm transition-colors pr-10 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
                  style={{
                    background: "#f4f6f9",
                    border: "1px solid #e8eaef",
                    color: "#1a1d2e",
                  }}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#9da2b3" }}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-white font-semibold rounded-lg transition-all hover:shadow-md disabled:opacity-50 text-sm"
              style={{ background: "#0d9488" }}
            >
              {loading
                ? "Loading..."
                : isSignUp
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>

          <div
            className="mt-6 text-center text-sm"
            style={{ color: "#5e6278" }}
          >
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="font-semibold transition-colors"
              style={{ color: "#0d9488" }}
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
