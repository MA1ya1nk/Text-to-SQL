"use client";

import { useEffect, useState } from "react";
import { ERDiagram } from "@/components/ERDiagram";
import { SchemaExplorer } from "@/components/SchemaExplorer";
import { fetchSchema, refreshSchema } from "@/lib/api";
import { SchemaResponse } from "@/lib/types";

export default function SchemaPage() {
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const loadSchema = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = forceRefresh ? await refreshSchema() : await fetchSchema();
      setSchema(data);
      if (!selectedTable || !data.tables[selectedTable]) {
        setSelectedTable(Object.keys(data.tables)[0] || "");
      }
    } catch {
      setSchema(null);
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
            <h1 className="text-2xl font-semibold">
              <span className="gradient-title">Schema Explorer</span>
            </h1>
          </div>
          <button className="primary-btn" onClick={() => loadSchema(true)} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Schema"}
          </button>
        </div>
      </section>
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
