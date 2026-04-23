"use client";

import { useEffect } from "react";
import { fetchHistory } from "@/lib/api";
import { useAssistantStore } from "@/store/assistant-store";

export default function HistoryPage() {
  const { history, setHistory } = useAssistantStore();

  useEffect(() => {
    fetchHistory().then(setHistory).catch(() => setHistory([]));
  }, [setHistory]);

  return (
    <div className="card">
      <p className="text-xs uppercase tracking-[0.2em] text-indigo-600/90">Audit Trail</p>
      <h2 className="mb-3 text-2xl font-semibold">
        <span className="gradient-title">Query History</span>
      </h2>
      <div className="space-y-3">
        {history.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200/80 bg-white/80 p-3 text-sm">
            <p><strong>Question:</strong> {String(item.question || "")}</p>
            <div className="sql-shell mt-2">
              <span className="sql-label">SQL</span>
              <pre className="sql-text">{String(item.sql_query || "")}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
