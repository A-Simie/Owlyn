import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useCandidateStore } from "@/stores/candidate.store";

type GuardStatus = "checking" | "authorized" | "unauthorized";

export default function CandidateGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [status, setStatus] = useState<GuardStatus>("checking");
  const { token, accessCode, isPracticeMode, hydrated, hydrate } = useCandidateStore();

  useEffect(() => {
    async function checkSecurity() {
      // Ensure store is hydrated from safeStorage before routing
      if (!hydrated) {
        await hydrate();
        return;
      }

      const isAuthorized = isPracticeMode || (!!token && !!accessCode);
      setStatus(isAuthorized ? "authorized" : "unauthorized");
    }
    
    checkSecurity();
  }, [location.pathname, token, accessCode, isPracticeMode, hydrated, hydrate]);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
