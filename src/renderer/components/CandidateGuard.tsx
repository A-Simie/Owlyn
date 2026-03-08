import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

type GuardStatus = "checking" | "authorized" | "unauthorized";

export default function CandidateGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [status, setStatus] = useState<GuardStatus>("checking");

  useEffect(() => {
    const guestToken = localStorage.getItem("owlyn_guest_token");
    const accessCode = localStorage.getItem("owlyn_access_code");
    const practiceMode = localStorage.getItem("owlyn_practice_mode") === "true";

    if (practiceMode || (guestToken && accessCode)) {
      setStatus("authorized");
    } else {
      setStatus("unauthorized");
    }
  }, [location.pathname]);

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
