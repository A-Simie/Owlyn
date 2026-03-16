import { motion } from "framer-motion";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-6 border-t border-white/5 bg-black/20">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-2 text-slate-500 hover:text-primary disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
      >
        <span className="material-symbols-outlined text-xl">chevron_left</span>
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }).map((_, i) => {
          const page = i + 1;
          const isActive = page === currentPage;

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`relative min-w-[32px] h-8 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm ${
                isActive
                  ? "text-black z-10"
                  : "text-slate-500 hover:text-slate-300 bg-white/5 border border-white/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="pagination-active"
                  className="absolute inset-0 bg-primary rounded-sm -z-10"
                />
              )}
              {page.toString().padStart(2, "0")}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-2 text-slate-500 hover:text-primary disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
      >
        <span className="material-symbols-outlined text-xl">chevron_right</span>
      </button>

      <div className="ml-4 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
        Page <span className="text-slate-400">{currentPage}</span> of{" "}
        <span className="text-slate-400">{totalPages}</span>
      </div>
    </div>
  );
}
