"use client";

import { useEffect, useState } from "react";
import { ERDiagram } from "@/components/ERDiagram";
import { SchemaExplorer } from "@/components/SchemaExplorer";
import { fetchSchema, refreshSchema } from "@/lib/api";
import { normalizeError } from "@/lib/error-utils";
import { SchemaResponse } from "@/lib/types";

export default function SchemaPage() {
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadSchema = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = forceRefresh ? await refreshSchema() : await fetchSchema();
      setSchema(data);
      setLoadError("");
      if (!selectedTable || !data.tables[selectedTable]) {
        setSelectedTable(Object.keys(data.tables)[0] || "");
      }
    } catch (error) {
      setSchema(null);
      setLoadError(normalizeError(error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchema();
  }, []);

  return (
    <div className="space-y-4">
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-600/90">Database Blueprint</p>
            <h1 className="text-xl font-semibold sm:text-2xl">
              <span className="gradient-title">Schema Explorer</span>
            </h1>
          </div>
          <button className="primary-btn w-full sm:w-auto" onClick={() => loadSchema(true)} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Schema"}
          </button>
        </div>
      </section>
      {loadError && (
        <div className="error-callout">
          <p className="error-title">Could not load schema</p>
          <p className="error-detail">{loadError}</p>
        </div>
      )}
      <SchemaExplorer
        schema={schema}
        selectedTable={selectedTable}
        onSelectTable={setSelectedTable}
        loading={loading}
      />
      <ERDiagram
        relations={schema?.relationships?.foreign_keys || []}
        selectedTable={selectedTable}
        onSelectTable={setSelectedTable}
      />
    </div>
  );
}
