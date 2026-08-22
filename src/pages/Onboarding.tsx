import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useNavigate } from "react-router";
import { Zap, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen bg-[hsl(222,47%,8%)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(192,100%,50%)] to-[hsl(262,83%,58%)] flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">NovaSync</span>
        </div>

        {step === "workspace" ? (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-center mb-2">Welcome to NovaSync!</h1>
            <p className="text-sm text-gray-400 text-center mb-8">
              Create your workspace to get started.
            </p>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Workspace name</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[hsl(192,100%,50%)]/50"
                  placeholder="My Team"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description (optional)</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[hsl(192,100%,50%)]/50"
                  placeholder="What's your team working on?"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-[hsl(192,100%,50%)] to-[hsl(262,83%,58%)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {loading ? "Creating..." : "Create Workspace"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[hsl(142,71%,45%)]/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-[hsl(142,71%,45%)]" />
            </div>
            <h2 className="text-xl font-bold mb-2">Workspace created!</h2>
            <p className="text-sm text-gray-400">Redirecting to your dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
