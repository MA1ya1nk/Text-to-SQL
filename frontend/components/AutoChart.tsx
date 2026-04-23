"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type Props = {
  columns: string[];
  rows: Array<Array<string | number | null>>;
  chart: { type: string; xKey: string | null; yKey: string | null };
};

const colors = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

function prettify(text: string | null) {
  if (!text) return "";
  return text
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCompact(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return String(value ?? "");
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export function AutoChart({ columns, rows, chart }: Props) {
  if (!chart.xKey || !chart.yKey || chart.type === "table" || chart.type === "none") {
    return <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-600">No chart suggested for this result.</div>;
  }
  const data = rows.map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i]])));
  const isDenseXAxis = data.length > 12;
  const xTickAngle = isDenseXAxis ? -35 : 0;
  const xTickHeight = isDenseXAxis ? 70 : 35;
  const title = `${prettify(chart.yKey)} by ${prettify(chart.xKey)}`;

  if (chart.type === "line") {
    return (
      <div className="overflow-auto rounded-xl border border-slate-200/80 bg-white/80 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">Line Chart</span>
        </div>
        <div className="h-[360px] min-w-[720px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 16, right: 24, left: 28, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
              <XAxis
                dataKey={chart.xKey}
                angle={xTickAngle}
                textAnchor={xTickAngle ? "end" : "middle"}
                interval="preserveStartEnd"
                minTickGap={20}
                tick={{ fontSize: 12, fill: "#475569" }}
                height={xTickHeight}
              />
              <YAxis width={75} tick={{ fontSize: 12, fill: "#475569" }} tickFormatter={formatCompact} />
              <Tooltip
                formatter={(value: unknown, name: string) => [formatCompact(value), prettify(name)]}
                labelFormatter={(value) => `${prettify(chart.xKey)}: ${String(value)}`}
              />
              <Legend />
              <Line type="monotone" dataKey={chart.yKey} stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
  if (chart.type === "pie") {
    return (
      <div className="overflow-auto rounded-xl border border-slate-200/80 bg-white/80 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">Pie Chart</span>
        </div>
        <div className="h-[360px] min-w-[720px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey={chart.yKey}
                nameKey={chart.xKey}
                outerRadius={120}
                labelLine={false}
                label={({ name, percent }) => `${String(name)} (${((percent || 0) * 100).toFixed(0)}%)`}
              >
                {data.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: unknown, name: string) => [formatCompact(value), prettify(name)]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-auto rounded-xl border border-slate-200/80 bg-white/80 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">Bar Chart</span>
      </div>
      <div className="h-[360px] min-w-[720px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 24, left: 28, bottom: 48 }} barCategoryGap="18%">
            <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
            <XAxis
              dataKey={chart.xKey}
              angle={xTickAngle}
              textAnchor={xTickAngle ? "end" : "middle"}
              interval="preserveStartEnd"
              minTickGap={20}
              tick={{ fontSize: 12, fill: "#475569" }}
              height={xTickHeight}
            />
            <YAxis width={75} tick={{ fontSize: 12, fill: "#475569" }} tickFormatter={formatCompact} />
            <Tooltip
              formatter={(value: unknown, name: string) => [formatCompact(value), prettify(name)]}
              labelFormatter={(value) => `${prettify(chart.xKey)}: ${String(value)}`}
            />
            <Legend />
            <Bar dataKey={chart.yKey} fill="#2563eb" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
