import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";

export function useAuth() {
  const user = useQuery(api.users.current);
  const { signIn, signOut } = useAuthActions();
  const isLoading = user === undefined;

  return {
    isLoading,
    isAuthenticated: !!user,
    user,
    signIn,
    signOut,
  };
}
