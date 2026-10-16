"use client";

import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

export interface Column<T> {
  id: string;
  header: string;
  accessor: (row: T) => string | number | Date;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
}

export function DataTable<T>({ rows, columns, getRowId }: DataTableProps<T>) {
  const [sort, setSort] = useState<{
    columnId: string;
    direction: SortDirection;
  } | null>(null);

  const sortedRows = useMemo(() => {
    if (!sort) {
      return rows;
    }

    const column = columns.find((candidate) => candidate.id === sort.columnId);
    if (!column) {
      return rows;
    }

    const factor = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = column.accessor(a);
      const right = column.accessor(b);
      if (left < right) return -1 * factor;
      if (left > right) return 1 * factor;
      return 0;
    });
  }, [rows, columns, sort]);

  return (
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.id}
              aria-sort={
                sort?.columnId === column.id
                  ? sort.direction === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
              }
            >
              {column.sortable ? (
                <button
                  type="button"
                  onClick={() =>
                    setSort((current) =>
                      current?.columnId === column.id &&
                      current.direction === "asc"
                        ? { columnId: column.id, direction: "desc" }
                        : { columnId: column.id, direction: "asc" },
                    )
                  }
                >
                  {column.header}
                </button>
              ) : (
                column.header
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row) => (
          <tr key={getRowId(row)}>
            {columns.map((column) => (
              <td key={column.id}>{String(column.accessor(row))}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
