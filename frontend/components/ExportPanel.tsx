"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { normalizeError } from "@/lib/error-utils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export function ExportPanel({ columns, rows }: { columns: string[]; rows: Array<Array<string | number | null>> }) {
  const [exportError, setExportError] = useState("");
  const [exporting, setExporting] = useState<"csv" | "excel" | "">("");

  const onExport = async (type: "csv" | "excel") => {
    const endpoint = type === "excel" ? "/api/export/excel/" : "/api/export/";
    setExporting(type);
    setExportError("");
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columns, rows })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new ApiError(data.error || "Export failed", data.code, res.status);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = type === "excel" ? "query_results.xlsx" : "query_results.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(normalizeError(error).message);
    } finally {
      setExporting("");
    }
  };
  return (
    <div className="card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Download current result set for sharing or offline analysis.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={() => onExport("csv")} className="ghost-btn w-full sm:w-auto" disabled={exporting !== ""}>
            {exporting === "csv" ? "Exporting CSV..." : "Export CSV"}
          </button>
          <button onClick={() => onExport("excel")} className="primary-btn w-full sm:w-auto" disabled={exporting !== ""}>
            {exporting === "excel" ? "Exporting Excel..." : "Export Excel"}
          </button>
        </div>
      </div>
      {exportError && <p className="mt-2 text-xs text-red-600">{exportError}</p>}
    </div>
  );
}
