import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { User, Bell, Shield, LogOut } from "lucide-react";

export default function SettingsPage() {
  const currentUser = useQuery(api.users.current);
  const updateUser = useMutation(api.users.updateProfile);
  const { signOut } = useAuthActions();
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "security">("profile");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize fields when data loads (using useEffect, not during render)
  useEffect(() => {
    if (currentUser && !initialized) {
      setName(currentUser.name || "");
      setBio(currentUser.bio || "");
      setInitialized(true);
    }
  }, [currentUser, initialized]);

  const handleSave = async () => {
    await updateUser({ name, bio: bio || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Shield },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[hsl(192,100%,50%)] text-[hsl(192,100%,50%)]"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {activeTab === "profile" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(192,100%,50%)]/30 to-[hsl(262,83%,58%)]/30 flex items-center justify-center text-2xl font-bold">
              {currentUser?.name?.charAt(0) || "?"}
            </div>
            <div>
              <div className="text-sm font-semibold">{currentUser?.name || "User"}</div>
              <div className="text-xs text-gray-500">{currentUser?.email || ""}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[hsl(192,100%,50%)]/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[hsl(192,100%,50%)]/50 resize-none"
              rows={3}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[hsl(192,100%,50%)] text-[hsl(222,47%,8%)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Save Changes
            </button>
            {saved && <span className="text-xs text-[hsl(142,71%,45%)]">Saved!</span>}
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Configure your notification preferences.</p>
          {[
            { label: "Task assigned to me", default: true },
            { label: "Task commented on", default: true },
            { label: "Mentioned in a comment", default: true },
            { label: "Project invitation", default: true },
            { label: "Deadline approaching", default: true },
          ].map((pref) => (
            <div key={pref.label} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-sm">{pref.label}</span>
              <div className="w-10 h-5 rounded-full bg-[hsl(192,100%,50%)]/30 flex items-center p-0.5 cursor-pointer">
                <div className="w-4 h-4 rounded-full bg-[hsl(192,100%,50%)] ml-auto" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <h3 className="text-sm font-semibold mb-2">Account</h3>
            <div className="text-xs text-gray-400 mb-3">
              Email: {currentUser?.email || "Not set"}
            </div>
            <div className="text-xs text-gray-500">
              Account is secured with Convex Auth. Password is hashed and stored securely.
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(0,84%,60%)]/10 text-[hsl(0,84%,60%)] rounded-lg text-sm font-medium hover:bg-[hsl(0,84%,60%)]/15 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
