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
  // Optional: stable identifier for compare/expand state
  getItemId?: (item: T, index: number) => string;
  // Optional: fields to show in compact mobile card summary
  mobileSummaryKeys?: (keyof T)[];
  // Optional: enable compare selections UI
  enableCompare?: boolean;
  // Optional: max items to compare side by side
  maxCompareSelections?: number;
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
  getItemId,
  mobileSummaryKeys,
  enableCompare = true,
  maxCompareSelections = 3,
}: SearchableTableProps<T>) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const indexedData = useMemo(() => {
    return data.map((item, index) => ({
      item,
      id: getItemId ? getItemId(item, index) : String(index),
    }));
  }, [data, getItemId]);

  // Extract unique categories from data
  const categories = useMemo(() => {
    if (!categoryKey) return [];
    const unique = new Set(data.map((item) => String(item[categoryKey])));
    return Array.from(unique).sort();
  }, [data, categoryKey]);

  const searchableCols = useMemo(
    () => columns.filter((column) => column.searchable !== false),
    [columns]
  );

  // Filter data by search + category while retaining stable IDs
  const filtered = useMemo(() => {
    return indexedData.filter(({ item }) => {
      // Category filter
      if (categoryKey && selectedCategory !== "all") {
        if (String(item[categoryKey]) !== selectedCategory) return false;
      }

      // Search filter — match across all searchable columns
      if (search.trim()) {
        const query = search.toLowerCase();
        return searchableCols.some((col) =>
          String(item[col.key]).toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [indexedData, search, selectedCategory, categoryKey, searchableCols]);

  const summaryKeys = useMemo(() => {
    if (mobileSummaryKeys && mobileSummaryKeys.length > 0) {
      return mobileSummaryKeys;
    }
    const fallback = columns.slice(0, 2).map((col) => col.key);
    return fallback;
  }, [mobileSummaryKeys, columns]);

  const compareRows = useMemo(
    () => indexedData.filter((row) => compareIds.includes(row.id)),
    [indexedData, compareIds]
  );

  function toggleExpanded(id: string) {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  }

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((value) => value !== id);
      }
      if (prev.length >= maxCompareSelections) {
        return prev;
      }
      return [...prev, id];
    });
  }

  function clearCompare() {
    setCompareIds([]);
  }

  return (
    <div className="space-y-4">
      {/* Sticky mobile controls */}
      <div className="sticky top-0 z-20 -mx-2 px-2 py-2 bg-[var(--background)]/95 backdrop-blur border-b border-[var(--border)] md:static md:mx-0 md:px-0 md:py-0 md:bg-transparent md:backdrop-blur-0 md:border-0">
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

      {/* Compare panel */}
      {enableCompare && compareIds.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                Compare Selections
              </p>
              <p className="text-sm font-medium">
                {compareIds.length} of {maxCompareSelections} selected
              </p>
            </div>
            <button
              onClick={clearCompare}
              className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-[var(--border)] hover:bg-[var(--accent)]"
            >
              Clear
            </button>
          </div>

          {compareRows.length > 0 && (
            <div className="overflow-x-auto rounded-md border border-[var(--border)]">
              <table className="min-w-[640px] w-full text-sm">
                <thead>
                  <tr className="bg-[var(--accent)]/50 border-b border-[var(--border)]">
                    <th className="text-left px-3 py-2 text-[var(--muted-foreground)]">
                      Field
                    </th>
                    {compareRows.map((row) => {
                      const primary = summaryKeys[0];
                      return (
                        <th key={row.id} className="text-left px-3 py-2">
                          {String(row.item[primary])}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {columns.map((column) => (
                    <tr key={String(column.key)} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-3 py-2 text-[var(--muted-foreground)] font-medium">
                        {column.label}
                      </td>
                      {compareRows.map((row) => (
                        <td key={`${row.id}-${String(column.key)}`} className="px-3 py-2 align-top">
                          {String(row.item[column.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                {enableCompare && (
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">
                    Compare
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent)]/50"
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3 align-top">
                      <HighlightMatch
                        text={String(row.item[col.key])}
                        query={search}
                      />
                    </td>
                  ))}
                  {renderRowActions && (
                    <td className="px-4 py-3 align-top">{renderRowActions(row.item)}</td>
                  )}
                  {enableCompare && (
                    <td className="px-4 py-3 align-top">
                      <button
                        onClick={() => toggleCompare(row.id)}
                        disabled={
                          !compareIds.includes(row.id) &&
                          compareIds.length >= maxCompareSelections
                        }
                        className={`px-2.5 py-1.5 rounded-md text-xs font-medium border ${
                          compareIds.includes(row.id)
                            ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10"
                            : "border-[var(--border)] hover:bg-[var(--accent)]"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {compareIds.includes(row.id) ? "Selected" : "Compare"}
                      </button>
                    </td>
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
          {filtered.map((row) => {
            const isExpanded = expandedIds.includes(row.id);
            const isSelectedForCompare = compareIds.includes(row.id);
            const compareDisabled =
              !isSelectedForCompare && compareIds.length >= maxCompareSelections;

            return (
            <div
              key={row.id}
              className="p-3 rounded-lg bg-[var(--card)] border border-[var(--border)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {summaryKeys.map((key, idx) => {
                    const column = columns.find((col) => col.key === key);
                    if (!column) return null;
                    const value = String(row.item[key]);
                    return (
                      <div key={`${row.id}-${String(key)}`}>
                        <p className={`text-xs uppercase tracking-wide ${idx === 0 ? "text-[var(--muted-foreground)]" : "text-[var(--muted-foreground)]/80"}`}>
                          {column.label}
                        </p>
                        <p className={`${idx === 0 ? "text-sm font-semibold" : "text-sm text-[var(--muted-foreground)]"} truncate`}>
                          <HighlightMatch text={value} query={search} />
                        </p>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => toggleExpanded(row.id)}
                  className="px-2 py-1.5 rounded-md border border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] shrink-0"
                >
                  {isExpanded ? "Hide" : "Details"}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {enableCompare && (
                  <button
                    onClick={() => toggleCompare(row.id)}
                    disabled={compareDisabled}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium border ${
                      isSelectedForCompare
                        ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10"
                        : "border-[var(--border)] hover:bg-[var(--accent)]"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSelectedForCompare ? "Selected" : "Compare"}
                  </button>
                )}
                {renderRowActions && <div>{renderRowActions(row.item)}</div>}
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
                  {columns.map((col) => (
                    <div key={String(col.key)}>
                      <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                        {col.label}
                      </span>
                      <p className="text-sm mt-0.5">
                        <HighlightMatch
                          text={String(row.item[col.key])}
                          query={search}
                        />
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
