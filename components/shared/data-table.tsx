"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DataTableColumn<TData> {
  key: keyof TData;
  header: string;
  render?: (value: TData[keyof TData], row: TData) => ReactNode;
}

interface DataTableProps<TData extends object> {
  rows: TData[];
  columns: DataTableColumn<TData>[];
  rowKey: (row: TData) => string;
}

export function DataTable<TData extends object>({
  rows,
  columns,
  rowKey,
}: DataTableProps<TData>) {
  const [sortKey, setSortKey] = useState<keyof TData>(columns[0]?.key);
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const left = String(a[sortKey as keyof TData] ?? "");
      const right = String(b[sortKey as keyof TData] ?? "");
      const result = left.localeCompare(right, undefined, { numeric: true });
      return direction === "asc" ? result : -result;
    });
  }, [direction, rows, sortKey]);

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead className="bg-[var(--color-surface)]">
          <tr>
            {columns.map((column, columnIndex) => (
              <th
                key={`${String(column.key)}-${columnIndex}`}
                className="px-4 py-3 text-left font-semibold text-[var(--color-text)]"
              >
                <button
                  className="flex items-center gap-2"
                  onClick={() => {
                    if (sortKey === column.key) {
                      setDirection(direction === "asc" ? "desc" : "asc");
                    } else {
                      setSortKey(column.key);
                      setDirection("asc");
                    }
                  }}
                >
                  {column.header}
                  <span className={cn("text-xs", sortKey === column.key ? "opacity-100" : "opacity-30")}>
                    {direction === "asc" ? "ASC" : "DESC"}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={rowKey(row)} className="border-t border-[var(--color-border)]">
              {columns.map((column, columnIndex) => {
                const value = row[column.key as keyof TData];
                return (
                  <td
                    key={`${String(column.key)}-${columnIndex}-${rowKey(row)}`}
                    className="px-4 py-3 text-[var(--color-text-muted)]"
                  >
                    {column.render ? column.render(value, row) : String(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
