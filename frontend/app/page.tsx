"use client";

import { useEffect, useState } from "react";
import { QueryInput } from "@/components/QueryInput";
import { ResultsTable } from "@/components/ResultsTable";
import { AutoChart } from "@/components/AutoChart";
import { SQLDisplay } from "@/components/SQLDisplay";
import { QueryExplanation } from "@/components/QueryExplanation";
import { ConversationThread } from "@/components/ConversationThread";
import { ExportPanel } from "@/components/ExportPanel";
import { ApiError, executeQuery, explainQuery, previewQuery, saveFavorite } from "@/lib/api";
import { QueryResponse } from "@/lib/types";
import { useAssistantStore } from "@/store/assistant-store";

export default function HomePage() {
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [tab, setTab] = useState<"table" | "chart" | "sql">("table");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [draftSql, setDraftSql] = useState("");
  const [explanation, setExplanation] = useState("");
  const [explainLoading, setExplainLoading] = useState(false);
  const [executeLoading, setExecuteLoading] = useState(false);
  const [currentError, setCurrentError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);
  const { loading, setLoading, addConversation, conversation } = useAssistantStore();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const formatError = (error: unknown) => {
    const apiError = error as ApiError;
    const message = apiError?.message || "Unable to process this request right now.";
    const code = apiError?.code || "";

    if (message.toLowerCase().includes("cannot be answered from the current schema")) {
      return "This question is outside the connected schema. Try using available tables/columns from the Schema page.";
    }
    if (code === "rate_limit") {
      return "We are experiencing high traffic right now. Please wait a moment and try again.";
    }
    if (code === "provider_auth") {
      return "LLM provider authentication failed. Please verify API keys in backend configuration.";
    }
    if (code === "provider_unavailable") {
      return "The AI provider is temporarily unavailable. Please retry in a few moments.";
    }
    return message;
  };

  const onSubmit = async (question: string) => {
    setLoading(true);
    setCurrentQuestion(question);
    setResult(null);
    setDraftSql("");
    setExplanation("");
    setCurrentError("");
    try {
      const sql = await previewQuery(question);
      setDraftSql(sql);
      setTab("sql");
    } catch (error) {
      const message = formatError(error);
      setCurrentError(message);
      addConversation({ question, error: message });
    } finally {
      setLoading(false);
    }
  };

  const onExecute = async () => {
    if (!currentQuestion || !draftSql.trim()) return;
    setExecuteLoading(true);
    setCurrentError("");
    try {
      const data = await executeQuery(currentQuestion, draftSql);
      setResult(data);
      setDraftSql(data.sql);
      addConversation({ question: currentQuestion, response: data });
      setTab("table");
    } catch (error) {
      const message = formatError(error);
      setCurrentError(message);
      addConversation({ question: currentQuestion || "Manual SQL", error: message });
    } finally {
      setExecuteLoading(false);
    }
  };

  const onExplain = async () => {
    if (!draftSql.trim()) return;
    setExplainLoading(true);
    setCurrentError("");
    try {
      const text = await explainQuery(draftSql, currentQuestion);
      setExplanation(text);
    } catch (error) {
      const message = formatError(error);
      setCurrentError(message);
      setExplanation(message);
    } finally {
      setExplainLoading(false);
    }
  };

  const onSaveFavorite = async () => {
    if (!currentQuestion || !draftSql.trim()) return;
    try {
      await saveFavorite({
        title: currentQuestion.slice(0, 80),
        question: currentQuestion,
        sql_query: draftSql
      });
      setToast({
        type: "success",
        title: "Saved to favorites",
        message: "Your query was saved successfully. You can view it on the Favorites page."
      });
    } catch (error) {
      const message = formatError(error);
      setCurrentError(message);
      addConversation({ question: currentQuestion, error: message });
      setToast({
        type: "error",
        title: "Could not save favorite",
        message
      });
    }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
          <p className={`toast-title ${toast.type === "success" ? "text-emerald-700" : "text-red-700"}`}>{toast.title}</p>
          <p className="toast-message">{toast.message}</p>
        </div>
      )}
      <section className="card relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-600/90">Natural Language to SQL</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          <span className="gradient-title">Ask business questions, get trusted SQL instantly</span>
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Generate, explain, edit, and execute SQL with a polished analytics workflow.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-4">
      <div className="space-y-4 lg:col-span-3">
        <QueryInput onSubmit={onSubmit} loading={loading} />
        {currentError && (
          <div className="error-callout">
            <p className="error-title">Request could not be completed</p>
            <p className="error-detail">{currentError}</p>
          </div>
        )}
        {draftSql && <QueryExplanation explanation={explanation} loading={explainLoading} onExplain={onExplain} />}
        {draftSql && (
          <div className="card space-y-3">
            <div className="flex flex-wrap gap-2">
              {["table", "chart", "sql"].map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item as "table" | "chart" | "sql")}
                  className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                    tab === item
                      ? "bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-lg shadow-indigo-500/25"
                      : "border border-slate-200 bg-white/80 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50"
                  }`}
                >
                  {item.toUpperCase()}
                </button>
              ))}
              <button onClick={onSaveFavorite} disabled={!draftSql.trim()} className="ghost-btn disabled:opacity-50">
                Save Favorite
              </button>
            </div>
            {tab === "table" && result && <ResultsTable columns={result.columns} rows={result.rows} />}
            {tab === "chart" && result && <AutoChart columns={result.columns} rows={result.rows} chart={result.chart} />}
            {tab === "sql" && (
              <SQLDisplay
                sqlText={draftSql}
                editable
                onSqlChange={setDraftSql}
                onRun={onExecute}
                running={executeLoading}
              />
            )}
          </div>
        )}
        {result && <ExportPanel columns={result.columns} rows={result.rows} />}
      </div>
      <ConversationThread entries={conversation} />
      </div>
    </div>
  );
}
