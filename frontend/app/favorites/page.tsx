"use client";

import { useEffect, useState } from "react";
import { deleteFavorite, fetchFavorites } from "@/lib/api";
import { FavoriteItem } from "@/lib/types";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const data = await fetchFavorites();
      setFavorites(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const onDelete = async (item: FavoriteItem) => {
    try {
      await deleteFavorite(item.id);
      setFavorites((prev) => prev.filter((fav) => fav.id !== item.id));
    } catch {
      // Keep page stable even if delete fails.
    }
  };

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-600/90">Saved SQL</p>
          <h2 className="text-2xl font-semibold">
            <span className="gradient-title">Favorite Queries</span>
          </h2>
        </div>
        <button className="ghost-btn" onClick={loadFavorites} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="space-y-3">
        {favorites.length === 0 && <p className="text-sm text-slate-500">No favorites saved yet.</p>}
        {favorites.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200/80 bg-white/80 p-3 text-sm">
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
      </div>
    </div>
  );
}
