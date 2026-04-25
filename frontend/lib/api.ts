import { FavoriteItem, QueryResponse, SchemaResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export class ApiError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

async function parseApiError(res: Response, fallbackMessage: string): Promise<ApiError> {
  const data = await res.json().catch(() => ({}));
  const message = data.error || fallbackMessage;
  return new ApiError(message, data.code, res.status);
}

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

export async function runQuery(question: string): Promise<QueryResponse> {
  const endpoint = "/api/query/";
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });
  if (!res.ok) throw await parseApiError(res, "Query failed");
  const data = await res.json();
  return data;
}

export async function previewQuery(question: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/query/preview/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });
  if (!res.ok) throw await parseApiError(res, "SQL generation failed");
  const data = await res.json();
  return data.sql || "";
}

export async function executeQuery(question: string, sql: string): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE}/api/query/execute/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, sql })
  });
  if (!res.ok) throw await parseApiError(res, "Query execution failed");
  const data = await res.json();
  return data;
}

export async function explainQuery(sql: string, question = ""): Promise<string> {
  const res = await fetch(`${API_BASE}/api/explain/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql, question })
  });
  if (!res.ok) throw await parseApiError(res, "Explanation failed");
  const data = await res.json();
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
  if (!res.ok) throw await parseApiError(res, "Failed to save favorite");
  const data = await res.json();
  return data;
}

export async function deleteFavorite(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/favorites/${id}/`, { method: "DELETE" });
  if (!res.ok) {
    throw await parseApiError(res, "Failed to delete favorite");
  }
}
