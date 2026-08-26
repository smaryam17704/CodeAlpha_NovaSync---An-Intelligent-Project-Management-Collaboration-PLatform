import { useState, useEffect, useRef } from "react";
import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";

export function useAuth() {
  const user = useQuery(api.users.current);
  const { signIn, signOut } = useAuthActions();

  // Grace period: during initial load, give Convex time to restore the session.
  // Without this, a page refresh briefly returns user=null before the auth
  // token is restored, causing RequireAuth to redirect to /auth.
  const [initDone, setInitDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Once we get a non-undefined result (user object or null), mark init done.
    if (user !== undefined) {
      // Small extra grace to cover the window between token restore and query
      if (!initDone) {
        timerRef.current = setTimeout(() => setInitDone(true), 500);
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, initDone]);

  // Safety: never stay in loading state for more than 4 seconds.
  useEffect(() => {
    const safety = setTimeout(() => setInitDone(true), 4000);
    return () => clearTimeout(safety);
  }, []);

  // Still loading if the query hasn't resolved yet or init hasn't finished.
  const isLoading = user === undefined || !initDone;

  return {
    isLoading,
    isAuthenticated: !!user,
    user,
    signIn,
    signOut,
  };
}
