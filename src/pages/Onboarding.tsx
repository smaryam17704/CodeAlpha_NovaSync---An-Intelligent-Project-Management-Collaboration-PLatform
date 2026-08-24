import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useNavigate } from "react-router";
import NovaSyncLogo from "../components/NovaSyncLogo";
import { ArrowRight } from "lucide-react";

export default function Onboarding() {
  const [step, setStep] = useState<"workspace" | "done">("workspace");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const createWorkspace = useMutation(api.workspaces.create);
  const navigate = useNavigate();

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createWorkspace({ name, description: description || undefined });
      setStep("done");
      setTimeout(() => navigate("/app"), 1500);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#faf9f7' }}>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <NovaSyncLogo size={36} />
          <span className="text-xl font-bold" style={{ color: '#1a1d2e' }}>NovaSync</span>
        </div>

        {step === "workspace" ? (
          <div className="animate-fade-in rounded-xl p-8" style={{ background: '#ffffff', border: '1px solid #e8eaef', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
            <h1 className="text-2xl font-extrabold text-center mb-2" style={{ color: '#1a1d2e' }}>Welcome to NovaSync!</h1>
            <p className="text-sm text-center mb-8" style={{ color: '#5e6278' }}>
              Create your workspace to get started.
            </p>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#5e6278' }}>Workspace name</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm transition-colors"
                  style={{ background: '#f4f6f9', border: '1px solid #e8eaef', color: '#1a1d2e' }}
                  placeholder="My Team"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#5e6278' }}>Description (optional)</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm transition-colors"
                  style={{ background: '#f4f6f9', border: '1px solid #e8eaef', color: '#1a1d2e' }}
                  placeholder="What's your team working on?"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full py-2.5 text-white font-semibold rounded-lg transition-all hover:shadow-md disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                style={{ background: '#0d9488' }}
              >
                {loading ? "Creating..." : "Create Workspace"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(22,163,74,0.06)' }}>
              <NovaSyncLogo size={48} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#1a1d2e' }}>Workspace created!</h2>
            <p className="text-sm" style={{ color: '#5e6278' }}>Redirecting to your dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
