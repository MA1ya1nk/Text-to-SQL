"use client";

type Relation = { table: string; column: string; ref_table: string; ref_column: string };

type Props = {
  relations: Relation[];
  selectedTable: string;
  onSelectTable: (table: string) => void;
};

export function ERDiagram({ relations, selectedTable, onSelectTable }: Props) {
  const visible = selectedTable
    ? relations.filter((r) => r.table === selectedTable || r.ref_table === selectedTable)
    : relations;

  return (
    <div className="card min-w-0">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-800">Relationship Map</h3>
        <p className="text-xs text-slate-500">{visible.length} shown</p>
      </div>
      <div className="space-y-2 text-sm">
        {visible.length === 0 && <p className="text-slate-500">No relationships for selected table.</p>}
        {visible.slice(0, 60).map((r, idx) => (
          <div
            key={idx}
            className={`flex flex-col gap-2 rounded-lg border px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center ${
              selectedTable && (r.table === selectedTable || r.ref_table === selectedTable)
                ? "border-indigo-200 bg-indigo-50/60"
                : "border-slate-200/70 bg-white/75"
            }`}
          >
            <button
              className="w-full rounded-md bg-white px-2 py-1 text-left font-mono text-xs text-slate-700 hover:bg-slate-100 sm:w-auto"
              onClick={() => onSelectTable(r.table)}
            >
              <span className="break-all">{r.table}.{r.column}</span>
            </button>
            <span className="hidden text-slate-400 sm:inline">→</span>
            <button
              className="w-full rounded-md bg-white px-2 py-1 text-left font-mono text-xs text-slate-700 hover:bg-slate-100 sm:w-auto"
              onClick={() => onSelectTable(r.ref_table)}
            >
              <span className="break-all">{r.ref_table}.{r.ref_column}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
