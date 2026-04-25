"use client";

import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import sql from "react-syntax-highlighter/dist/esm/languages/hljs/sql";

SyntaxHighlighter.registerLanguage("sql", sql);

type Props = {
  sqlText: string;
  editable?: boolean;
  onSqlChange?: (sqlText: string) => void;
  onRun?: () => void;
  running?: boolean;
};

export function SQLDisplay({ sqlText, editable = false, onSqlChange, onRun, running = false }: Props) {
  if (editable) {
    return (
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">Review and run SQL</h3>
        <div className="sql-shell">
          <span className="sql-label">SQL Editor</span>
          <textarea
            className="min-h-56 w-full rounded-lg border border-indigo-200/60 bg-slate-900 p-3 font-mono text-sm text-sky-100 outline-none transition focus:border-sky-400"
            value={sqlText}
            onChange={(e) => onSqlChange?.(e.target.value)}
          />
        </div>
        <button
          onClick={onRun}
          disabled={running || !sqlText.trim()}
          className="primary-btn"
        >
          {running ? "Running..." : "Run SQL"}
        </button>
      </div>
    );
  }

  return (
    <div className="card overflow-auto">
      <div className="sql-shell">
        <span className="sql-label">Generated SQL</span>
        <SyntaxHighlighter
          language="sql"
          style={atomOneDark}
          wrapLongLines
          customStyle={{ borderRadius: "12px", margin: 0 }}
        >
          {sqlText || "-- SQL will appear here"}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
