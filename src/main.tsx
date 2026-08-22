import "@vly-ai/integrations";
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

const Landing = lazy(() => import("./pages/Landing"));
const AuthPage = lazy(() => import("./pages/Auth"));
const AppShell = lazy(() => import("./pages/AppShell"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(222,47%,8%)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[hsl(192,100%,50%)] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[hsl(220,20%,55%)]">Loading...</span>
      </div>
    </div>
  );
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: "" };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || "Unknown error" };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(222,47%,8%)] text-white p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Something went wrong</p>
            <p className="mt-2 text-xs text-gray-400 break-words">{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthPage redirectAfterAuth="/app" />} />
              <Route path="/app/*" element={<RequireAuth><AppShell /></RequireAuth>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster />
        </BrowserRouter>
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>
);
