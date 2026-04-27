"use client";

import { useMemo, useState } from "react";
import { SchemaResponse } from "@/lib/types";

type Props = {
  schema: SchemaResponse | null;
  selectedTable: string;
  onSelectTable: (table: string) => void;
  loading?: boolean;
};

export function SchemaExplorer({ schema, selectedTable, onSelectTable, loading = false }: Props) {
  const [search, setSearch] = useState("");

  const tableNames = useMemo(
    () =>
      Object.keys(schema?.tables || {})
        .sort()
        .filter((table) => table.toLowerCase().includes(search.toLowerCase().trim())),
    [schema, search]
  );
  if (loading && !schema) return <div className="card">Loading schema...</div>;
  if (!schema) return <div className="card">Unable to load schema.</div>;
  const activeTable = selectedTable && schema.tables[selectedTable] ? selectedTable : tableNames[0] || "";
  const activeData = activeTable ? schema.tables[activeTable] : null;
  const pkColumns = new Set(
    (schema.relationships?.primary_keys || []).filter((pk) => pk.table === activeTable).map((pk) => pk.column)
  );
  const outboundFks = (schema.relationships?.foreign_keys || []).filter((fk) => fk.table === activeTable);
  const inboundFks = (schema.relationships?.foreign_keys || []).filter((fk) => fk.ref_table === activeTable);

  const safeRows = activeData?.sample_rows || [];
  const safeCols = activeData?.sample_columns || [];

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <aside className="card min-w-0 lg:col-span-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Tables</h3>
        <input
          className="soft-input mb-3 w-full text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tables..."
        />
        <div className="max-h-[18rem] space-y-2 overflow-auto pr-1 sm:max-h-[32rem]">
          {tableNames.length === 0 && <p className="text-sm text-slate-500">No matching tables.</p>}
          {tableNames.map((table) => {
            const isActive = table === activeTable;
            return (
              <button
                key={table}
                onClick={() => onSelectTable(table)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                  isActive
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm"
                    : "border-slate-200/80 bg-white/70 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50"
                }`}
              >
                <div className="truncate text-sm font-medium">{table}</div>
                <div className="mt-1 text-xs text-slate-500">{schema.tables[table].columns.length} columns</div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="card min-w-0 space-y-4 lg:col-span-8">
        {!activeData ? (
          <p className="text-sm text-slate-500">No table available.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-slate-800 sm:text-xl">{activeTable}</h3>
                <p className="text-sm text-slate-500">
                  {activeData.columns.length} columns · {activeData.row_count ?? safeRows.length} rows
                </p>
              </div>
              <div className="w-fit rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                Live metadata
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/80">
              <div className="border-b border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Columns</div>
              <div className="max-h-64 overflow-auto">
                <table className="w-full min-w-[560px] text-xs sm:text-sm">
                  <thead className="sticky top-0 bg-slate-50/90">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Type</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeData.columns.map((col) => (
                      <tr key={col.name} className="border-t border-slate-100">
                        <td className="max-w-48 px-3 py-2 font-mono text-xs text-slate-700">{col.name}</td>
                        <td className="max-w-44 px-3 py-2 text-slate-600">{col.type}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1.5">
                            {pkColumns.has(col.name) && (
                              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">PK</span>
                            )}
                            {col.unique && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">UNIQUE</span>
                            )}
                            {col.nullable ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">NULLABLE</span>
                            ) : (
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">REQUIRED</span>
                            )}
                            {outboundFks.some((fk) => fk.column === col.name) && (
                              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">FK</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3">
                <h4 className="mb-2 text-sm font-semibold text-slate-700">Outbound Relations</h4>
                <div className="space-y-2 text-sm">
                  {outboundFks.length === 0 && <p className="text-slate-500">No outbound foreign keys.</p>}
                  {outboundFks.map((fk, idx) => (
                    <button
                      key={`${fk.table}-${fk.column}-${idx}`}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-left text-xs text-slate-700 hover:border-indigo-200 hover:bg-indigo-50"
                      onClick={() => onSelectTable(fk.ref_table)}
                    >
                      <span className="break-all font-mono">{fk.column}</span> →{" "}
                      <span className="break-all font-mono">{fk.ref_table}.{fk.ref_column}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3">
                <h4 className="mb-2 text-sm font-semibold text-slate-700">Inbound Relations</h4>
                <div className="space-y-2 text-sm">
                  {inboundFks.length === 0 && <p className="text-slate-500">No inbound foreign keys.</p>}
                  {inboundFks.map((fk, idx) => (
                    <button
                      key={`${fk.ref_table}-${fk.ref_column}-${idx}`}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-left text-xs text-slate-700 hover:border-indigo-200 hover:bg-indigo-50"
                      onClick={() => onSelectTable(fk.table)}
                    >
                      <span className="break-all font-mono">{fk.table}.{fk.column}</span> →{" "}
                      <span className="break-all font-mono">{fk.ref_column}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/80">
              <div className="border-b border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Sample rows</div>
              {safeRows.length === 0 ? (
                <p className="p-3 text-sm text-slate-500">No sample rows available.</p>
              ) : (
                <div className="max-h-72 overflow-auto">
                  <table className="w-full min-w-[640px] text-xs sm:text-sm">
                    <thead className="sticky top-0 bg-slate-50/90">
                      <tr>
                        {safeCols.map((col) => (
                          <th key={col} className="whitespace-nowrap px-3 py-2 text-left font-semibold text-slate-700">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {safeRows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-t border-slate-100">
                          {row.map((cell, cellIdx) => (
                            <td key={`${rowIdx}-${cellIdx}`} className="max-w-48 truncate px-3 py-2 text-slate-600 sm:max-w-64">
                              {String(cell ?? "NULL")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
