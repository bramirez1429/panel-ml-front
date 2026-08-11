"use client";

import {
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  type ColumnDef,
  type RowData,
  useTable,
} from "@tanstack/react-table";

import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";

import { useMemo } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/*
 * Features generales de NUESTRA DataTable.
 *
 * Más adelante podemos agregar:
 * - filtros
 * - búsqueda global
 * - selección de filas
 * - columnas ocultables
 */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,

  rowPaginationFeature,

  sortedRowModel: createSortedRowModel(),

  paginatedRowModel: createPaginatedRowModel(),

  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    datetime: sortFn_datetime,
  },
});

export type DataTableColumn<TData extends RowData> = ColumnDef<
  typeof dataTableFeatures,
  TData
>;

type DataTableProps<TData extends RowData> = Readonly<{
  columns: readonly DataTableColumn<TData>[];
  data: readonly TData[];

  emptyMessage?: string;

  sorting?: boolean;

  pagination?: boolean;
  pageSize?: number;
}>;

export function DataTable<TData extends RowData>({
  columns,
  data,
  emptyMessage = "No hay datos para mostrar.",
  sorting = false,
  pagination = false,
  pageSize = 10,
}: DataTableProps<TData>) {
  /*
   * TanStack recomienda que data y columns tengan
   * referencias estables.
   */
  const tableData = useMemo(() => [...data], [data]);

  const tableColumns = useMemo(
    () => [...columns],
    [columns],
  );

  const table = useTable({
    features: dataTableFeatures,

    columns: tableColumns,

    data: tableData,

    /*
     * Si pagination = false,
     * le indicamos que NO pagine los datos internamente.
     */
    manualPagination: !pagination,

    /*
     * Lo mismo para sorting.
     */
    manualSorting: !sorting,

    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-[12px] border border-dashboard-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-dashboard-control">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-dashboard-border hover:bg-transparent"
                >
                  {headerGroup.headers.map((header) => {
                    const canSort =
                      sorting &&
                      header.column.getCanSort();

                    const sorted =
                      header.column.getIsSorted();

                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className="h-12 whitespace-nowrap px-4 text-xs font-semibold uppercase tracking-wide text-dashboard-muted"
                      >
                        {header.isPlaceholder ? null : (
                          <button
                            type="button"
                            disabled={!canSort}
                            onClick={
                              canSort
                                ? header.column.getToggleSortingHandler()
                                : undefined
                            }
                            className={`inline-flex items-center gap-2 ${
                              canSort
                                ? "cursor-pointer transition-colors hover:text-dashboard-foreground"
                                : "cursor-default"
                            }`}
                          >
                            <table.FlexRender
                              header={header}
                            />

                            {canSort &&
                              (sorted === "asc" ? (
                                <ChevronUp
                                  aria-hidden="true"
                                  className="h-4 w-4"
                                />
                              ) : sorted === "desc" ? (
                                <ChevronDown
                                  aria-hidden="true"
                                  className="h-4 w-4"
                                />
                              ) : (
                                <ArrowUpDown
                                  aria-hidden="true"
                                  className="h-3.5 w-3.5 opacity-45"
                                />
                              ))}
                          </button>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-dashboard-border transition-colors hover:bg-dashboard-control"
                  >
                    {row.getAllCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-4 py-3.5 text-dashboard-foreground"
                      >
                        <table.FlexRender
                          cell={cell}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={tableColumns.length}
                    className="h-32 text-center text-sm text-dashboard-muted"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {pagination && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-dashboard-muted">
            Página{" "}
            <span className="font-semibold text-dashboard-foreground">
              {table.state.pagination.pageIndex + 1}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-dashboard-foreground">
              {table.getPageCount()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="inline-flex h-9 items-center gap-1 rounded-[10px] border border-dashboard-border bg-card px-3 text-sm font-medium text-dashboard-foreground transition-colors hover:bg-dashboard-control disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft
                aria-hidden="true"
                className="h-4 w-4"
              />

              Anterior
            </button>

            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="inline-flex h-9 items-center gap-1 rounded-[10px] border border-dashboard-border bg-card px-3 text-sm font-medium text-dashboard-foreground transition-colors hover:bg-dashboard-control disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente

              <ChevronRight
                aria-hidden="true"
                className="h-4 w-4"
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}