import { useState, useMemo, useEffect } from "react";
import { reportsApi } from "@/api/reports.api";
import type { Report } from "@/api/reports.api";

export function useTalentPool() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [minScore, setMinScore] = useState(85);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [topPerformer, setTopPerformer] = useState<Report | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [reportsData, topData] = await Promise.all([
          reportsApi.getAllReports(),
          reportsApi.getTopPerformer().catch(() => null)
        ]);
        setReports(reportsData || []);
        setTopPerformer(topData);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const candidates = useMemo(() => {
    return reports.map((r) => ({
      id: r.interviewId,
      name: r.candidateName || r.candidateEmail || "Anonymous",
      score: r.score || 0,
      status: r.finalDecision === "PENDING"
        ? (r.score || 0) > 85
          ? "HIGHLY RECOMMENDED"
          : "Under Review"
        : r.finalDecision,
      statusColor:
        r.finalDecision === "HIRE" ||
        (r.finalDecision === "PENDING" && (r.score || 0) > 85)
          ? "bg-primary/10 text-primary border-primary/20"
          : r.finalDecision === "DECLINE"
            ? "bg-red-500/10 text-red-500 border-red-500/20"
            : "bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20",
      date: "Recent Session",
      online: false,
      isTop: topPerformer?.interviewId === r.interviewId,
      borderPrimary: (r.score || 0) > 85 || topPerformer?.interviewId === r.interviewId,
    }));
  }, [reports, topPerformer]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesScore = (c.score || 0) >= minScore;
      const matchesStatus = !statusFilter || c.status === statusFilter;
      return matchesSearch && matchesScore && matchesStatus;
    });
  }, [candidates, searchQuery, minScore, statusFilter]);

  const pagedCandidates = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCandidates.slice(start, start + itemsPerPage);
  }, [filteredCandidates, currentPage]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this candidate?")) {
      setReports((prev) => prev.filter((r) => r.interviewId !== id));
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(filteredCandidates, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `talent-pool-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    reports,
    loading,
    searchQuery, setSearchQuery,
    roleFilter, setRoleFilter,
    minScore, setMinScore,
    statusFilter, setStatusFilter,
    topPerformer,
    currentPage, setCurrentPage,
    candidates,
    filteredCandidates,
    pagedCandidates,
    handleDelete,
    handleExport,
    itemsPerPage
  };
}
