"use client";

import { useEffect, useState } from "react";
import { QueryInput } from "@/components/QueryInput";
import { ResultsTable } from "@/components/ResultsTable";
import { AutoChart } from "@/components/AutoChart";
import { SQLDisplay } from "@/components/SQLDisplay";
import { QueryExplanation } from "@/components/QueryExplanation";
import { ConversationThread } from "@/components/ConversationThread";
import { ExportPanel } from "@/components/ExportPanel";
import { executeQuery, explainQuery, previewQuery, saveFavorite } from "@/lib/api";
import { normalizeError } from "@/lib/error-utils";
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
  const [currentErrorCode, setCurrentErrorCode] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);
  const { loading, setLoading, addConversation, conversation } = useAssistantStore();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const formatError = (error: unknown) => normalizeError(error);

  const onSubmit = async (question: string) => {
    setLoading(true);
    setCurrentQuestion(question);
    setResult(null);
    setDraftSql("");
    setExplanation("");
    setCurrentError("");
    setCurrentErrorCode("");
    try {
      const sql = await previewQuery(question);
      setDraftSql(sql);
      setTab("sql");
    } catch (error) {
      const details = formatError(error);
      setCurrentError(details.message);
      setCurrentErrorCode(details.code);
      addConversation({ question, error: details.message });
    } finally {
      setLoading(false);
    }
  };

  const onExecute = async () => {
    if (!currentQuestion || !draftSql.trim()) return;
    setExecuteLoading(true);
    setCurrentError("");
    setCurrentErrorCode("");
    try {
      const data = await executeQuery(currentQuestion, draftSql);
      setResult(data);
      setDraftSql(data.sql);
      addConversation({ question: currentQuestion, response: data });
      setTab("table");
    } catch (error) {
      const details = formatError(error);
      setCurrentError(details.message);
      setCurrentErrorCode(details.code);
      addConversation({ question: currentQuestion || "Manual SQL", error: details.message });
    } finally {
      setExecuteLoading(false);
    }
  };

  const onExplain = async () => {
    if (!draftSql.trim()) return;
    setExplainLoading(true);
    setCurrentError("");
    setCurrentErrorCode("");
    try {
      const text = await explainQuery(draftSql, currentQuestion);
      setExplanation(text);
    } catch (error) {
      const details = formatError(error);
      setCurrentError(details.message);
      setCurrentErrorCode(details.code);
      setExplanation(details.message);
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
      const details = formatError(error);
      setCurrentError(details.message);
      setCurrentErrorCode(details.code);
      addConversation({ question: currentQuestion, error: details.message });
      setToast({
        type: "error",
        title: "Could not save favorite",
        message: details.message
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
        <div className="order-2 space-y-4 lg:order-1 lg:col-span-3">
          <QueryInput onSubmit={onSubmit} loading={loading} />
          {currentError && (
            <div className={currentErrorCode === "schema_out_of_scope" ? "schema-callout" : "error-callout"}>
              <p className={currentErrorCode === "schema_out_of_scope" ? "schema-title" : "error-title"}>
                {currentErrorCode === "schema_out_of_scope" ? "Schema mismatch" : "Request could not be completed"}
              </p>
              <p className="error-detail">{currentError}</p>
              {currentErrorCode === "schema_out_of_scope" && (
                <a href="/schema" className="mt-3 inline-flex items-center rounded-lg border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200 sm:text-sm">
                  Open Schema Explorer
                </a>
              )}
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
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                      tab === item
                        ? "bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-lg shadow-indigo-500/25"
                        : "border border-slate-200 bg-white/80 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50"
                    }`}
                  >
                    {item.toUpperCase()}
                  </button>
                ))}
                <button
                  onClick={onSaveFavorite}
                  disabled={!draftSql.trim()}
                  className="ghost-btn text-xs disabled:opacity-50 sm:text-sm"
                >
                  Save Favorite
                </button>
                {result && (
                  <span className="ml-auto inline-flex items-center rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 sm:text-sm">
                    {result.rows.length} rows · {result.columns.length} columns
                  </span>
                )}
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
        <div className="order-1 lg:order-2">
          <ConversationThread entries={conversation} />
        </div>
      </div>
    </div>
  );
}
