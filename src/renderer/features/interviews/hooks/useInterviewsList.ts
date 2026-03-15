import { useState, useCallback, useEffect, useMemo } from "react";
import { interviewsApi } from "@/api/interviews.api";
import { extractApiError } from "@/lib/api-error";
import type { InterviewListItem } from "@shared/schemas/interview.schema";

export type TabFilter = "all" | "UPCOMING" | "COMPLETED" | "LIVE";

export function useInterviewsList() {
  const [interviews, setInterviews] = useState<InterviewListItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await interviewsApi.getInterviews();
      setInterviews(data);
    } catch (error) {
      console.error(extractApiError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const filteredInterviews = useMemo(() => {
    if (activeTab === "all") return interviews;
    const statusMap: Record<string, string> = {
      LIVE: "ACTIVE",
      UPCOMING: "UPCOMING",
      COMPLETED: "COMPLETED"
    };
    return interviews.filter((i) => i.status === (statusMap[activeTab] || activeTab));
  }, [interviews, activeTab]);

  const pagedInterviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInterviews.slice(start, start + itemsPerPage);
  }, [filteredInterviews, currentPage]);

  const stats = useMemo(() => ({
    all: interviews.length,
    upcoming: interviews.filter(i => i.status === "UPCOMING").length,
    completed: interviews.filter(i => i.status === "COMPLETED").length,
    live: interviews.filter(i => i.status === "ACTIVE").length
  }), [interviews]);

  return {
    interviews,
    activeTab,
    setActiveTab,
    loading,
    currentPage,
    setCurrentPage,
    pagedInterviews,
    filteredInterviews,
    stats,
    fetchInterviews,
    itemsPerPage
  };
}
