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
      <h1 className="text-2xl font-extrabold" style={{ color: '#1a1d2e' }}>Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1" style={{ borderBottom: '1px solid #e8eaef' }}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors"
              style={{
                borderColor: active ? '#0d9488' : 'transparent',
                color: active ? '#0d9488' : '#9da2b3',
              }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile */}
      {activeTab === "profile" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold" style={{ background: 'rgba(13,148,136,0.08)', color: '#0d9488' }}>
              {currentUser?.name?.charAt(0) || "?"}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: '#1a1d2e' }}>{currentUser?.name || "User"}</div>
              <div className="text-xs" style={{ color: '#9da2b3' }}>{currentUser?.email || ""}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#5e6278' }}>Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ background: '#f4f6f9', border: '1px solid #e8eaef', color: '#1a1d2e' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#5e6278' }}>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm transition-colors resize-none"
              style={{ background: '#f4f6f9', border: '1px solid #e8eaef', color: '#1a1d2e' }}
              rows={3}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 text-white rounded-lg text-sm font-semibold transition-all hover:shadow-md"
              style={{ background: '#0d9488' }}
            >
              Save Changes
            </button>
            {saved && <span className="text-xs font-medium" style={{ color: '#16a34a' }}>Saved!</span>}
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: '#5e6278' }}>Configure your notification preferences.</p>
          {[
            { label: "Task assigned to me", default: true },
            { label: "Task commented on", default: true },
            { label: "Mentioned in a comment", default: true },
            { label: "Project invitation", default: true },
            { label: "Deadline approaching", default: true },
          ].map((pref) => (
            <div key={pref.label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#ffffff', border: '1px solid #e8eaef' }}>
              <span className="text-sm" style={{ color: '#1a1d2e' }}>{pref.label}</span>
              <div className="w-10 h-5 rounded-full flex items-center p-0.5 cursor-pointer" style={{ background: '#0d9488' }}>
                <div className="w-4 h-4 rounded-full bg-white ml-auto" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl" style={{ background: '#ffffff', border: '1px solid #e8eaef' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#1a1d2e' }}>Account</h3>
            <div className="text-xs mb-3" style={{ color: '#5e6278' }}>
              Email: {currentUser?.email || "Not set"}
            </div>
            <div className="text-xs" style={{ color: '#9da2b3' }}>
              Account is secured with Convex Auth. Password is hashed and stored securely.
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'rgba(220,38,38,0.06)', color: '#dc2626' }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
