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

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function AutoChart({ columns, rows, chart }: Props) {
  if (!chart.xKey || !chart.yKey || chart.type === "table" || chart.type === "none") {
    return <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-600">No chart suggested for this result.</div>;
  }
  const hasXKey = columns.includes(chart.xKey);
  const hasYKey = columns.includes(chart.yKey);
  if (!hasXKey || !hasYKey) {
    return <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-600">No chart suggested for this result.</div>;
  }

  const data = rows
    .map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i]])))
    .map((row) => {
      const numericY = toNumber(row[chart.yKey!]);
      return {
        ...row,
        [chart.yKey!]: numericY
      };
    })
    .filter((row) => row[chart.xKey!] !== null && row[chart.xKey!] !== undefined && row[chart.yKey!] !== null);

  const uniqueXCount = new Set(data.map((row) => String(row[chart.xKey!]))).size;
  const numericYCount = data.filter((row) => typeof row[chart.yKey!] === "number").length;
  if (numericYCount < Math.max(3, Math.floor(data.length * 0.6)) || uniqueXCount < 2) {
    return <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-600">No chart suggested for this result.</div>;
  }

  const isDenseXAxis = data.length > 12 || uniqueXCount > 12;
  const xTickAngle = isDenseXAxis ? -35 : 0;
  const xTickHeight = isDenseXAxis ? 92 : 44;
  const xAxisLabelOffset = isDenseXAxis ? 26 : 12;
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
            <LineChart data={data} margin={{ top: 16, right: 24, left: 16, bottom: 64 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
              <XAxis
                dataKey={chart.xKey}
                angle={xTickAngle}
                textAnchor={xTickAngle ? "end" : "middle"}
                interval="preserveStartEnd"
                minTickGap={20}
                tickMargin={8}
                tick={{ fontSize: 12, fill: "#475569" }}
                height={xTickHeight}
                label={{ value: prettify(chart.xKey), position: "insideBottom", offset: -xAxisLabelOffset, fill: "#334155", fontSize: 12 }}
              />
              <YAxis
                width={86}
                tick={{ fontSize: 12, fill: "#475569" }}
                tickFormatter={formatCompact}
                tickMargin={8}
                label={{
                  value: prettify(chart.yKey),
                  angle: -90,
                  position: "insideLeft",
                  offset: -4,
                  fill: "#334155",
                  fontSize: 12
                }}
              />
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
          <BarChart data={data} margin={{ top: 16, right: 24, left: 16, bottom: 64 }} barCategoryGap="18%">
            <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
            <XAxis
              dataKey={chart.xKey}
              angle={xTickAngle}
              textAnchor={xTickAngle ? "end" : "middle"}
              interval="preserveStartEnd"
              minTickGap={20}
              tickMargin={8}
              tick={{ fontSize: 12, fill: "#475569" }}
              height={xTickHeight}
              label={{ value: prettify(chart.xKey), position: "insideBottom", offset: -xAxisLabelOffset, fill: "#334155", fontSize: 12 }}
            />
            <YAxis
              width={86}
              tick={{ fontSize: 12, fill: "#475569" }}
              tickFormatter={formatCompact}
              tickMargin={8}
              label={{
                value: prettify(chart.yKey),
                angle: -90,
                position: "insideLeft",
                offset: -4,
                fill: "#334155",
                fontSize: 12
              }}
            />
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
