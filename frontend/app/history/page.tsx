"use client";

import { useEffect } from "react";
import { fetchHistory } from "@/lib/api";
import { normalizeError } from "@/lib/error-utils";
import { useAssistantStore } from "@/store/assistant-store";
import { useState } from "react";

export default function HistoryPage() {
  const { history, setHistory } = useAssistantStore();
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchHistory()
      .then((data) => {
        setHistory(data);
        setLoadError("");
      })
      .catch((error) => {
        setHistory([]);
        setLoadError(normalizeError(error).message);
      });
  }, [setHistory]);

  useEffect(() => {
    setPage(1);
  }, [history.length]);

  const totalPages = Math.max(1, Math.ceil(history.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedHistory = history.slice(startIndex, startIndex + pageSize);

  return (
    <div className="card">
      <p className="text-xs uppercase tracking-[0.2em] text-indigo-600/90">Audit Trail</p>
      <h2 className="mb-3 text-xl font-semibold sm:text-2xl">
        <span className="gradient-title">Query History</span>
      </h2>
      <div className="space-y-3">
        {loadError && (
          <div className="error-callout">
            <p className="error-title">Could not load history</p>
            <p className="error-detail">{loadError}</p>
          </div>
        )}
        {paginatedHistory.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200/80 bg-white/80 p-3 text-xs sm:text-sm">
            <p><strong>Question:</strong> {String(item.question || "")}</p>
            <div className="sql-shell mt-2">
              <span className="sql-label">SQL</span>
              <pre className="sql-text">{String(item.sql_query || "")}</pre>
            </div>
          </div>
        ))}
        {history.length > pageSize && (
          <div className="flex flex-col items-start justify-between gap-2 pt-2 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                className="ghost-btn disabled:opacity-50"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button
                className="ghost-btn disabled:opacity-50"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
