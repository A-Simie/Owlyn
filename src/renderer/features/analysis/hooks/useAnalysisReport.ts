import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { reportsApi, type Report } from "@/api/reports.api";

export function useAnalysisReport() {
  const { sessionId: interviewId } = useParams();
  const { user } = useAuthStore();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const isPublicMode = !user;

    const fetchReport = async () => {
      if (!interviewId || isCancelled) return;
      try {
        const data = isPublicMode 
          ? await reportsApi.getPublicReport(interviewId)
          : await reportsApi.getReport(interviewId);

        if (isCancelled) return;
        setReport(data);
        if (isPublicMode) {
          localStorage.setItem(`owlyn_ephemeral_${interviewId}`, JSON.stringify(data));
        }
        setLoading(false);
      } catch (err: any) {
        if (isCancelled) return;
        if (isPublicMode) {
          const cached = localStorage.getItem(`owlyn_ephemeral_${interviewId}`);
          if (cached) {
            try {
              setReport(JSON.parse(cached));
              setLoading(false);
              return;
            } catch (e) {}
          }
        }
        setError(err?.response?.data?.message || err?.message || "Report not ready yet.");
        setLoading(false);
      }
    };

    fetchReport();
    return () => { isCancelled = true; };
  }, [interviewId, user]);

  return { report, loading, error, interviewId };
}
