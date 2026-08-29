import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { User, Bell, Shield, LogOut, Check } from "lucide-react";

export default function SettingsPage() {
  const currentUser = useQuery(api.users.current);
  const updateUser = useMutation(api.users.updateProfile);
  const updatePrefs = useMutation(api.users.updateNotificationPrefs);
  const { signOut } = useAuthActions();
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "security" | "appearance">("profile");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Notification preferences state — initialized from database
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    taskAssigned: true,
    taskCommented: true,
    taskMentioned: true,
    projectInvitation: true,
  });
  const [prefsInitialized, setPrefsInitialized] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    try { return localStorage.getItem("novasync_theme") || "light"; } catch { return "light"; }
  });

  useEffect(() => {
    if (currentUser && !initialized) {
      setName(currentUser.name || "");
      setBio(currentUser.bio || "");
      setInitialized(true);
    }
  }, [currentUser, initialized]);

  // Initialize notification preferences from database
  useEffect(() => {
    if (currentUser && !prefsInitialized) {
      if (currentUser.notificationPreferences) {
        setPrefs({
          emailNotifications: currentUser.notificationPreferences.emailNotifications ?? true,
          taskAssigned: currentUser.notificationPreferences.taskAssigned ?? true,
          taskCommented: currentUser.notificationPreferences.taskCommented ?? true,
          taskMentioned: currentUser.notificationPreferences.taskMentioned ?? true,
          projectInvitation: currentUser.notificationPreferences.projectInvitation ?? true,
        });
      }
      setPrefsInitialized(true);
    }
  }, [currentUser, prefsInitialized]);

  const handleSave = async () => {
    await updateUser({ name, bio: bio || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePrefToggle = async (key: keyof typeof prefs) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    try {
      await updatePrefs({ preferences: newPrefs });
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    } catch (err) {
      // Revert on failure
      setPrefs(prefs);
      console.error("Failed to save notification preferences:", err);
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "appearance" as const, label: "Appearance", icon: Shield },
    { id: "security" as const, label: "Security", icon: Shield },
  ];

  const notificationPrefs = [
    { key: "emailNotifications" as const, label: "Email notifications", description: "Receive email updates for important activity" },
    { key: "taskAssigned" as const, label: "Task assigned to me", description: "When someone assigns a task to you" },
    { key: "taskCommented" as const, label: "Task commented on", description: "When someone comments on your task" },
    { key: "taskMentioned" as const, label: "Mentioned in a comment", description: "When someone @mentions you in a comment" },
    { key: "projectInvitation" as const, label: "Project invitation", description: "When someone invites you to a project" },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-extrabold" style={{ color: 'var(--nova-text)' }}>Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1" style={{ borderBottom: '1px solid var(--nova-border)' }}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors"
              style={{
                borderColor: active ? '#0d9488' : 'transparent',
                color: active ? '#0d9488' : 'var(--nova-text-muted)',
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold" style={{ background: 'var(--nova-teal-bg)', color: 'var(--nova-teal)' }}>
              {currentUser?.name?.charAt(0) || "?"}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--nova-text)' }}>{currentUser?.name || "User"}</div>
              <div className="text-xs" style={{ color: 'var(--nova-text-muted)' }}>{currentUser?.email || ""}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nova-text-secondary)' }}>Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ background: 'var(--nova-surface-cool)', border: '1px solid var(--nova-border)', color: 'var(--nova-text)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nova-text-secondary)' }}>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm transition-colors resize-none"
              style={{ background: 'var(--nova-surface-cool)', border: '1px solid var(--nova-border)', color: 'var(--nova-text)' }}
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
            {saved && <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#16a34a' }}><Check className="w-3 h-3" /> Saved!</span>}
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>Configure your notification preferences.</p>
            {prefsSaved && <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#16a34a' }}><Check className="w-3 h-3" /> Saved</span>}
          </div>
          {notificationPrefs.map((pref) => (
            <div key={pref.key} className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)' }}>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--nova-text)' }}>{pref.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--nova-text-muted)' }}>{pref.description}</div>
              </div>
              <button
                onClick={() => handlePrefToggle(pref.key)}
                className="relative w-10 h-5 rounded-full flex items-center p-0.5 transition-colors cursor-pointer"
                style={{ background: prefs[pref.key] ? '#0d9488' : 'var(--nova-border)' }}
              >
                <div
                  className="w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                  style={{ transform: prefs[pref.key] ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Appearance / Theme */}
      {activeTab === "appearance" && (
        <div className="space-y-6">              <div className="p-4 rounded-xl" style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--nova-text)' }}>Theme</h3>
            <div className="flex gap-3">
              {([
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ] as const).map((t) => {
                const isActive = currentTheme === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => {
                      const isDark = t.value === "dark";
                      document.documentElement.classList.toggle("dark", isDark);
                      try { localStorage.setItem("novasync_theme", t.value); } catch {}
                      setCurrentTheme(t.value);
                    }}
                    className="flex-1 py-3 rounded-lg text-sm font-medium border transition-all"
                    style={{
                      background: isActive ? 'var(--nova-teal-bg)' : 'var(--nova-surface-cool)',
                      borderColor: isActive ? 'var(--nova-teal)' : 'var(--nova-border)',
                      color: isActive ? 'var(--nova-teal)' : 'var(--nova-text-secondary)',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] mt-2" style={{ color: 'var(--nova-text-muted)' }}>Switch between light and dark mode.</p>
          </div>
        </div>
      )}

      {/* Security */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl" style={{ background: 'var(--nova-surface)', border: '1px solid var(--nova-border)' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--nova-text)' }}>Account</h3>
            <div className="text-xs mb-3" style={{ color: 'var(--nova-text-secondary)' }}>
              Email: {currentUser?.email || "Not set"}
            </div>
            <div className="text-xs" style={{ color: 'var(--nova-text-muted)' }}>
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
