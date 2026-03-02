"use client";

import { useState, useMemo } from "react";
import type { ReactNode } from "react";

// Generic column configuration — works with any data shape
interface ColumnConfig<T> {
  key: keyof T;
  label: string;
  // If true, this column is included in search filtering
  searchable?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SearchableTableProps<T extends Record<string, any>> {
  data: T[];
  columns: ColumnConfig<T>[];
  // Optional: key to use for category filtering
  categoryKey?: keyof T;
  // Optional: label for the category filter dropdown
  categoryLabel?: string;
  // Optional: placeholder text for search input
  searchPlaceholder?: string;
  // Optional: render custom row actions (for example "Add to report")
  renderRowActions?: (item: T) => ReactNode;
}

// Highlights matching search terms within text
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  const isMatch = (part: string) => {
    const nonGlobal = new RegExp(regex.source, "i");
    return nonGlobal.test(part);
  };

  return (
    <>
      {parts.map((part, i) =>
        isMatch(part) ? (
          <mark key={i} className="bg-[var(--primary)]/30 text-[var(--foreground)] rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SearchableTable<T extends Record<string, any>>({
  data,
  columns,
  categoryKey,
  categoryLabel = "Category",
  searchPlaceholder = "Search...",
  renderRowActions,
}: SearchableTableProps<T>) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Extract unique categories from data
  const categories = useMemo(() => {
    if (!categoryKey) return [];
    const unique = new Set(data.map((item) => String(item[categoryKey])));
    return Array.from(unique).sort();
  }, [data, categoryKey]);

  // Filter data by search and category
  const filtered = useMemo(() => {
    return data.filter((item) => {
      // Category filter
      if (categoryKey && selectedCategory !== "all") {
        if (String(item[categoryKey]) !== selectedCategory) return false;
      }

      // Search filter — match across all searchable columns
      if (search.trim()) {
        const query = search.toLowerCase();
        const searchableCols = columns.filter((c) => c.searchable !== false);
        return searchableCols.some((col) =>
          String(item[col.key]).toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [data, columns, search, selectedCategory, categoryKey]);

  return (
    <div className="space-y-4">
      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="flex-1 px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        {categoryKey && categories.length > 0 && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] min-w-[160px]"
          >
            <option value="all">All {categoryLabel}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Result count */}
      <p className="text-sm text-[var(--muted-foreground)]">
        {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        {search && ` for "${search}"`}
      </p>

      {/* No results */}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-[var(--muted-foreground)]">
          <p className="text-lg mb-1">No results found</p>
          <p className="text-sm">Try adjusting your search or filter</p>
        </div>
      )}

      {/* Desktop table — hidden on mobile */}
      {filtered.length > 0 && (
        <div className="hidden md:block overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--card)]">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]"
                  >
                    {col.label}
                  </th>
                ))}
                {renderRowActions && (
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent)]/50"
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3 align-top">
                      <HighlightMatch
                        text={String(item[col.key])}
                        query={search}
                      />
                    </td>
                  ))}
                  {renderRowActions && (
                    <td className="px-4 py-3 align-top">{renderRowActions(item)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards — visible only on mobile */}
      {filtered.length > 0 && (
        <div className="md:hidden space-y-3">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] space-y-2"
            >
              {columns.map((col) => (
                <div key={String(col.key)}>
                  <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                    {col.label}
                  </span>
                  <p className="text-sm mt-0.5">
                    <HighlightMatch
                      text={String(item[col.key])}
                      query={search}
                    />
                  </p>
                </div>
              ))}
              {renderRowActions && (
                <div className="pt-1">{renderRowActions(item)}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
