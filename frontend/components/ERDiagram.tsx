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
    <div className="card">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-800">Relationship Map</h3>
        <p className="text-xs text-slate-500">{visible.length} shown</p>
      </div>
      <div className="space-y-2 text-sm">
        {visible.length === 0 && <p className="text-slate-500">No relationships for selected table.</p>}
        {visible.slice(0, 60).map((r, idx) => (
          <div
            key={idx}
            className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 ${
              selectedTable && (r.table === selectedTable || r.ref_table === selectedTable)
                ? "border-indigo-200 bg-indigo-50/60"
                : "border-slate-200/70 bg-white/75"
            }`}
          >
            <button
              className="rounded-md bg-white px-2 py-0.5 font-mono text-xs text-slate-700 hover:bg-slate-100"
              onClick={() => onSelectTable(r.table)}
            >
              {r.table}.{r.column}
            </button>
            <span className="text-slate-400">→</span>
            <button
              className="rounded-md bg-white px-2 py-0.5 font-mono text-xs text-slate-700 hover:bg-slate-100"
              onClick={() => onSelectTable(r.ref_table)}
            >
              {r.ref_table}.{r.ref_column}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
