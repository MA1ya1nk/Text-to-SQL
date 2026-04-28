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

async function requestJson<T>(input: string, init: RequestInit, fallbackMessage: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    if (!res.ok) throw await parseApiError(res, fallbackMessage);
    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out. Please try again.", "request_timeout", 408);
    }
    throw new ApiError("Unable to connect to the server. Please try again.", "network_error");
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSchema(): Promise<SchemaResponse> {
  return requestJson<SchemaResponse>(`${API_BASE}/api/schema/`, { cache: "no-store" }, "Failed to fetch schema");
}

export async function refreshSchema(): Promise<SchemaResponse> {
  return requestJson<SchemaResponse>(`${API_BASE}/api/schema/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, "Failed to refresh schema");
}

export async function fetchSuggestions(): Promise<string[]> {
  const data = await requestJson<{ suggestions?: string[] }>(
    `${API_BASE}/api/schema/suggestions/`,
    { cache: "no-store" },
    "Failed to load suggestions"
  );
  return data.suggestions || [];
}

export async function runQuery(question: string): Promise<QueryResponse> {
  return requestJson<QueryResponse>(`${API_BASE}/api/query/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  }, "Query failed");
}

export async function previewQuery(question: string): Promise<string> {
  const data = await requestJson<{ sql?: string }>(`${API_BASE}/api/query/preview/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  }, "SQL generation failed");
  return data.sql || "";
}

export async function executeQuery(question: string, sql: string): Promise<QueryResponse> {
  return requestJson<QueryResponse>(`${API_BASE}/api/query/execute/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, sql })
  }, "Query execution failed");
}

export async function explainQuery(sql: string, question = ""): Promise<string> {
  const data = await requestJson<{ explanation?: string }>(`${API_BASE}/api/explain/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql, question })
  }, "Explanation failed");
  return data.explanation || "";
}

export async function fetchHistory() {
  return requestJson<Array<Record<string, unknown>>>(
    `${API_BASE}/api/history/`,
    { cache: "no-store" },
    "Failed to fetch history"
  );
}

export async function fetchFavorites(): Promise<FavoriteItem[]> {
  return requestJson<FavoriteItem[]>(`${API_BASE}/api/favorites/`, { cache: "no-store" }, "Failed to load favorites");
}

export async function saveFavorite(payload: { title?: string; question: string; sql_query: string }): Promise<FavoriteItem> {
  return requestJson<FavoriteItem>(`${API_BASE}/api/favorites/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }, "Failed to save favorite");
}

export async function deleteFavorite(id: number): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${API_BASE}/api/favorites/${id}/`, { method: "DELETE", signal: controller.signal });
    if (!res.ok) throw await parseApiError(res, "Failed to delete favorite");
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out. Please try again.", "request_timeout", 408);
    }
    throw new ApiError("Unable to connect to the server. Please try again.", "network_error");
  } finally {
    clearTimeout(timeout);
  }
}
