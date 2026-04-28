"use client";

type Props = {
  explanation: string;
  loading: boolean;
  onExplain: () => void;
};

export function QueryExplanation({ explanation, loading, onExplain }: Props) {
  return (
    <div className="card space-y-3 text-sm leading-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">Business Explanation</h3>
        <button onClick={onExplain} disabled={loading} className="ghost-btn disabled:opacity-50">
          {loading ? "Explaining..." : explanation ? "Regenerate Explanation" : "Explain Query"}
        </button>
      </div>
      {explanation ? (
        <p className="rounded-xl border border-sky-100 bg-sky-50/60 p-3 text-slate-700">{explanation}</p>
      ) : (
        <p className="text-slate-500">Generate a business-friendly explanation of this SQL before executing.</p>
      )}
    </div>
  );
}
