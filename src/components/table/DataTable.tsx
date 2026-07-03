"use client";

import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TablePagination from "@mui/material/TablePagination";
import Typography from "@mui/material/Typography";

export type SortDir = "asc" | "desc";

export interface Column<T> {
  id: string;
  label: string;
  align?: "left" | "right" | "center";
  /** Habilita ordenação por este header. Requer `sortAccessor`. */
  sortable?: boolean;
  /** Valor usado para ordenar (número ou string). */
  sortAccessor?: (row: T) => string | number;
  /** Conteúdo da célula. */
  render: (row: T) => React.ReactNode;
  width?: number | string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  initialSort?: { columnId: string; dir: SortDir };
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  emptyMessage?: string;
  minWidth?: number;
  /** Substantivo para a contagem: ex. ["pedido", "pedidos"]. */
  countLabel?: [singular: string, plural: string];
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  initialSort,
  rowsPerPageOptions = [10, 25, 50],
  defaultRowsPerPage = 10,
  emptyMessage = "Nenhum item encontrado.",
  minWidth = 800,
  countLabel = ["item", "itens"],
}: DataTableProps<T>) {
  const [sortColumnId, setSortColumnId] = useState(initialSort?.columnId ?? "");
  const [sortDir, setSortDir] = useState<SortDir>(initialSort?.dir ?? "desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  // Volta à primeira página quando o conjunto (filtros) muda.
  useEffect(() => {
    setPage(0);
  }, [rows]);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.id === sortColumnId);
    if (!col?.sortAccessor) return rows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sortAccessor!(a);
      const bv = col.sortAccessor!(b);
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }
      return String(av).localeCompare(String(bv), "pt-BR") * dir;
    });
  }, [rows, columns, sortColumnId, sortDir]);

  const paged = useMemo(
    () => sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sorted, page, rowsPerPage]
  );

  const toggleSort = (columnId: string) => {
    if (sortColumnId === columnId) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumnId(columnId);
      setSortDir("asc");
    }
  };

  const [singular, plural] = countLabel;
  const total = rows.length;

  return (
    <Box>
      {/* Contagem total */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="body2" color="text.secondary">
          {total} {total === 1 ? singular : plural}
        </Typography>
      </Box>

      <TableContainer>
        <Table sx={{ minWidth }}>
          <TableHead>
            <TableRow sx={{ "& th": { color: "text.secondary", whiteSpace: "nowrap" } }}>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align}
                  sortDirection={sortColumnId === col.id ? sortDir : false}
                  sx={{ width: col.width }}
                >
                  {col.sortable && col.sortAccessor ? (
                    <TableSortLabel
                      active={sortColumnId === col.id}
                      direction={sortColumnId === col.id ? sortDir : "asc"}
                      onClick={() => toggleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.map((row) => (
              <TableRow
                key={getRowId(row)}
                hover={!!onRowClick}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={{
                  cursor: onRowClick ? "pointer" : "default",
                  "&:last-child td": { border: 0 },
                }}
              >
                {columns.map((col) => (
                  <TableCell key={col.id} align={col.align} sx={{ width: col.width }}>
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  sx={{ py: 6, textAlign: "center", color: "text.secondary" }}
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={rowsPerPageOptions}
        labelRowsPerPage="Itens por página"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        sx={{ borderTop: "1px solid", borderColor: "divider" }}
      />
    </Box>
  );
}

export default DataTable;
