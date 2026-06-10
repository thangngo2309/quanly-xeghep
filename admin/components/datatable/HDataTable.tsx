"use client";

import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import {
  DataGrid,
  type DataGridProps,
  type GridColDef,
  type GridPaginationModel,
  type GridRowIdGetter,
  type GridSortModel,
  type GridValidRowModel,
} from "@mui/x-data-grid";
import type {
  FieldValues,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";
import { HForm } from "@/components/form";
import { useCallback } from "react";

type HDataTableProps<
  TRow extends GridValidRowModel,
  TSearch extends FieldValues = FieldValues
> = {
  title?: string;
  description?: string;

  rows: TRow[];
  columns: GridColDef<TRow>[];
  rowCount: number;
  loading?: boolean;

  getRowId?: GridRowIdGetter<TRow>;

  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;

  sortModel?: GridSortModel;
  onSortModelChange?: (model: GridSortModel) => void;

  pageSizeOptions?: number[];

  searchMethods?: UseFormReturn<TSearch>;
  onSearch?: SubmitHandler<TSearch>;
  searchContent?: React.ReactNode;
  onResetSearch?: () => void;

  actions?: React.ReactNode;
  onRefresh?: () => void;

  /**
   * Nếu không truyền height, table sẽ tự tính theo số dòng.
   * Nếu muốn cố định chiều cao thì truyền height={520}
   */
  height?: number;
  minHeight?: number;
  maxHeight?: number;

  sx?: SxProps<Theme>;
  dataGridProps?: Partial<DataGridProps<TRow>>;
};

function isSamePaginationModel(
  current: GridPaginationModel,
  next: GridPaginationModel
) {
  return current.page === next.page && current.pageSize === next.pageSize;
}

function isSameSortModel(current?: GridSortModel, next?: GridSortModel) {
  const currentItem = current?.[0];
  const nextItem = next?.[0];

  return (
    currentItem?.field === nextItem?.field &&
    currentItem?.sort === nextItem?.sort &&
    (current?.length || 0) === (next?.length || 0)
  );
}

function deferCallback(callback: () => void) {
  setTimeout(callback, 0);
}

export function HDataTable<
  TRow extends GridValidRowModel,
  TSearch extends FieldValues = FieldValues
>({
  title,
  description,

  rows,
  columns,
  rowCount,
  loading = false,

  getRowId,

  paginationModel,
  onPaginationModelChange,

  sortModel,
  onSortModelChange,

  pageSizeOptions = [10, 20, 50, 100],

  searchMethods,
  onSearch,
  searchContent,
  onResetSearch,

  actions,
  onRefresh,

  height,
  minHeight = 260,
  maxHeight = 520,

  sx,
  dataGridProps,
}: HDataTableProps<TRow, TSearch>) {
  const hasHeader = title || description || actions || onRefresh;
  const hasSearch = searchMethods && onSearch && searchContent;

  const calculatedHeight =
    height ??
    Math.min(
      maxHeight,
      Math.max(minHeight, 56 + Math.max(rows.length, 1) * 52 + 56 + 18)
    );

  function handleResetSearch() {
    searchMethods?.reset();
    onResetSearch?.();
  }

  const handleDataGridPaginationModelChange = useCallback(
    (model: GridPaginationModel) => {
      if (isSamePaginationModel(paginationModel, model)) {
        return;
      }

      deferCallback(() => {
        onPaginationModelChange(model);
      });
    },
    [paginationModel, onPaginationModelChange]
  );

  const handleDataGridSortModelChange = useCallback(
    (model: GridSortModel) => {
      if (!onSortModelChange) {
        return;
      }

      if (isSameSortModel(sortModel, model)) {
        return;
      }

      deferCallback(() => {
        onSortModelChange(model);
      });
    },
    [sortModel, onSortModelChange]
  );

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        overflow: "hidden",
        ...sx,
      }}
    >
      {hasHeader && (
        <>
          <CardContent sx={{ py: 2 }}>
            <Stack
              spacing={2}
              sx={{
                flexDirection: {
                  xs: "column",
                  md: "row",
                },
                alignItems: {
                  xs: "stretch",
                  md: "center",
                },
                justifyContent: "space-between",
              }}
            >
              <Box>
                {title && (
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, fontSize: 20 }}
                  >
                    {title}
                  </Typography>
                )}

                {description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {description}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  justifyContent: {
                    xs: "flex-start",
                    md: "flex-end",
                  },
                  flexWrap: "wrap",
                }}
              >
                {onRefresh && (
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={onRefresh}
                    disabled={loading}
                  >
                    Tải lại
                  </Button>
                )}

                {actions}
              </Box>
            </Stack>
          </CardContent>

          <Divider />
        </>
      )}

      {hasSearch && (
        <>
          <CardContent sx={{ py: 1.75 }}>
            <HForm methods={searchMethods} onSubmit={onSearch}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: {
                    xs: "stretch",
                    md: "flex-start",
                  },
                  justifyContent: "space-between",
                  gap: 1.5,
                  flexDirection: {
                    xs: "column",
                    md: "row",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1.5,
                    flex: 1,
                    minWidth: 0,
                    "& > *": {
                      width: {
                        xs: "100%",
                        sm: 280,
                        md: 300,
                      },
                    },
                  }}
                >
                  {searchContent}
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    justifyContent: {
                      xs: "flex-start",
                      md: "flex-end",
                    },
                    flexShrink: 0,
                    pt: {
                      xs: 0,
                      md: 0,
                    },
                  }}
                >
                  {onResetSearch && (
                    <Button
                      variant="outlined"
                      onClick={handleResetSearch}
                      disabled={loading}
                      size="medium"
                      sx={{
                        minWidth: 100,
                      }}
                    >
                      Xóa lọc
                    </Button>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SearchIcon />}
                    disabled={loading}
                    size="medium"
                    sx={{
                      minWidth: 120,
                    }}
                  >
                    Tìm kiếm
                  </Button>
                </Box>
              </Box>
            </HForm>
          </CardContent>

          <Divider />
        </>
      )}

      <Box sx={{ height: calculatedHeight, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          loading={loading}
          getRowId={getRowId}
          paginationMode="server"
          sortingMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={handleDataGridPaginationModelChange}
          sortModel={sortModel}
          onSortModelChange={handleDataGridSortModelChange}
          pageSizeOptions={pageSizeOptions}
          disableRowSelectionOnClick
          density="comfortable"
          sx={{
            border: 0,
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: "#f8fafc",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 800,
            },
          }}
          {...dataGridProps}
        />
      </Box>
    </Card>
  );
}
