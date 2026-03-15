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
    // 1. Define status order: ACTIVE -> UPCOMING -> COMPLETED -> CANCELLED
    const statusOrder: Record<string, number> = {
      ACTIVE: 0,
      UPCOMING: 1,
      COMPLETED: 2,
      CANCELLED: 3,
    };

    // 2. Sort all interviews by status (case-insensitive)
    const sorted = [...interviews].sort((a, b) => {
      const sA = (a.status || "").toUpperCase();
      const sB = (b.status || "").toUpperCase();
      const orderA = statusOrder[sA] ?? 99;
      const orderB = statusOrder[sB] ?? 99;
      
      if (orderA !== orderB) return orderA - orderB;
      return 0; // Maintain stable order for same status
    });

    // 3. Apply tab filter to sorted list
    if (activeTab === "all") return sorted;
    const statusMap: Record<string, string> = {
      LIVE: "ACTIVE",
      UPCOMING: "UPCOMING",
      COMPLETED: "COMPLETED"
    };
    return sorted.filter((i) => i.status === (statusMap[activeTab] || activeTab));
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
