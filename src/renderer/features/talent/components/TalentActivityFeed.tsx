export function TalentActivityFeed({ reports }: { reports: any[] }) {
  return (
    <div className="flex-1 p-6 overflow-y-auto font-sans">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-6">
        Real-time Evaluations
      </h4>
      <div className="space-y-6">
        {reports.slice(0, 10).reverse().map((report, i) => (
          <div key={report.reportId} className="flex gap-4 relative">
            {i < Math.min(reports.length, 3) - 1 && (
              <div className="absolute left-[7px] top-6 bottom-[-24px] w-[1px] bg-primary/20" />
            )}
            <div className="w-4 h-4 rounded-full flex-shrink-0 mt-1 bg-primary ring-4 ring-primary/10" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-heading">
                Report Generated
              </p>
              <p className="text-[10px] text-subtle leading-relaxed italic">
                AI Assessment complete for{" "}
                {report.candidateName || report.candidateEmail}. Score:{" "}
                {report.score}%.
              </p>
            </div>
          </div>
        ))}
        {reports.length === 0 && (
          <p className="text-[10px] text-subtle italic">
            No recent activity detected.
          </p>
        )}
      </div>
    </div>
  );
}
