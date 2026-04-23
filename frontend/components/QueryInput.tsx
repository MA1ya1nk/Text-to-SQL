"use client";

import { useEffect, useState } from "react";
import { fetchSuggestions } from "@/lib/api";

type Props = { onSubmit: (question: string) => void; loading: boolean };

export function QueryInput({ onSubmit, loading }: Props) {
  const [question, setQuestion] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    fetchSuggestions().then(setSuggestions).catch(() => setSuggestions([]));
  }, []);

  return (
    <div className="card space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-indigo-600/90">Query Builder</p>
        <h2 className="text-lg font-semibold text-slate-800">Describe what you want to analyze</h2>
      </div>
      <textarea
        className="soft-input w-full resize-y"
        rows={3}
        placeholder="Ask about sales, customers, products..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {suggestions.slice(0, 4).map((s) => (
          <button key={s} className="ghost-btn text-xs" onClick={() => setQuestion(s)}>
            {s}
          </button>
        ))}
      </div>
      <button
        disabled={loading || !question.trim()}
        onClick={() => onSubmit(question)}
        className="primary-btn"
      >
        {loading ? "Generating SQL..." : "Generate SQL"}
      </button>
    </div>
  );
}
