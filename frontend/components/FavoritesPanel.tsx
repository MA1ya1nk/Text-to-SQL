"use client";

import { FavoriteItem } from "@/lib/types";

type Props = {
  favorites: FavoriteItem[];
  onUse: (item: FavoriteItem) => void;
  onDelete: (item: FavoriteItem) => void;
};

export function FavoritesPanel({ favorites, onUse, onDelete }: Props) {
  return (
    <div className="card min-w-0 space-y-3">
      <h3 className="font-semibold text-slate-800">Favorites</h3>
      {favorites.length === 0 && <p className="text-sm text-slate-500">No favorites saved yet.</p>}
      {favorites.map((item) => (
        <div key={item.id} className="min-w-0 rounded-xl border border-slate-200/80 bg-white/75 p-3 text-sm shadow-sm">
          <p className="truncate font-medium text-slate-800">{item.title}</p>
          <p className="mt-1 text-xs text-slate-600">{item.question.slice(0, 120)}{item.question.length > 120 ? "..." : ""}</p>
          <div className="sql-shell mt-2">
            <span className="sql-label">SQL</span>
            <pre className="sql-text">{item.sql_query}</pre>
          </div>
          <div className="mt-2 flex gap-2">
            <button className="ghost-btn" onClick={() => onUse(item)}>
              Use
            </button>
            <button className="ghost-btn text-red-600" onClick={() => onDelete(item)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
