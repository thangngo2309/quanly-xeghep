"use client";

import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
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

  height?: number | string;
  sx?: SxProps<Theme>;
  dataGridProps?: Partial<DataGridProps<TRow>>;
};

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

  height = 620,
  sx,
  dataGridProps,
}: HDataTableProps<TRow, TSearch>) {
  const hasHeader = title || description || actions || onRefresh;
  const hasSearch = searchMethods && onSearch && searchContent;

  function handleResetSearch() {
    searchMethods?.reset();
    onResetSearch?.();
  }

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
          <CardContent sx={{ pb: 2 }}>
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
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
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

              <Stack
                spacing={1}
                sx={{
                  flexDirection: "row",
                  justifyContent: {
                    xs: "flex-start",
                    md: "flex-end",
                  },
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
              </Stack>
            </Stack>
          </CardContent>

          <Divider />
        </>
      )}

      {hasSearch && (
        <>
          <CardContent>
            <HForm methods={searchMethods} onSubmit={onSearch}>
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                      md: "repeat(4, minmax(0, 1fr))",
                    },
                    gap: 2,
                  }}
                >
                  {searchContent}
                </Box>

                <Stack
                  spacing={1}
                  sx={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                  }}
                >
                  {onResetSearch && (
                    <Button
                      variant="outlined"
                      onClick={handleResetSearch}
                      disabled={loading}
                    >
                      Xóa lọc
                    </Button>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SearchIcon />}
                    disabled={loading}
                  >
                    Tìm kiếm
                  </Button>
                </Stack>
              </Stack>
            </HForm>
          </CardContent>

          <Divider />
        </>
      )}

      <Box sx={{ height, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          loading={loading}
          getRowId={getRowId}
          paginationMode="server"
          sortingMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          sortModel={sortModel}
          onSortModelChange={onSortModelChange}
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
