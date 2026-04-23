import { FavoriteItem, QueryResponse, SchemaResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function fetchSchema(): Promise<SchemaResponse> {
  const res = await fetch(`${API_BASE}/api/schema/`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch schema");
  return res.json();
}

export async function refreshSchema(): Promise<SchemaResponse> {
  const res = await fetch(`${API_BASE}/api/schema/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) throw new Error("Failed to refresh schema");
  return res.json();
}

export async function fetchSuggestions(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/schema/suggestions/`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.suggestions || [];
}

export async function runQuery(question: string, context = ""): Promise<QueryResponse> {
  const endpoint = context ? "/api/query/followup/" : "/api/query/";
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, context })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Query failed");
  return data;
}

export async function previewQuery(question: string, context = ""): Promise<string> {
  const res = await fetch(`${API_BASE}/api/query/preview/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, context })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "SQL generation failed");
  return data.sql || "";
}

export async function executeQuery(question: string, sql: string): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE}/api/query/execute/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, sql })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Query execution failed");
  return data;
}

export async function explainQuery(sql: string, question = ""): Promise<string> {
  const res = await fetch(`${API_BASE}/api/explain/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql, question })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Explanation failed");
  return data.explanation || "";
}

export async function fetchHistory() {
  const res = await fetch(`${API_BASE}/api/history/`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchFavorites(): Promise<FavoriteItem[]> {
  const res = await fetch(`${API_BASE}/api/favorites/`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function saveFavorite(payload: { title?: string; question: string; sql_query: string }): Promise<FavoriteItem> {
  const res = await fetch(`${API_BASE}/api/favorites/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to save favorite");
  return data;
}

export async function deleteFavorite(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/favorites/${id}/`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete favorite");
  }
}
