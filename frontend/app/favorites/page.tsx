"use client";

import { useEffect, useState } from "react";
import { deleteFavorite, fetchFavorites } from "@/lib/api";
import { normalizeError } from "@/lib/error-utils";
import { FavoriteItem } from "@/lib/types";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const data = await fetchFavorites();
      setFavorites(data);
      setPageError("");
    } catch (error) {
      setPageError(normalizeError(error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(favorites.length / pageSize));
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [favorites.length, page]);

  const onDelete = async (item: FavoriteItem) => {
    try {
      await deleteFavorite(item.id);
      setFavorites((prev) => prev.filter((fav) => fav.id !== item.id));
      setPageError("");
    } catch (error) {
      setPageError(normalizeError(error).message);
    }
  };

  const totalPages = Math.max(1, Math.ceil(favorites.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedFavorites = favorites.slice(startIndex, startIndex + pageSize);

  return (
    <div className="card">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-600/90">Saved SQL</p>
          <h2 className="text-xl font-semibold sm:text-2xl">
            <span className="gradient-title">Favorite Queries</span>
          </h2>
        </div>
        <button className="ghost-btn w-full sm:w-auto" onClick={loadFavorites} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="space-y-3">
        {pageError && (
          <div className="error-callout">
            <p className="error-title">Could not complete action</p>
            <p className="error-detail">{pageError}</p>
          </div>
        )}
        {favorites.length === 0 && <p className="text-sm text-slate-500">No favorites saved yet.</p>}
        {paginatedFavorites.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200/80 bg-white/80 p-3 text-xs sm:text-sm">
            <p className="font-semibold text-slate-800">{item.title}</p>
            <p className="mt-1 text-xs text-slate-600">{item.question}</p>
            <div className="sql-shell mt-2">
              <span className="sql-label">SQL</span>
              <pre className="sql-text">{item.sql_query}</pre>
            </div>
            <div className="mt-2 flex gap-2">
              <button className="ghost-btn text-red-600" onClick={() => onDelete(item)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {favorites.length > pageSize && (
          <div className="flex flex-col items-start justify-between gap-2 pt-2 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                className="ghost-btn disabled:opacity-50"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <button
                className="ghost-btn disabled:opacity-50"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
