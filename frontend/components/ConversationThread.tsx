"use client";

type Entry = { question: string; response?: { sql: string }; error?: string };

export function ConversationThread({ entries }: { entries: Entry[] }) {
  return (
    <div className="card min-w-0 space-y-3">
      <h3 className="font-semibold text-slate-800">Conversation</h3>
      {entries.length === 0 && <p className="text-sm text-slate-500">No questions yet.</p>}
      {entries.map((item, idx) => (
        <div key={idx} className="min-w-0 rounded-xl border border-slate-200/80 bg-white/75 p-3 text-sm shadow-sm">
          <p className="break-words whitespace-pre-wrap font-medium text-slate-800">Q: {item.question}</p>
          {item.response?.sql && (
            <div className="sql-shell mt-2">
              <span className="sql-label">SQL</span>
              <pre className="sql-text">{item.response.sql}</pre>
            </div>
          )}
          {item.error && (
            <div className="error-callout mt-2">
              <p className="error-title text-xs">Execution issue</p>
              <p className="error-detail break-all text-xs">{item.error}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
