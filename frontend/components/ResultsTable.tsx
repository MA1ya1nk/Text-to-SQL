"use client";

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

type Props = { columns: string[]; rows: Array<Array<string | number | null>> };

export function ResultsTable({ columns, rows }: Props) {
  if (!columns.length) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-600">
        Query executed, but no columns were returned.
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-600">
        No rows matched this query. Try widening your filters or date range.
      </div>
    );
  }

  const helper = createColumnHelper<Record<string, string | number | null>>();
  const data = rows.map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i] ?? ""])));
  const tableColumns = columns.map((c) =>
    helper.accessor(c, {
      header: c,
      cell: (ctx) => String(ctx.getValue() ?? "")
    })
  );

  const table = useReactTable({ data, columns: tableColumns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/80">
      <div className="max-h-[28rem] overflow-auto">
        <table className="w-full min-w-[640px] text-xs sm:text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-slate-200 bg-slate-50/80">
              {hg.headers.map((header) => (
                <th key={header.id} className="whitespace-nowrap px-2 py-2 text-left font-semibold text-slate-700 sm:px-3">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-100 transition hover:bg-indigo-50/50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="max-w-56 px-2 py-2 text-slate-700 sm:px-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
