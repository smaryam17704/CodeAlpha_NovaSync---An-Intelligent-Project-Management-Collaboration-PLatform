import { useAuth } from "@/hooks/use-auth";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: '#f4f6f9' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm" style={{ color: '#9da2b3' }}>Loading...</span>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/auth?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  return children;
}
