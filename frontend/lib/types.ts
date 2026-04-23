export type QueryResponse = {
  columns: string[];
  rows: Array<Array<string | number | null>>;
  sql: string;
  explanation?: string;
  chart: {
    type: "bar" | "line" | "pie" | "table" | "none";
    xKey: string | null;
    yKey: string | null;
  };
  error?: string;
};

export type FavoriteItem = {
  id: number;
  title: string;
  question: string;
  sql_query: string;
  created_at: string;
};

export type SchemaResponse = {
  relationships: {
    primary_keys: Array<{ table: string; column: string }>;
    foreign_keys: Array<{ table: string; column: string; ref_table: string; ref_column: string }>;
  };
  tables: Record<
    string,
    {
      columns: Array<{ name: string; type: string; nullable?: boolean; unique?: boolean }>;
      row_count?: number;
      sample_rows: Array<Array<string | number | null>>;
      sample_columns: string[];
    }
  >;
};
